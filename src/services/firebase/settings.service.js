import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../../utils/AppError';

const SETTINGS_COLLECTION = 'settings';
const STORE_DOCUMENT = 'store';

const DEFAULT_SETTINGS = {
  storeName: 'Asman Store',
  phone: '+996 555 123-456',
  whatsapp: '+996 555 123-456',
  email: 'info@asmanstore.kg',
  website: 'www.asmanstore.kg',
  address: 'г. Бишкек, ул. Киевская, 100',
  logoUrl: '',
  currency: 'сом',
  defaultWarrantyMonths: 12,
  warrantyTerms: `1. Гарантия действует только при наличии заполненного гарантийного талона.\n2. Срок гарантии исчисляется со дня продажи.\n3. Гарантия распространяется на производственный брак.\n4. Гарантия не распространяется на механические повреждения или следы залития жидкостью.`
};

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
