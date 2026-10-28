import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { generateMovementNumber } from '../../utils/generateMovementNumber';
import { MOVEMENT_TYPES } from '../../constants/movementTypes';
import { handleFirestoreError } from '../../utils/AppError';

const MOVEMENTS_COLLECTION = 'inventory_movements';

/**
 * Subscribe to real-time updates for inventory movements
 */
export const subscribeMovements = (onNext, onError) => {
  try {
    const movementsRef = collection(db, MOVEMENTS_COLLECTION);
    const q = query(movementsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const movements = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        onNext(movements);
      },
      (error) => {
        if (onError) onError(handleFirestoreError(error));
      }
    );
  } catch (error) {
    if (onError) onError(handleFirestoreError(error));
  }
};

/**
 * Fetch all inventory movements, sorted by creation date descending
 */
export const getMovements = async () => {
  try {
    const movementsRef = collection(db, MOVEMENTS_COLLECTION);
    const q = query(movementsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Fetch a single movement by ID
 */
export const getMovement = async (id) => {
  try {
    const docRef = doc(db, MOVEMENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Запись о перемещении не найдена');
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Fetch recent movements with limit
 */
export const getRecentMovements = async (limitNum = 10) => {
  try {
    const movementsRef = collection(db, MOVEMENTS_COLLECTION);
    const q = query(movementsRef, orderBy('createdAt', 'desc'), limit(limitNum));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Fetch movements associated with a specific product ID
 */
export const getMovementsByProduct = async (productId) => {
  try {
    const movementsRef = collection(db, MOVEMENTS_COLLECTION);
    const q = query(
      movementsRef,
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Creates a new stock movement and updates the product quantity inside a transaction
 */
export const createMovement = async (movementData) => {
  try {
    const {
      type,
      productId,
      quantity,
      managerId,
      managerName,
      comment = ''
    } = movementData;

    // Validations
    if (!type || !productId || !managerId || !managerName) {
      throw new Error('Неполные данные: требуется указать товар, тип операции и менеджера.');
    }

    const qty = parseInt(quantity, 10);
    // ADJUSTMENT sets the target stock, so 0 is allowed; other types move a positive amount
    const minQty = type === MOVEMENT_TYPES.ADJUSTMENT ? 0 : 1;
    if (isNaN(qty) || qty < minQty) {
      throw new Error(
        type === MOVEMENT_TYPES.ADJUSTMENT
          ? 'Новый остаток должен быть целым числом не меньше нуля.'
          : 'Количество должно быть положительным целым числом больше нуля.'
      );
    }

    const productRef = doc(db, 'products', productId);
    const counterRef = doc(db, 'counters', 'inventory_movements');
    const movementDocRef = doc(collection(db, MOVEMENTS_COLLECTION));

    return await runTransaction(db, async (transaction) => {
      // 1. Get product current stock
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) {
        throw new Error('Указанный товар не существует.');
      }
      const productData = productSnap.data();

      // 2. Read & Increment movement number counter
      const counterSnap = await transaction.get(counterRef);
      let nextNum = 1;
      if (counterSnap.exists()) {
        nextNum = (counterSnap.data().current || 0) + 1;
      }

      const stockBefore = productData.quantity || 0;
      let stockAfter;

      // 3. Compute stock changes
      if (type === MOVEMENT_TYPES.IN || type === MOVEMENT_TYPES.RETURN) {
        stockAfter = stockBefore + qty;
      } else if (type === MOVEMENT_TYPES.OUT) {
        stockAfter = stockBefore - qty;
      } else if (type === MOVEMENT_TYPES.ADJUSTMENT) {
        // Physical stock adjustment sets the target quantity directly
        stockAfter = qty;
      } else {
        throw new Error(`Неподдерживаемый тип операции: ${type}`);
      }

      // Validation: Stock cannot drop below zero
      if (stockAfter < 0) {
        throw new Error(
          `Операция отклонена: на складе недостаточно товара (${productData.name}). Текущий остаток: ${stockBefore}, попытка списания: ${qty}.`
        );
      }

      const movementNumber = generateMovementNumber(nextNum);

      // 4. Perform database updates
      // Update product quantity
      transaction.update(productRef, {
        quantity: stockAfter,
        updatedAt: serverTimestamp()
      });

      // Update global counter
      transaction.set(counterRef, { current: nextNum }, { merge: true });

      // Save movement document
      const finalMovementDoc = {
        movementNumber,
        type,
        productId,
        productName: productData.name,
        barcode: productData.barcode,
        quantity: type === MOVEMENT_TYPES.ADJUSTMENT ? Math.abs(stockAfter - stockBefore) : qty,
        stockBefore,
        stockAfter,
        managerId,
        managerName,
        comment: comment.trim(),
        createdAt: serverTimestamp()
      };

      transaction.set(movementDocRef, finalMovementDoc);

      return {
        id: movementDocRef.id,
        ...finalMovementDoc
      };
    });
  } catch (error) {
    throw handleFirestoreError(error);
  }
};
