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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { PRODUCT_TYPES } from '../../constants/productTypes';

const PRODUCTS_COLLECTION = 'products';

/**
 * Fetch all products, ordered by creation date descending
 */
export const getProducts = async () => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const q = query(productsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Fetch a single product by ID
 */
export const getProduct = async (id) => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Товар не найден');
  }
  
  return {
    id: docSnap.id,
    ...docSnap.data()
  };
};

/**
 * Create a new product
 */
export const createProduct = async (productData) => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  
  // Format data types
  const formattedData = {
    name: productData.name.trim(),
    type: productData.type,
    barcode: productData.barcode.trim(),
    quantity: Math.max(0, parseInt(productData.quantity, 10) || 0),
    price: Math.max(0, parseFloat(productData.price) || 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    // Laptops specific fields
    cpu: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.cpu || '').trim() : '',
    ram: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.ram || '').trim() : '',
    ssd: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.ssd || '').trim() : ''
  };

  const docRef = await addDoc(productsRef, formattedData);
  return docRef.id;
};

/**
 * Update an existing product
 */
export const updateProduct = async (id, productData) => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  
  const formattedData = {
    name: productData.name.trim(),
    type: productData.type,
    barcode: productData.barcode.trim(),
    quantity: Math.max(0, parseInt(productData.quantity, 10) || 0),
    price: Math.max(0, parseFloat(productData.price) || 0),
    updatedAt: serverTimestamp(),
    cpu: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.cpu || '').trim() : '',
    ram: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.ram || '').trim() : '',
    ssd: productData.type === PRODUCT_TYPES.LAPTOP ? (productData.ssd || '').trim() : ''
  };

  await updateDoc(docRef, formattedData);
};

/**
 * Delete a product by ID
 */
export const deleteProduct = async (id) => {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(docRef);
};

/**
 * Check if a barcode already exists in another product document
 */
export const barcodeExists = async (barcode, excludeId = null) => {
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
};
