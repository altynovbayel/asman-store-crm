import {
  collection,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { generateSaleNumber } from '../../utils/generateSaleNumber';
import { createMovement } from './inventory.service';
import { PRODUCT_STATUS } from '../../constants/productStatus';
import { PRODUCT_TYPES } from '../../constants/productTypes';
import { MOVEMENT_TYPES } from '../../constants/movementTypes';
import { handleFirestoreError } from '../../utils/AppError';

const SALES_COLLECTION = 'sales';

/**
 * Subscribe to real-time updates for sales
 */
export const subscribeSales = (onNext, onError) => {
  try {
    const salesRef = collection(db, SALES_COLLECTION);
    const q = query(salesRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const sales = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        onNext(sales);
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
 * Fetch all sales, ordered by creation date descending
 */
export const getSales = async () => {
  try {
    const salesRef = collection(db, SALES_COLLECTION);
    const q = query(salesRef, orderBy('createdAt', 'desc'));
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
 * Fetch a single sale document by ID
 */
export const getSale = async (id) => {
  try {
    const docRef = doc(db, SALES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Продажа не найдена');
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
 * Delete a sale by ID (Admin only feature)
 */
export const deleteSale = async (id) => {
  try {
    const docRef = doc(db, SALES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Atomic sale creator that updates product status, decrements stock via inventory movement,
 * and increments sequential sale numbers within a Firestore transaction.
 */
export const createSale = async (saleData) => {
  try {
    const {
      customerName,
      customerPhone,
      managerId,
      managerName,
      items = [],
      subtotal,
      discount,
      grandTotal
    } = saleData;

    // 1. Validations
    if (!customerName || !customerName.trim() || !customerPhone || !customerPhone.trim()) {
      throw new Error('Имя клиента и номер телефона обязательны.');
    }

    if (items.length === 0) {
      throw new Error('Корзина пуста.');
    }

    if (parseFloat(discount) < 0) {
      throw new Error('Скидка не может быть отрицательной.');
    }

    if (parseFloat(discount) > parseFloat(subtotal)) {
      throw new Error('Скидка не может превышать промежуточный итог.');
    }

    const counterRef = doc(db, 'counters', 'sales');
    const saleDocRef = doc(collection(db, SALES_COLLECTION));

    // Pre-validate all items before beginning database changes
    for (const item of items) {
      const productRef = doc(db, 'products', item.productId);
      const pSnap = await getDoc(productRef);
      if (!pSnap.exists()) {
        throw new Error(`Товар "${item.productName}" не существует в базе.`);
      }
      const product = pSnap.data();

      if (product.type === PRODUCT_TYPES.LAPTOP) {
        if (product.status === PRODUCT_STATUS.SOLD) {
          throw new Error(`Ноутбук "${product.name}" уже продан.`);
        }
      } else if (product.type === PRODUCT_TYPES.ACCESSORY) {
        if ((product.quantity || 0) < item.quantity) {
          throw new Error(
            `Недостаточно аксессуаров "${product.name}" на складе. Доступно: ${product.quantity}, требуется: ${item.quantity}.`
          );
        }
      }
    }

    // 2. Run Firestore transaction to lock sale number and update laptop status
    const result = await runTransaction(db, async (transaction) => {
      // Read and increment sale counter
      const counterSnap = await transaction.get(counterRef);
      let nextNum = 1;
      if (counterSnap.exists()) {
        nextNum = (counterSnap.data().current || 0) + 1;
      }

      const saleNumber = generateSaleNumber(nextNum);

      // Update laptops statuses to SOLD in DB
      for (const item of items) {
        if (item.productType === PRODUCT_TYPES.LAPTOP) {
          const productRef = doc(db, 'products', item.productId);
          transaction.update(productRef, {
            status: PRODUCT_STATUS.SOLD,
            updatedAt: serverTimestamp()
          });
        }
      }

      // Save sales counter
      transaction.set(counterRef, { current: nextNum }, { merge: true });

      // Create the Sale document
      const finalSaleDoc = {
        saleNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        managerId,
        managerName,
        items,
        subtotal: parseFloat(subtotal) || 0,
        discount: parseFloat(discount) || 0,
        grandTotal: parseFloat(grandTotal) || 0,
        createdAt: serverTimestamp()
      };

      transaction.set(saleDocRef, finalSaleDoc);

      return {
        id: saleDocRef.id,
        saleNumber,
        ...finalSaleDoc
      };
    });

    // 3. Create OUT movements for each item (runs sequentially to preserve counter ordering)
    try {
      for (const item of items) {
        await createMovement({
          type: MOVEMENT_TYPES.OUT,
          productId: item.productId,
          quantity: item.quantity,
          managerId,
          managerName,
          comment: `Продажа ${result.saleNumber}`
        });
      }
    } catch (error) {
      console.error('Failed to log inventory movements for sale:', error);
      // Note: Stock movements failures must be logged. Product status is already locked as SOLD.
      throw new Error(
        `Продажа ${result.saleNumber} была создана, но произошел сбой при обновлении складских остатков: ${error.message}`,
        { cause: error }
      );
    }

    return result;
  } catch (error) {
    throw handleFirestoreError(error);
  }
};
