import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout/MainLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Reports from '../pages/Reports/Reports';
import Sales from '../pages/Sales/Sales';
import SalesHistory from '../pages/Sales/SalesHistory';
import Warehouse from '../pages/Warehouse/Warehouse';
import InventoryMovements from '../pages/InventoryMovements/InventoryMovements';
import Suppliers from '../pages/Suppliers/Suppliers';
import Users from '../pages/Users/Users';
import Settings from '../pages/Settings/Settings';
import NotFound from '../pages/NotFound/NotFound';

import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import Login from '../pages/Login/Login';
import Forbidden from '../pages/Forbidden/Forbidden';
import { ROLES } from '../constants/roles';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
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
        path: 'sales',
        element: <Sales />
      },
      {
        path: 'sales-history',
        element: <SalesHistory />
      },
      {
        path: 'warehouse',
        element: <Warehouse />
      },
      {
        path: 'movements',
        element: <InventoryMovements />
      },
      {
        path: 'suppliers',
        element: <Suppliers />
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]} fallbackPath="/">
            <Reports />
          </ProtectedRoute>
        )
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <Users />
          </ProtectedRoute>
        )
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'forbidden',
        element: <Forbidden />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

export default router;
