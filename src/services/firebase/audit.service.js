import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../../utils/AppError';

const AUDIT_COLLECTION = 'auditLogs';

/**
 * Log an administrator or manager action to Firestore.
 * @param {Object} user Current logged in user object
 * @param {string} action Log action code (e.g. PRODUCT_CREATE)
 * @param {string} description Brief description of the action
 * @param {Object} metadata Optional metadata associated with the action
 */
export const logAction = async (user, action, description, metadata = {}) => {
  try {
    const logsRef = collection(db, AUDIT_COLLECTION);
    await addDoc(logsRef, {
      timestamp: serverTimestamp(),
      userId: user?.uid || 'anonymous',
      userName: user?.displayName || user?.name || user?.email || 'Неизвестно',
      role: user?.role || 'operator',
      action,
      description,
      metadata
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

/**
 * Fetch all audit logs sorted by timestamp descending.
 * @returns {Promise<Array>}
 */
export const getAuditLogs = async () => {
  try {
    const logsRef = collection(db, AUDIT_COLLECTION);
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw handleFirestoreError(error);
  }
};
