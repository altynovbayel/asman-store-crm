import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../../utils/AppError';

const SETTINGS_COLLECTION = 'settings';
const STORE_DOCUMENT = 'store';

/**
 * Fetch store settings document from Firestore.
 * If document doesn't exist, returns default fallbacks.
 */
export const getStoreSettings = async () => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, STORE_DOCUMENT);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {
      storeName: 'Asman Store',
      phone: '+7 701 555-0100',
      address: 'г. Алматы, ул. Абая, 10',
      logoUrl: ''
    };
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Update store settings in Firestore.
 */
export const updateStoreSettings = async (settingsData) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, STORE_DOCUMENT);
    await setDoc(docRef, settingsData, { merge: true });
  } catch (error) {
    throw handleFirestoreError(error);
  }
};
