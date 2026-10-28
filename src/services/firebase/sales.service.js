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
import { generateMovementNumber } from '../../utils/generateMovementNumber';
import {
  MOVEMENTS_COLLECTION,
  MOVEMENTS_COUNTER_ID,
  buildMovementDoc
} from './inventory.service';
import { PRODUCT_STATUS } from '../../constants/productStatus';
import { PRODUCT_TYPES } from '../../constants/productTypes';
import { MOVEMENT_TYPES } from '../../constants/movementTypes';
import { PAYMENT_METHODS } from '../../constants/paymentMethods';
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
 * Groups sale/cart items by productId so every product document is read and
 * written exactly once inside a transaction.
 */
const groupItemsByProduct = (items = []) => {
  const groups = new Map();
  for (const item of items) {
    const qty = parseInt(item.quantity, 10) || 0;
    const existing = groups.get(item.productId);
    if (existing) {
      existing.quantity += qty;
      existing.lineCount += 1;
    } else {
      groups.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        productType: item.productType,
        quantity: qty,
        lineCount: 1
      });
    }
  }
  return Array.from(groups.values());
};

/**
 * Atomic sale deletion. In a single transaction it re-reads the sale, restores
 * laptop status (SOLD -> AVAILABLE) and accessory quantities exactly once,
 * writes RETURN movement records (history only, they do not change stock again)
 * and deletes the sale. A sale that is already deleted is rejected, so a repeated
 * deletion cannot restore stock twice.
 */
