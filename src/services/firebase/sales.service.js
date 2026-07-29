import {
  collection,
  doc,
  getDocs,
  getDoc,
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
 * Atomic sale deletion that restores inventory levels and sets laptop statuses back
 * to AVAILABLE, while writing RETURN movement logs after a successful transaction commit.
 */
export const deleteSale = async (id, managerId, managerName) => {
  try {
    const saleDocRef = doc(db, SALES_COLLECTION, id);
    const saleSnap = await getDoc(saleDocRef);

    if (!saleSnap.exists()) {
      throw new Error('Продажа не найдена');
    }

    const sale = saleSnap.data();

    // 1. Run Firestore transaction to atomically restore quantities and delete sale record
    await runTransaction(db, async (transaction) => {
      for (const item of sale.items || []) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const product = productSnap.data();

          if (item.productType === PRODUCT_TYPES.LAPTOP) {
            // Restore laptop status
            transaction.update(productRef, {
              status: PRODUCT_STATUS.AVAILABLE,
              updatedAt: serverTimestamp()
            });
          } else if (item.productType === PRODUCT_TYPES.ACCESSORY) {
            // Increment accessory quantity back
            const currentQty = product.quantity || 0;
            transaction.update(productRef, {
              quantity: currentQty + (item.quantity || 0),
              updatedAt: serverTimestamp()
            });
          }
        }
      }

      // Delete the sale document inside the transaction
      transaction.delete(saleDocRef);
    });

    // 2. Create RETURN movements for each item after transaction succeeds
    try {
      for (const item of sale.items || []) {
        await createMovement({
          type: MOVEMENT_TYPES.RETURN,
          productId: item.productId,
          quantity: item.quantity,
          managerId,
          managerName,
          comment: `Отмена продажи ${sale.saleNumber}`
        });
      }
    } catch (movementError) {
      console.error('Failed to log return movements on sale deletion:', movementError);
    }
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
      paymentMethod,
      comment,
      managerId,
      managerName,
      items = [],
      subtotal,
      totalDiscount,
      grandTotal
    } = saleData;

    // 1. Validations
    if (!customerName || !customerName.trim() || !customerPhone || !customerPhone.trim()) {
      throw new Error('Имя клиента и номер телефона обязательны.');
    }

    if (!paymentMethod) {
      throw new Error('Выберите способ оплаты.');
    }

    if (items.length === 0) {
      throw new Error('Корзина пуста.');
    }

    for (const item of items) {
      const price = parseFloat(item.unitPrice) || 0;
      const disc = parseFloat(item.itemDiscount) || 0;

      if (disc < 0) {
        throw new Error(`Скидка для товара "${item.productName}" не может быть отрицательной.`);
      }
      if (disc > price) {
        throw new Error(`Скидка для товара "${item.productName}" не может превышать стоимость товара.`);
      }
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
        paymentMethod,
        comment: (comment || '').trim(),
        managerId,
        managerName,
        items,
        subtotal: parseFloat(subtotal) || 0,
        totalDiscount: parseFloat(totalDiscount) || 0,
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
