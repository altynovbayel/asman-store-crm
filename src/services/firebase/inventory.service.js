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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { generateMovementNumber } from '../../utils/generateMovementNumber';
import { MOVEMENT_TYPES } from '../../constants/movementTypes';

const MOVEMENTS_COLLECTION = 'inventory_movements';

/**
 * Fetch all inventory movements, sorted by creation date descending
 */
export const getMovements = async () => {
  const movementsRef = collection(db, MOVEMENTS_COLLECTION);
  const q = query(movementsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Fetch a single movement by ID
 */
export const getMovement = async (id) => {
  const docRef = doc(db, MOVEMENTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Запись о перемещении не найдена');
  }

  return {
    id: docSnap.id,
    ...docSnap.data()
  };
};

/**
 * Fetch recent movements with limit
 */
export const getRecentMovements = async (limitNum = 10) => {
  const movementsRef = collection(db, MOVEMENTS_COLLECTION);
  const q = query(movementsRef, orderBy('createdAt', 'desc'), limit(limitNum));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Fetch movements associated with a specific product ID
 */
export const getMovementsByProduct = async (productId) => {
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
};

/**
 * Creates a new stock movement and updates the product quantity inside a transaction
 */
export const createMovement = async (movementData) => {
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
  if (isNaN(qty) || qty <= 0) {
    throw new Error('Количество должно быть положительным целым числом больше нуля.');
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
      // In physical stock adjustments, the entered quantity represents the final count
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
      quantity: type === MOVEMENT_TYPES.ADJUSTMENT ? Math.abs(stockAfter - stockBefore) : qty, // Save actual delta processed or absolute count
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
};