export const deleteSale = async (id, managerId, managerName) => {
  try {
    const saleDocRef = doc(db, SALES_COLLECTION, id);
    const movementCounterRef = doc(db, 'counters', MOVEMENTS_COUNTER_ID);

    await runTransaction(db, async (transaction) => {
      // 1. Reads (Firestore requires all reads before any write)
      const saleSnap = await transaction.get(saleDocRef);
      if (!saleSnap.exists()) {
        throw new Error('Продажа не найдена или уже удалена.');
      }
      const sale = saleSnap.data();
      const groups = groupItemsByProduct(sale.items || []);

      const movementCounterSnap = await transaction.get(movementCounterRef);
      const productSnaps = [];
      for (const group of groups) {
        productSnaps.push(await transaction.get(doc(db, 'products', group.productId)));
      }

      // 2. Compute stock restoration from the current product state
      const restorations = [];
      groups.forEach((group, index) => {
        const productSnap = productSnaps[index];
        // Product was physically deleted after the sale: nothing to restore
        if (!productSnap.exists() || group.quantity <= 0) return;

        const product = productSnap.data();
        const productType = group.productType || product.type;
        const stockBefore = product.quantity || 0;

        if (productType === PRODUCT_TYPES.LAPTOP) {
          restorations.push({
            group,
            productRef: productSnap.ref,
            product,
            stockBefore,
            stockAfter: 1,
            productUpdate: { status: PRODUCT_STATUS.AVAILABLE, quantity: 1 }
          });
        } else if (productType === PRODUCT_TYPES.ACCESSORY) {
          const stockAfter = stockBefore + group.quantity;
          restorations.push({
            group,
            productRef: productSnap.ref,
            product,
            stockBefore,
            stockAfter,
            productUpdate: { quantity: stockAfter }
          });
        }
      });

      // 3. Writes
      let nextMovementNum = movementCounterSnap.exists()
        ? (movementCounterSnap.data().current || 0)
        : 0;

      for (const restoration of restorations) {
        transaction.update(restoration.productRef, {
          ...restoration.productUpdate,
          updatedAt: serverTimestamp()
        });

        nextMovementNum += 1;
        transaction.set(
          doc(collection(db, MOVEMENTS_COLLECTION)),
          buildMovementDoc({
            movementNumber: generateMovementNumber(nextMovementNum),
            type: MOVEMENT_TYPES.RETURN,
            productId: restoration.group.productId,
            productData: restoration.product,
            quantity: restoration.group.quantity,
            stockBefore: restoration.stockBefore,
            stockAfter: restoration.stockAfter,
            managerId,
            managerName,
            comment: `Отмена продажи ${sale.saleNumber}`
          })
        );
      }

      if (restorations.length > 0) {
        transaction.set(movementCounterRef, { current: nextMovementNum }, { merge: true });
      }

      transaction.delete(saleDocRef);
    });
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Atomic sale creator. In a single transaction it re-reads every product,
 * validates laptop status and accessory stock against the current data,
 * marks laptops SOLD, decrements accessory quantities, assigns the sale number,
 * creates the sale document and writes OUT movement records. Either everything
 * is committed or nothing is.
 */
export const createSale = async (saleData) => {
  try {
    const {
      customerName,
      customerPhone,
      paymentMethod,
      installmentTerm,
      installmentDiscount,
      kitIncluded,
      kitDiscount,
      installmentDiscountTotal,
      individualDiscountTotal,
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

    if ([PAYMENT_METHODS.M_PLUS, PAYMENT_METHODS.ZERO].includes(paymentMethod)) {
      if (Number(installmentTerm) !== 3) {
        throw new Error('Для рассрочки допустим только срок 3 месяца (скидка 5%).');
      }
    }

    if (items.length === 0) {
      throw new Error('Корзина пуста.');
    }

    for (const item of items) {
      const price = parseFloat(item.unitPrice) || 0;
      const disc = parseFloat(item.itemDiscount) || 0;
      const qty = Number(item.quantity);

      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error(`Некорректное количество для товара "${item.productName}".`);
      }
      if (disc < 0) {
        throw new Error(`Скидка для товара "${item.productName}" не может быть отрицательной.`);
      }
      if (disc > price) {
        throw new Error(`Скидка для товара "${item.productName}" не может превышать стоимость товара.`);
      }
    }

    const groups = groupItemsByProduct(items);
    const saleCounterRef = doc(db, 'counters', 'sales');
    const movementCounterRef = doc(db, 'counters', MOVEMENTS_COUNTER_ID);
    const saleDocRef = doc(collection(db, SALES_COLLECTION));

    // 2. Single transaction: validate current stock and commit sale + stock + movements together
    const result = await runTransaction(db, async (transaction) => {
      // 2.1 Reads (Firestore requires all reads before any write)
      const saleCounterSnap = await transaction.get(saleCounterRef);
      const movementCounterSnap = await transaction.get(movementCounterRef);
      const productSnaps = [];
      for (const group of groups) {
        productSnaps.push(await transaction.get(doc(db, 'products', group.productId)));
      }

      // 2.2 Validate against the state read inside this transaction
      const stockChanges = groups.map((group, index) => {
        const productSnap = productSnaps[index];
        if (!productSnap.exists()) {
          throw new Error(`Товар "${group.productName}" не существует в базе.`);
        }
        const product = productSnap.data();

        if (group.productType !== product.type) {
          throw new Error(`Данные товара "${product.name}" изменились. Обновите корзину.`);
        }

        const stockBefore = product.quantity || 0;

        if (product.type === PRODUCT_TYPES.LAPTOP) {
          // Laptop availability is defined by status, not by quantity
          if (product.status === PRODUCT_STATUS.SOLD) {
            throw new Error(`Ноутбук "${product.name}" уже продан.`);
          }
          if (group.quantity !== 1 || group.lineCount !== 1) {
            throw new Error(`Ноутбук "${product.name}" можно продать только в количестве 1 шт.`);
          }
          return {
            group,
            productRef: productSnap.ref,
            product,
            stockBefore,
            stockAfter: 0,
            productUpdate: { status: PRODUCT_STATUS.SOLD, quantity: 0 }
          };
        }

        if (product.type === PRODUCT_TYPES.ACCESSORY) {
          if (stockBefore < group.quantity) {
            throw new Error(
              `Недостаточно аксессуаров "${product.name}" на складе. Доступно: ${stockBefore}, требуется: ${group.quantity}.`
            );
          }
          const stockAfter = stockBefore - group.quantity;
          return {
            group,
            productRef: productSnap.ref,
            product,
            stockBefore,
            stockAfter,
            productUpdate: { quantity: stockAfter }
          };
        }

        throw new Error(`Неизвестный тип товара "${product.name}".`);
      });

      // 2.3 Writes
      const nextSaleNum = saleCounterSnap.exists()
        ? (saleCounterSnap.data().current || 0) + 1
        : 1;
      const saleNumber = generateSaleNumber(nextSaleNum);

      let nextMovementNum = movementCounterSnap.exists()
        ? (movementCounterSnap.data().current || 0)
        : 0;

      for (const change of stockChanges) {
        transaction.update(change.productRef, {
          ...change.productUpdate,
          updatedAt: serverTimestamp()
        });

        nextMovementNum += 1;
        transaction.set(
          doc(collection(db, MOVEMENTS_COLLECTION)),
          buildMovementDoc({
            movementNumber: generateMovementNumber(nextMovementNum),
            type: MOVEMENT_TYPES.OUT,
            productId: change.group.productId,
            productData: change.product,
            quantity: change.group.quantity,
            stockBefore: change.stockBefore,
            stockAfter: change.stockAfter,
            managerId,
            managerName,
            comment: `Продажа ${saleNumber}`
          })
        );
      }

      transaction.set(saleCounterRef, { current: nextSaleNum }, { merge: true });
      transaction.set(movementCounterRef, { current: nextMovementNum }, { merge: true });

      // Create the Sale document
      const isInstallment = [PAYMENT_METHODS.M_PLUS, PAYMENT_METHODS.ZERO].includes(paymentMethod);

      const finalSaleDoc = {
        saleNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        ...(isInstallment ? {
          installmentTerm: Number(installmentTerm),
          installmentDiscount: Number(installmentDiscount) || 0,
          installmentDiscountTotal: parseFloat(installmentDiscountTotal) || 0
        } : {}),
        kitIncluded: Boolean(kitIncluded),
        kitDiscount: parseFloat(kitDiscount) || 0,
        individualDiscountTotal: parseFloat(individualDiscountTotal) || 0,
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

    return result;
  } catch (error) {
    throw handleFirestoreError(error);
  }
};
