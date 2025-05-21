import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminRoute = () => {
  const { hasRole, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!hasRole('ADMIN')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;