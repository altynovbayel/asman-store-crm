import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import Loader from '../Loader/Loader';

const ProtectedRoute = ({ children, allowedRoles, fallbackPath = '/forbidden' }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullscreen text="Проверка авторизации..." />;
  }

  if (!user) {
    // Save target path to redirect back after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
