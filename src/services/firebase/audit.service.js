import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
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

/**
 * Safely clears all documents in the auditLogs collection in batches/chunks,
 * and records a new AUDIT_LOG_CLEARED entry indicating who cleared the log and when.
 * Only modifies the 'auditLogs' collection.
 *
 * @param {Object} user Current authenticated user (must have role 'admin')
 * @returns {Promise<void>}
 */
export const clearAuditLogs = async (user) => {
  if (!user || user.role !== 'admin') {
    throw new Error('Только администратор может очистить журнал аудита.');
  }

  try {
    const logsRef = collection(db, AUDIT_COLLECTION);
    const BATCH_SIZE = 400; // Strictly below Firestore's 500 writes-per-batch limit
    const MAX_BATCHES = 1000; // Safeguard against infinite loops (handles up to 400,000 documents)
    let batchesCount = 0;

    // Loop through existing audit documents in safe chunks and delete them
    while (batchesCount < MAX_BATCHES) {
      const q = query(logsRef, limit(BATCH_SIZE));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        break;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      batchesCount++;

      // If fewer documents than BATCH_SIZE were fetched, no more documents remain
      if (snapshot.size < BATCH_SIZE) {
        break;
      }
    }

    if (batchesCount >= MAX_BATCHES) {
      throw new Error('Превышен лимит итераций при очистке журнала аудита.');
    }

    // Create a new audit log record ONLY AFTER all previous records have been safely deleted
    await addDoc(logsRef, {
      timestamp: serverTimestamp(),
      userId: user?.uid || 'anonymous',
      userName: user?.displayName || user?.name || user?.email || 'Администратор',
      role: user?.role || 'admin',
      action: 'AUDIT_LOG_CLEARED',
      description: 'Журнал аудита очищен',
      metadata: {}
    });
  } catch (error) {
    throw handleFirestoreError(error);
  }
};
