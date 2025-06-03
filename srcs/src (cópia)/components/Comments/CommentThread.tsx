// src/components/Comments/CommentThread.tsx
import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftEllipsisIcon,
  UserCircleIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { commentsApi, Comment } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface CommentThreadProps {
  versionId: number;
  selectedPosition?: { start: number; end: number };
  onCommentAdded?: () => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  versionId,
  selectedPosition,
  onCommentAdded,
}) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showOnlyUnresolved, setShowOnlyUnresolved] = useState(false);

  useEffect(() => {
    loadComments();
  }, [versionId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await commentsApi.getByVersion(versionId);
      setComments(commentsData);
    } catch (error) {
      toast.error('Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const commentData: Partial<Comment> = {
        versionId,
        content: newComment,
        startPosition: selectedPosition?.start,
        endPosition: selectedPosition?.end,
      };

      await commentsApi.create(commentData);
      setNewComment('');
      toast.success('Comentário adicionado');
      loadComments();
      onCommentAdded?.();
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editingContent.trim()) return;

    try {
      await commentsApi.update(commentId, {
        versionId,
        content: editingContent,
      });
      setEditingId(null);
      setEditingContent('');
      toast.success('Comentário atualizado');
      loadComments();
    } catch (error) {
      toast.error('Erro ao atualizar comentário');
    }
  };

  const handleResolveComment = async (commentId: number) => {
    try {
      await commentsApi.resolve(commentId);
      toast.success('Comentário resolvido');
      loadComments();
    } catch (error) {
      toast.error('Erro ao resolver comentário');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este comentário?')) {
      return;
    }

    try {
      await commentsApi.delete(commentId);
      toast.success('Comentário excluído');
      loadComments();
    } catch (error) {
      toast.error('Erro ao excluir comentário');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredComments = showOnlyUnresolved 
    ? comments.filter(comment => !comment.resolved)
    : comments;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-2" />
          Comentários ({comments.length})
        </h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showOnlyUnresolved}
              onChange={(e) => setShowOnlyUnresolved(e.target.checked)}
              className="mr-2"
            />
            Apenas não resolvidos
          </label>
        </div>
      </div>

      {/* New Comment Form */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                selectedPosition 
                  ? "Adicionar comentário sobre o texto selecionado..."
                  : "Adicionar comentário geral..."
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
            {selectedPosition && (
              <div className="mt-2 text-xs text-gray-500">
                Comentário sobre posição {selectedPosition.start}-{selectedPosition.end}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {newComment.length}/500 caracteres
              </span>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="btn btn-primary btn-sm disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftEllipsisIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {showOnlyUnresolved ? 'Nenhum comentário não resolvido' : 'Nenhum comentário'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {showOnlyUnresolved 
                ? 'Todos os comentários foram resolvidos.'
                : 'Seja o primeiro a comentar nesta versão.'}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`border rounded-lg p-4 ${
                comment.resolved 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {comment.userName}
                      </span>
                      {comment.resolved && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Resolvido
                        </span>
                      )}
                      {comment.startPosition && comment.endPosition && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Posição {comment.startPosition}-{comment.endPosition}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1">
                      {editingId === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={3}
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              className="btn btn-primary btn-sm"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700">{comment.content}</p>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      <span>{formatDate(comment.createdAt)}</span>
                      {comment.resolved && comment.resolvedByName && (
                        <span className="ml-2">
                          • Resolvido por {comment.resolvedByName} em {formatDate(comment.resolvedAt!)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!comment.resolved && (
                  <div className="flex items-center space-x-2 ml-4">
                    {comment.userId === user?.id && (
                      <>
                        <button
                          onClick={() => startEdit(comment)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Excluir"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleResolveComment(comment.id)}
                      className="text-gray-400 hover:text-green-600"
                      title="Marcar como resolvido"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentThread;