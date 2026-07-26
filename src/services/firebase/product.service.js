import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { PRODUCT_TYPES } from '../../constants/productTypes';
import { PRODUCT_STATUS } from '../../constants/productStatus';
import { handleFirestoreError } from '../../utils/AppError';

const PRODUCTS_COLLECTION = 'products';

/**
 * Maps a Firestore product document, ensuring backward compatibility.
 */
const mapProduct = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : data.price,
    purchasePrice: data.purchasePrice !== undefined ? data.purchasePrice : undefined
  };
};

/**
 * Subscribe to real-time updates for products
 */
export const subscribeProducts = (onNext, onError) => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const products = snapshot.docs.map(mapProduct);
        onNext(products);
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
 * Fetch all products, ordered by creation date descending
 */
export const getProducts = async () => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(mapProduct);
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Fetch a single product by ID
 */
export const getProduct = async (id) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Товар не найден');
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      sellingPrice: docSnap.data().sellingPrice !== undefined ? docSnap.data().sellingPrice : docSnap.data().price,
      purchasePrice: docSnap.data().purchasePrice !== undefined ? docSnap.data().purchasePrice : undefined
    };
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Create a new product
 */
export const createProduct = async (productData) => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    
    // Format data types
    const formattedData = {
      name: productData.name.trim(),
      type: productData.type,
      status: productData.status || PRODUCT_STATUS.AVAILABLE,
      barcode: productData.barcode.trim(),
      quantity: Math.max(0, parseInt(productData.quantity, 10) || 0),
      sellingPrice: Math.max(0, parseFloat(productData.sellingPrice) || 0),
      purchasePrice: Math.max(0, parseFloat(productData.purchasePrice) || 0),
      price: Math.max(0, parseFloat(productData.sellingPrice) || 0), // compatibility
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Laptops specific fields
      cpu: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.cpu || '').trim() : '',
      ram: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.ram || '').trim() : '',
      ssd: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.ssd || '').trim() : ''
    };

    const docRef = await addDoc(productsRef, formattedData);
    return docRef.id;
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (id, productData) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    
    const formattedData = {
      name: productData.name.trim(),
      type: productData.type,
      barcode: productData.barcode.trim(),
      quantity: Math.max(0, parseInt(productData.quantity, 10) || 0),
      sellingPrice: Math.max(0, parseFloat(productData.sellingPrice) || 0),
      purchasePrice: Math.max(0, parseFloat(productData.purchasePrice) || 0),
      price: Math.max(0, parseFloat(productData.sellingPrice) || 0), // compatibility
      updatedAt: serverTimestamp(),
      cpu: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.cpu || '').trim() : '',
      ram: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.ram || '').trim() : '',
      ssd: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.ssd || '').trim() : ''
    };

    await updateDoc(docRef, formattedData);
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Delete a product by ID
 */
export const deleteProduct = async (id) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Check if a barcode already exists in another product document
 */
export const barcodeExists = async (barcode, excludeId = null) => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, where('barcode', '==', barcode.trim()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    // If editing, check if the matching document is not the one we are editing
    if (excludeId) {
      const otherDocs = querySnapshot.docs.filter((doc) => doc.id !== excludeId);
      return otherDocs.length > 0;
    }
    
    return true;
  } catch (error) {
    throw handleFirestoreError(error);
  }
};
