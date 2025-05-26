import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const createRouteGuard = (requiredRole) => {
  return function RouteGuard({ children }) {
    const { isAuthenticated, hasRole, isLoading } = useContext(AuthContext);
    const location = useLocation();

    if (isLoading) {
      return <div>Carregando...</div>;
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return <Navigate to="/dashboard" replace />;
    }

    return children || <Outlet />;
  };
};

export const PrivateRoute = createRouteGuard(null);
export const AdminRoute = createRouteGuard('ADMIN');
export const AdvisorRoute = createRouteGuard('ADVISOR');
export const StudentRoute = createRouteGuard('STUDENT');