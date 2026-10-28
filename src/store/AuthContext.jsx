/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

import Loader from '../components/Loader/Loader';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

/**
 * Returns a user-facing reason why the profile has no CRM access, or null if access is allowed.
 * Mirrors isActiveStaff() in firestore.rules.
 */
const getAccessDeniedMessage = (profileData) => {
  if (!profileData) {
    return 'Профиль пользователя не найден. Обратитесь к администратору.';
  }
  if (profileData.status === 'blocked') {
    return 'Ваш аккаунт заблокирован администратором.';
  }
  if (!Object.values(ROLES).includes(profileData.role)) {
    return 'Для вашего аккаунта не назначена роль. Обратитесь к администратору.';
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Reason the current account was signed out by the access check (shown on the login page)
  const [accessError, setAccessError] = useState('');

  // Expose role checks
  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER || user?.role === ROLES.ADMIN; // admin inherits manager permissions

  // Listen to auth state changes and keep the user's own profile in sync,
  // so blocking, role changes or profile removal take effect in an open session.
  useEffect(() => {
    let unsubscribeProfile = null;
    const stopProfile = () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      stopProfile();

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      unsubscribeProfile = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        { includeMetadataChanges: true },
        (userDocSnap) => {
          const profileData = userDocSnap.exists() ? userDocSnap.data() : null;

          // No profile, unknown role or blocked: no access (Firestore Rules deny it as well).
          // A denial is acted on only when confirmed by the server, not from a stale local cache.
          const deniedMessage = getAccessDeniedMessage(profileData);
          if (deniedMessage && userDocSnap.metadata.fromCache) {
            return;
          }
          if (deniedMessage) {
            setAccessError(deniedMessage);
            setUser(null);
            signOut(auth).catch((error) => console.error('Error signing out denied user:', error));
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...profileData
            });
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching auth user profile:', error);
          setUser(null);
          setLoading(false);
        }
      );
    });

    return () => {
      stopProfile();
      unsubscribeAuth();
    };
  }, []);

  // Login handler.
  // Does not toggle the global loading flag: that would unmount the login page
  // and lose the error message shown to the user.
  const login = async (email, password) => {
    setAccessError('');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Fetch user profile to verify access before resolving login
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    const profileData = userDocSnap.exists() ? userDocSnap.data() : null;

    const deniedMessage = getAccessDeniedMessage(profileData);
    if (deniedMessage) {
      await signOut(auth);
      throw new Error(deniedMessage);
    }

    const mergedUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      ...profileData
    };
    setUser(mergedUser);
    return mergedUser;
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    accessError,
    login,
    logout,
    isAdmin,
    isManager
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loader fullscreen text="Загрузка системы..." /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
