// src/components/ErrorBoundary.tsx
import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  // Log the error to an external service or console
  console.error('Uncaught error:', error);

  return (
    <div role="alert" className="p-8 text-center">
      <h2 className="text-2xl font-semibold mb-4 text-red-600">Algo deu errado</h2>
      <p className="mb-6 text-gray-700">Ocorreu um erro inesperado. Tente novamente.</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        Recarregar página
      </button>
    </div>
  );
};

interface BoundaryProps {
  children: React.ReactNode;
}

export const ErrorBoundary: React.FC<BoundaryProps> = ({ children }) => (
  <ReactErrorBoundary FallbackComponent={ErrorFallback}>
    {children}
  </ReactErrorBoundary>
);

export default ErrorBoundary;
