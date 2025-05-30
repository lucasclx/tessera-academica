// src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* 404 Number */}
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          
          {/* Error Message */}
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Página não encontrada
          </h2>
          
          <p className="mt-4 text-lg text-gray-600">
            Desculpe, não conseguimos encontrar a página que você está procurando.
          </p>
          
          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="btn btn-primary inline-flex items-center"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Voltar ao Início
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary inline-flex items-center"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Página Anterior
            </button>
          </div>
          
          {/* Help Text */}
          <div className="mt-8 text-sm text-gray-500">
            <p>
              Se você acredita que isso é um erro, entre em contato com o suporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;