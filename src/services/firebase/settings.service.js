import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_SETTINGS } from '../../constants/storeSettingsDefaults';
import { handleFirestoreError } from '../../utils/AppError';

const SETTINGS_COLLECTION = 'settings';
const STORE_DOCUMENT = 'store';

/**
 * Fetch store settings document from Firestore.
 * If document doesn't exist or is missing fields, returns merged default values.
 */
export const getStoreSettings = async () => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, STORE_DOCUMENT);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        ...DEFAULT_SETTINGS,
        ...docSnap.data()
      };
    }
    return DEFAULT_SETTINGS;
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
