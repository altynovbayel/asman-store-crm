/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

import Loader from '../components/Loader/Loader';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Expose role checks
  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER || user?.role === ROLES.ADMIN; // admin inherits manager permissions

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch user profile from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data();

            // Check if user is blocked
            if (profileData.status === 'blocked') {
              await signOut(auth);
              setUser(null);
            } else {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...profileData
              });
            }
          } else {
            // Fallback if firestore document doesn't exist yet (e.g. initial setup)
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'operator', // default role
              status: 'active'
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching auth user profile:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user profile to verify status before resolving login
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const profileData = userDocSnap.data();

        if (profileData.status === 'blocked') {
          await signOut(auth);
          throw new Error('Ваш аккаунт заблокирован администратором.');
        }

        const mergedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...profileData
        };
        setUser(mergedUser);
        return mergedUser;
      } else {
        // Fallback
        const mergedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: 'operator',
          status: 'active'
        };
        setUser(mergedUser);
        return mergedUser;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
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
