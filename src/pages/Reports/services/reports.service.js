import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { handleFirestoreError } from '../../../utils/AppError';

const SALES_COLLECTION = 'sales';

/**
 * Fetches sales documents within a selected date range (inclusive).
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<Array>}
 */
export const getSalesForDateRange = async (startDate, endDate) => {
  try {
    const salesRef = collection(db, SALES_COLLECTION);
    const q = query(
      salesRef,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
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
