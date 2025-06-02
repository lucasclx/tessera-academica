// src/pages/advisor/AdvisorStudentsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api'; // Ajuste o caminho se necessário
import { toast } from 'react-hot-toast';

// Definindo a interface UserSelectionDTO baseada no backend
interface UserSelectionDTO {
  id: number;
  name: string;
  email: string;
  role?: string;
  department?: string;
  institution?: string;
  isActive: boolean;
}

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page number (0-indexed)
  size: number;
}

const AdvisorStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<UserSelectionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize] = useState(10); // Ou ajuste conforme preferência

  const fetchStudents = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const response = await api.get<Page<UserSelectionDTO>>(
        `/users/advisor/my-students?page=${page}&size=${pageSize}&search=${search}`
      );
      setStudents(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(response.number);
    } catch (error) {
      toast.error('Erro ao carregar lista de estudantes.');
      console.error("Erro ao buscar estudantes:", error);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchStudents(currentPage, searchTerm);
  }, [fetchStudents, currentPage]); // Removido searchTerm daqui para controle manual via handleSearch

  const handleSearch = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setCurrentPage(0); // Resetar para a primeira página ao buscar
    fetchStudents(0, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <UserGroupIcon className="h-7 w-7 mr-2 text-primary-600" />
            Meus Orientandos
          </h1>
          <p className="text-gray-600 mt-1">
            {totalElements} estudante(s) encontrado(s).
          </p>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email do estudante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
        </form>
      </div>

      {/* Lista de Estudantes */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200">
          <AcademicCapIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchTerm ? 'Nenhum estudante encontrado com os critérios.' : 'Nenhum orientando associado.'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Tente refinar sua busca.' : 'Assim que estudantes forem vinculados a você, eles aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
          {students.map((student) => (
            <div key={student.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full ${student.isActive ? 'bg-green-500' : 'bg-gray-400'} flex items-center justify-center text-white font-semibold`}>
                    {student.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-primary-700 hover:text-primary-600">
                      {/* Futuramente, pode ser um Link para o perfil do estudante se houver */}
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-0.5">
                       <EnvelopeIcon className="h-3 w-3 mr-1 text-gray-400"/> {student.email}
                    </div>
                    {student.department && student.institution && (
                       <div className="text-xs text-gray-500 mt-0.5">
                           {student.department} - {student.institution}
                       </div>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  {/* Ações futuras, como "Ver Documentos" */}
                   <Link
                    to={`/advisor/documents?studentId=${student.id}`} // Exemplo de como poderia ser um link para documentos do estudante
                    className="btn btn-secondary btn-sm"
                  >
                    Ver Documentos
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && !loading && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="btn btn-secondary"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="btn btn-secondary"
            >
              Próximo
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{currentPage * pageSize + 1}</span> a{' '}
                <span className="font-medium">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> de{' '}
                <span className="font-medium">{totalElements}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                {/* Lógica de números de página pode ser adicionada aqui se desejar */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Próximo
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorStudentsPage;