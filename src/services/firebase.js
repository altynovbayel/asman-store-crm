import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCduH4K9A87AyR8T_Z3pZ64jwZI4LAMmbM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'asman-store-crm.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'asman-store-crm',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'asman-store-crm.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '407577760701',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:407577760701:web:df10b7744a8137b92eb8d4'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Expose Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
