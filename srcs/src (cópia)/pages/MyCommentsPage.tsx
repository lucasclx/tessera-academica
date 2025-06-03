// src/pages/MyCommentsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChatBubbleLeftEllipsisIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { api, Comment } from '../lib/api'; // Usar Comment de api.tsx
import { toast } from 'react-hot-toast';

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page number (0-indexed)
  size: number;
}

const MyCommentsPage: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  const fetchMyComments = useCallback(async (page: number) => {
    setLoading(true);
    try {
      // O backend espera paginação para /comments/my, mas o tipo CommentDTO não foi explicitamente
      // definido no api.tsx, então vamos assumir que Comment é o tipo correto por enquanto.
      // O endpoint no CommentController é /my e retorna Page<CommentDTO>
      const response = await api.get<Page<Comment>>(
        `/comments/my?page=${page}&size=${pageSize}&sort=createdAt,desc`
      );
      setComments(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(response.number);
    } catch (error) {
      toast.error('Erro ao carregar seus comentários.');
      console.error("Erro ao buscar comentários:", error);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchMyComments(currentPage);
  }, [fetchMyComments, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchMyComments(newPage); // Chama fetchMyComments com a nova página
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Data desconhecida';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Função para extrair um trecho do comentário para preview
  const getCommentPreview = (content: string, length: number = 150) => {
    if (content.length <= length) return content;
    return content.substring(0, length) + '...';
  };
  
  // Idealmente, o CommentDTO do backend deveria incluir o documentId e documentTitle
  // para facilitar a criação do link. Por enquanto, usaremos versionId.
  // Para construir um link funcional para o documento/versão, você pode precisar
  // de mais informações ou de uma lógica mais complexa.
  // Exemplo: /student/documents/{documentId}#version-{versionId}-comment-{commentId}
  // O CommentDTO atual do backend (baseado no arquivo CommentDTO.java) já tem versionId.

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <ChatBubbleLeftEllipsisIcon className="h-7 w-7 mr-2 text-primary-600" />
          Meus Comentários
        </h1>
        <span className="text-sm text-gray-500">{totalElements} comentários encontrados</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200">
          <ChatBubbleLeftEllipsisIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Nenhum comentário feito por você ainda.
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Participe das discussões comentando nos documentos!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 hover:bg-gray-50">
              <div className="prose prose-sm max-w-none mb-2">
                <p>{getCommentPreview(comment.content)}</p>
              </div>
              <div className="text-xs text-gray-500 flex items-center justify-between">
                <span className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                  {formatDate(comment.createdAt)}
                </span>
                {/* Link para o documento/versão - precisa de mais info ou lógica de rota */}
                <Link 
  to={`/student/documents/${comment.documentId || '#'}#version-${comment.versionId}`}
  className="text-primary-600 hover:text-primary-700 hover:underline flex items-center"
  title="Ir para o comentário no documento"
>
                    <DocumentTextIcon className="h-4 w-4 mr-1"/>
                    Ver no Documento (Versão ID: {comment.versionId}) 
                </Link>
              </div>
               {comment.resolved && (
                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Resolvido
                </span>
              )}
            </div>
          ))}
        </div>
      )}

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
                Mostrando <span className="font-medium">{Math.min(currentPage * pageSize + 1, totalElements)}</span> a{' '}
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
                {/* Lógica de números de página pode ser adicionada aqui */}
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

export default MyCommentsPage;