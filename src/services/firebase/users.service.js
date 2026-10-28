import {
  collection,
  doc,
  getDocs,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { ROLES } from '../../constants/roles';
import { USER_STATUS } from '../../constants/userStatus';
import { logAction } from './audit.service';
import { handleFirestoreError } from '../../utils/AppError';

const USERS_COLLECTION = 'users';

const VALID_ROLES = Object.values(ROLES);
const VALID_STATUSES = Object.values(USER_STATUS);

// Old profiles may hold a non-string email; the audit log stores only strings
const emailOf = (user) => (typeof user.email === 'string' ? user.email : '');

/**
 * Normalizes a profile for display. Old profiles without `status` are active
 * (same rule as AuthContext and Firestore Rules).
 */
const mapUser = (docSnap) => {
  const data = docSnap.data() || {};
  return {
    ...data,
    id: docSnap.id,
    status: data.status || USER_STATUS.ACTIVE
  };
};

/**
 * Fetch all user profiles (admin only by Firestore Rules), sorted by email.
 * No orderBy in the query so profiles without an email field are not dropped.
 */
export const getUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs
      .map(mapUser)
      .sort((a, b) => emailOf(a).localeCompare(emailOf(b)));
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Changes one profile field (role or status) of ANOTHER user in a transaction:
 * re-reads the profile, validates it and returns the exact previous value for the audit log.
 * Users are never deleted; access is revoked with status = blocked.
 */
const updateUserField = async (currentUser, targetUid, field, newValue) => {
  if (!currentUser?.uid) {
    throw new Error('Пользователь не авторизован.');
  }
  if (targetUid === currentUser.uid) {
    throw new Error(field === 'role'
      ? 'Нельзя изменить собственную роль.'
      : 'Нельзя изменить собственный статус.');
  }

  const userRef = doc(db, USERS_COLLECTION, targetUid);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    if (!snap.exists()) {
      throw new Error('Профиль пользователя не найден.');
    }
    const data = snap.data();

    // Profiles with an unknown role are not modified from the UI
    if (!VALID_ROLES.includes(data.role)) {
      throw new Error('У пользователя неизвестная роль. Изменение недоступно.');
    }

    const oldValue = field === 'status' ? (data.status || USER_STATUS.ACTIVE) : data.role;
    if (oldValue === newValue) {
      throw new Error('Значение уже установлено.');
    }

    transaction.update(userRef, { [field]: newValue });
    return { user: { ...data, id: targetUid, [field]: newValue }, oldValue };
  });
};

/**
 * Change another user's role (admin <-> manager) and write USER_ROLE_UPDATED to the audit log.
 * @returns {Promise<Object>} updated user
 */
export const updateUserRole = async (currentUser, targetUid, newRole) => {
  try {
    if (!VALID_ROLES.includes(newRole)) {
      throw new Error('Недопустимая роль.');
    }
    const { user, oldValue } = await updateUserField(currentUser, targetUid, 'role', newRole);

    await logAction(currentUser, 'USER_ROLE_UPDATED', `Изменена роль пользователя ${emailOf(user) || targetUid}: ${oldValue} → ${newRole}`, {
      targetUserId: targetUid,
      targetEmail: emailOf(user),
      field: 'role',
      oldValue,
      newValue: newRole
    });

    return { ...user, status: user.status || USER_STATUS.ACTIVE };
  } catch (error) {
    throw handleFirestoreError(error);
  }
};

/**
 * Block or unblock another user and write USER_BLOCKED / USER_UNBLOCKED to the audit log.
 * @returns {Promise<Object>} updated user
 */
export const updateUserStatus = async (currentUser, targetUid, newStatus) => {
  try {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new Error('Недопустимый статус.');
    }
    const { user, oldValue } = await updateUserField(currentUser, targetUid, 'status', newStatus);

    const isBlocked = newStatus === USER_STATUS.BLOCKED;
    await logAction(
      currentUser,
      isBlocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
      `${isBlocked ? 'Заблокирован' : 'Разблокирован'} пользователь ${emailOf(user) || targetUid}`,
      {
        targetUserId: targetUid,
        targetEmail: emailOf(user),
        field: 'status',
        oldValue,
        newValue: newStatus
      }
    );

    return user;
  } catch (error) {
    throw handleFirestoreError(error);
  }
};
