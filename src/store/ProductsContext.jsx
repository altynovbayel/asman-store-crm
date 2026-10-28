/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { subscribeProducts } from '../services/firebase/product.service';
import { useAuth } from './AuthContext';

export const ProductsContext = createContext(null);

export const ProductsProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.uid || null;
  // State is tagged with the user it was loaded for, so data of a previous session is never shown
  const [state, setState] = useState({ userId: null, products: [], loading: true, error: null });

  // Subscribe only for a signed-in user with access; re-subscribe when the user changes
  // (a listener rejected by Firestore Rules before login never resumes on its own).
  useEffect(() => {
    if (!userId) return undefined;

    const unsubscribe = subscribeProducts(
      (data) => {
        setState({ userId, products: data, loading: false, error: null });
      },
      (err) => {
        setState((prev) => ({
          userId,
          products: prev.userId === userId ? prev.products : [],
          loading: false,
          error: err
        }));
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const isCurrent = userId !== null && state.userId === userId;
  const value = {
    products: isCurrent ? state.products : [],
    loading: userId !== null && (!isCurrent || state.loading),
    error: isCurrent ? state.error : null
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

export default ProductsContext;
