import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout/MainLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Products from '../pages/Products/Products';
import Warehouse from '../pages/Warehouse/Warehouse';
import Suppliers from '../pages/Suppliers/Suppliers';
import Users from '../pages/Users/Users';
import Settings from '../pages/Settings/Settings';
import NotFound from '../pages/NotFound/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'dashboard',
        element: <Navigate to="/" replace />
      },
      {
        path: 'products',
        element: <Products />
      },
      {
        path: 'warehouse',
        element: <Warehouse />
      },
      {
        path: 'suppliers',
        element: <Suppliers />
      },
      {
        path: 'users',
        element: <Users />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);
export default router;
