import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { AuthProvider } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';
import { ProductsProvider } from './store/ProductsContext';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ProductsProvider>
          <RouterProvider router={router} />
        </ProductsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
