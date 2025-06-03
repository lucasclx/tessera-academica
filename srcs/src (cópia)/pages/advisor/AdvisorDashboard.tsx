// src/pages/advisor/AdvisorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ChartBarIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { documentsApi, usersApi, Document, UserSelection, Page } from '../../lib/api';
import { toast } from 'react-hot-toast';

// Componente de Paginação (pode ser reutilizado do AdminDashboard ou definido separadamente)
const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; loading: boolean }> = ({ currentPage, totalPages, onPageChange, loading }) => {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 mt-4 py-3">
      <div className="flex-1 flex justify-between sm:justify-end">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0 || loading} className="btn btn-secondary btn-sm">Anterior</button>
        <span className="text-sm text-gray-700 mx-2 hidden sm:inline-block">Página {currentPage + 1} de {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1 || loading} className="btn btn-secondary btn-sm ml-3">Próximo</button>
      </div>
    </nav>
  );
};

const AdvisorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    revision: 0,
    approved: 0,
    students: 0,
  });

  const [myStudents, setMyStudents] = useState<UserSelection[]>([]);
  const [studentsPage, setStudentsPage] = useState(0);
  const [studentsTotalPages, setStudentsTotalPages] = useState(0);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  useEffect(() => {
    loadDocumentsAndStats();
    loadMyStudents(0, '');
  }, []);

  useEffect(() => {
    loadMyStudents(studentsPage, studentSearchTerm);
  }, [studentsPage]);


  const loadDocumentsAndStats = async () => {
    setLoadingDocuments(true);
    try {
      const response = await documentsApi.getAdvisorDocuments(0, 10); // Carrega primeiros 10 para o resumo
      setDocuments(response.content);
      
      const uniqueStudents = new Set(response.content.map(doc => doc.studentId));
      const newStats = response.content.reduce(
        (acc, doc) => {
          acc.total++;
          if (doc.status === 'SUBMITTED') acc.submitted++;
          if (doc.status === 'REVISION') acc.revision++;
          if (doc.status === 'APPROVED' || doc.status === 'FINALIZED') acc.approved++;
          return acc;
        },
        { total: 0, submitted: 0, revision: 0, approved: 0, students: 0 } // students será atualizado por outra chamada
      );
      // setStats(newStats); // stats.students será atualizado por loadMyStudents
      
      // Carregar a contagem de estudantes separadamente ou usar o totalElements da primeira página de loadMyStudents
      const studentStatsResponse = await usersApi.getMyAdvisedStudents(0,1); // apenas para pegar totalElements
      setStats(prev => ({...newStats, students: studentStatsResponse.totalElements}));

    } catch (error) {
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoadingDocuments(false);
    }
  };
  
  const loadMyStudents = async (page: number, search: string) => {
    setLoadingStudents(true);
    try {
      const response = await usersApi.getMyAdvisedStudents(page, 5, search); // 5 estudantes por página
      setMyStudents(response.content);
      setStudentsTotalPages(response.totalPages);
      if(page === 0 && !search) { // Atualiza stats de estudantes apenas na carga inicial sem busca
         setStats(prev => ({...prev, students: response.totalElements}))
      }
    } catch (error) {
      toast.error('Erro ao carregar seus estudantes orientandos.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentsPage(0);
    loadMyStudents(0, studentSearchTerm);
  };


  const getStatusInfo = (status: string) => { /* ... (mesma função getStatusInfo de antes) ... */ 
    switch (status) {
      case 'DRAFT': return { label: 'Rascunho', color: 'status-draft', icon: DocumentTextIcon };
      case 'SUBMITTED': return { label: 'Aguardando Revisão', color: 'status-submitted', icon: ClockIcon };
      case 'REVISION': return { label: 'Em Revisão', color: 'status-revision', icon: ExclamationTriangleIcon };
      case 'APPROVED': return { label: 'Aprovado', color: 'status-approved', icon: CheckCircleIcon };
      case 'FINALIZED': return { label: 'Finalizado', color: 'status-finalized', icon: CheckCircleIcon };
      default: return { label: status, color: 'status-draft', icon: DocumentTextIcon };
    }
  };
  const formatDate = (dateString?: string) => { /* ... (mesma função formatDate de antes) ... */ 
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  const getPriorityLevel = (document: Document) => { /* ... (mesma função getPriorityLevel de antes) ... */ 
    if (document.status === 'SUBMITTED') {
      const daysSinceSubmission = Math.floor(
        (Date.now() - new Date(document.submittedAt || document.updatedAt).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      if (daysSinceSubmission > 7) return 'high';
      if (daysSinceSubmission > 3) return 'medium';
    }
    return 'low';
  };

  // Se loadingDocuments ou loadingStudents for true inicialmente para as stats:
  if (loadingDocuments && loadingStudents && stats.total === 0) { 
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, Prof. {user?.name}!</h1>
            <p className="text-gray-600 mt-1">Acompanhe o progresso dos seus orientandos e gerencie as revisões.</p>
          </div>
          <Link to="/advisor/students" className="btn btn-primary hidden sm:flex"><UserGroupIcon className="h-5 w-5 mr-2" />Meus Estudantes</Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* ... (cards de estatísticas como antes, usando o estado `stats`) ... */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center"><div className="flex-shrink-0 bg-blue-100 p-3 rounded-full"><UserGroupIcon className="h-6 w-6 text-blue-500" /></div><div className="ml-4"><div className="text-sm font-medium text-gray-500">Estudantes</div><div className="text-2xl font-bold text-blue-600">{stats.students}</div></div></div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center"><div className="flex-shrink-0 bg-gray-100 p-3 rounded-full"><ChartBarIcon className="h-6 w-6 text-gray-500" /></div><div className="ml-4"><div className="text-sm font-medium text-gray-500">Total Docs</div><div className="text-2xl font-bold text-gray-900">{stats.total}</div></div></div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center"><div className="flex-shrink-0 bg-orange-100 p-3 rounded-full"><ClockIcon className="h-6 w-6 text-orange-500" /></div><div className="ml-4"><div className="text-sm font-medium text-gray-500">Aguardando</div><div className="text-2xl font-bold text-orange-600">{stats.submitted}</div></div></div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center"><div className="flex-shrink-0 bg-yellow-100 p-3 rounded-full"><ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" /></div><div className="ml-4"><div className="text-sm font-medium text-gray-500">Em Revisão</div><div className="text-2xl font-bold text-yellow-600">{stats.revision}</div></div></div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center"><div className="flex-shrink-0 bg-green-100 p-3 rounded-full"><CheckCircleIcon className="h-6 w-6 text-green-500" /></div><div className="ml-4"><div className="text-sm font-medium text-gray-500">Aprovados</div><div className="text-2xl font-bold text-green-600">{stats.approved}</div></div></div>
        </div>
      </div>

      {/* Documents Requiring Attention */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* ... (mesma lógica para documentos necessitando atenção) ... */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Documentos Necessitando Atenção</h2>
            <Link to="/advisor/documents?status=SUBMITTED" className="text-sm font-medium text-primary-600 hover:text-primary-500">Ver todos pendentes</Link>
        </div>
        {loadingDocuments ? <div className="p-6 text-center">Carregando documentos...</div> : documents.filter(doc => doc.status === 'SUBMITTED').length === 0 ? (
          <div className="p-6 text-center"><CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">Tudo em dia!</h3><p className="mt-1 text-sm text-gray-500">Não há documentos aguardando sua revisão.</p></div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.filter(doc => doc.status === 'SUBMITTED').slice(0, 5).map((document) => {
              const priority = getPriorityLevel(document);
              const priorityColors: {[key: string]: string} = { high: 'border-l-red-500 bg-red-50', medium: 'border-l-yellow-500 bg-yellow-50', low: 'border-l-blue-500 bg-blue-50' };
              return (
                <div key={document.id} className={`p-6 border-l-4 ${priorityColors[priority]}`}>
                  {/* ... (renderização do item do documento) ... */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0"><div className="flex items-start"><ClockIcon className="h-5 w-5 text-orange-500 mr-3 mt-0.5" /><div><Link to={`/advisor/documents/${document.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">{document.title}</Link><p className="text-sm text-gray-500 mt-1">{document.description}</p><div className="flex items-center space-x-4 mt-2 text-xs text-gray-500"><span>Estudante: {document.studentName}</span><span>Submetido: {formatDate(document.submittedAt || document.updatedAt)}</span><span>{document.versionCount} versão(ões)</span>{priority === 'high' && (<span className="text-red-600 font-medium">• Urgente</span>)}</div></div></div></div>
                    <div className="flex items-center space-x-2"><Link to={`/advisor/documents/${document.id}`} className="btn btn-secondary btn-sm"><EyeIcon className="h-4 w-4 mr-1" />Revisar</Link></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* My Students Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200" id="my-students">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Meus Estudantes Orientandos</h2>
          <form onSubmit={handleStudentSearchSubmit} className="flex items-center">
            <input 
              type="text" 
              value={studentSearchTerm} 
              onChange={(e) => setStudentSearchTerm(e.target.value)} 
              placeholder="Buscar estudante..." 
              className="input-field py-1 px-2 text-sm mr-2"
            />
            <button type="submit" className="btn btn-secondary btn-sm"><MagnifyingGlassIcon className="h-4 w-4"/></button>
          </form>
        </div>
        {loadingStudents ? <div className="p-6 text-center">Carregando estudantes...</div> : myStudents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Nenhum estudante encontrado ou você não orienta nenhum estudante.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/advisor/documents?studentId=${student.id}`} className="btn btn-secondary btn-sm">Ver Documentos</Link>
                      {/* Link para perfil do estudante ou outras ações */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination currentPage={studentsPage} totalPages={studentsTotalPages} onPageChange={setStudentsPage} loading={loadingStudents}/>
          </div>
        )}
      </div>


      {/* Quick Actions / Recently Reviewed (como antes) */}
      {/* ... */}
    </div>
  );
};

export default AdvisorDashboard;