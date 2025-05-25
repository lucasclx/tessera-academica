// src/components/common/StudentRoute.js
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const StudentRoute = () => {
  const { hasRole, isLoading, isAuthenticated } = useContext(AuthContext);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole('STUDENT')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default StudentRoute;