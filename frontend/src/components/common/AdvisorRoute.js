import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext'; // Ajuste o caminho se necessário

const AdvisorRoute = () => {
  const { hasRole, isLoading, isAuthenticated } = useContext(AuthContext);

  if (isLoading) {
    return <div>Carregando...</div>; // Ou um spinner/componente de loading
  }

  if (!isAuthenticated) {
    // Se não estiver autenticado, pode ser redundante se já usar PrivateRoute antes
    return <Navigate to="/login" replace />;
  }

  if (!hasRole('ADVISOR')) {
    // Se não for ADVISOR, redireciona para o dashboard principal
    // Poderia também redirecionar para uma página de "Não Autorizado"
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />; // Permite a renderização das rotas filhas
};

export default AdvisorRoute;