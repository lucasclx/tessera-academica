// File: frontend/src/pages/documents/DocumentsPage.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  User,
  ChevronDown,
  MoreVertical
} from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import { Document, DocumentStatus } from '@/types'

const DocumentsPage = () => {
  const { user, isStudent, isAdvisor } = useAuth()
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('updatedAt')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Mock data - em produção, isso viria da API
  useEffect(() => {
    const mockDocuments: Document[] = [
      {
        id: 1,
        title: 'Análise de Algoritmos de Machine Learning',
        description: 'Estudo comparativo de diferentes algoritmos de aprendizado de máquina aplicados em problemas de classificação.',
        status: DocumentStatus.DRAFT,
        studentId: 1,
        advisorId: 2,
        studentName: 'João Silva',
        advisorName: 'Prof. Dr. Maria Santos',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        versionCount: 3
      },
      {
        id: 2,
        title: 'Sistemas Distribuídos na Nuvem',
        description: 'Implementação de microsserviços utilizando containers Docker e orquestração com Kubernetes.',
        status: DocumentStatus.SUBMITTED,
        studentId: 1,
        advisorId: 2,
        studentName: 'João Silva',
        advisorName: 'Prof. Dr. Maria Santos',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T16:45:00Z',
        submittedAt: '2024-01-18T16:45:00Z',
        versionCount: 5
      },
      {
        id: 3,
        title: 'Inteligência Artificial em Jogos',
        description: 'Desenvolvimento de agentes inteligentes para jogos utilizando técnicas de IA.',
        status: DocumentStatus.APPROVED,
        studentId: 1,
        advisorId: 2,
        studentName: 'João Silva',
        advisorName: 'Prof. Dr. Maria Santos',
        createdAt: '2024-01-05T08:00:00Z',
        updatedAt: '2024-01-15T10:20:00Z',
        approvedAt: '2024-01-15T10:20:00Z',
        versionCount: 7
      }
    ]

    setTimeout(() => {
      setDocuments(mockDocuments)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'status':
        return a.status.localeCompare(b.status)
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'updatedAt':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.DRAFT:
        return 'bg-secondary-100 text-secondary-800'
      case DocumentStatus.SUBMITTED:
        return 'bg-warning-100 text-warning-800'
      case DocumentStatus.REVISION:
        return 'bg-danger-100 text-danger-800'
      case DocumentStatus.APPROVED:
        return 'bg-success-100 text-success-800'
      case DocumentStatus.FINALIZED:
        return 'bg-primary-100 text-primary-800'
      default:
        return 'bg-secondary-100 text-secondary-800'
    }
  }

  const getStatusText = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.DRAFT:
        return 'Rascunho'
      case DocumentStatus.SUBMITTED:
        return 'Submetido'
      case DocumentStatus.REVISION:
        return 'Em Revisão'
      case DocumentStatus.APPROVED:
        return 'Aprovado'
      case DocumentStatus.FINALIZED:
        return 'Finalizado'
      default:
        return status
    }
  }

  const handleCreateDocument = () => {
    navigate('/dashboard/documents/new')
  }

  const handleDeleteDocument = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      setDocuments(docs => docs.filter(d => d.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            {isStudent ? 'Meus Documentos' : 'Documentos dos Orientandos'}
          </h1>
          <p className="text-secondary-600 mt-1">
            Gerencie todos os seus trabalhos acadêmicos em um só lugar.
          </p>
        </div>
        
        <button
          onClick={handleCreateDocument}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Documento</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-secondary-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-secondary-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Todos os Status</option>
              <option value="DRAFT">Rascunho</option>
              <option value="SUBMITTED">Submetido</option>
              <option value="REVISION">Em Revisão</option>
              <option value="APPROVED">Aprovado</option>
              <option value="FINALIZED">Finalizado</option>
            </select>
            <ChevronDown className="w-4 h-4 text-secondary-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-secondary-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updatedAt">Mais Recentes</option>
              <option value="createdAt">Data de Criação</option>
              <option value="title">Título</option>
              <option value="status">Status</option>
            </select>
            <ChevronDown className="w-4 h-4 text-secondary-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200">
        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-secondary-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {searchTerm || statusFilter !== 'ALL' ? 'Nenhum documento encontrado' : 'Nenhum documento ainda'}
            </h3>
            <p className="text-secondary-600 mb-6">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando seu primeiro documento acadêmico.'}
            </p>
            {!searchTerm && statusFilter === 'ALL' && (
              <button onClick={handleCreateDocument} className="btn-primary">
                Criar Primeiro Documento
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {sortedDocuments.map((document, index) => (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-6 hover:bg-secondary-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-secondary-900 truncate mb-1">
                        {document.title}
                      </h3>
                      <p className="text-secondary-600 text-sm line-clamp-2 mb-3">
                        {document.description}
                      </p>
                      
                      <div className="flex items-center flex-wrap gap-4 text-sm text-secondary-500">
                        <div className="flex items-center space-x-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                            {getStatusText(document.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Atualizado {new Date(document.updatedAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{isStudent ? document.advisorName : document.studentName}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{document.versionCount} versões</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/dashboard/documents/${document.id}`}
                      className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    
                    <Link
                      to={`/dashboard/documents/${document.id}/edit`}
                      className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    
                    {document.status === DocumentStatus.DRAFT && (
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div className="relative group">
                      <button className="p-2 text-secondary-400 hover:text-secondary-600 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <Link
                          to={`/dashboard/documents/${document.id}/versions`}
                          className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Ver Histórico
                        </Link>
                        <Link
                          to={`/dashboard/documents/${document.id}/collaborators`}
                          className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Colaboradores
                        </Link>
                        <div className="border-t border-secondary-200 my-1"></div>
                        <button
                          onClick={() => navigator.share?.({ 
                            title: document.title, 
                            url: window.location.origin + `/dashboard/documents/${document.id}` 
                          })}
                          className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Compartilhar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && sortedDocuments.length > 0 && (
        <div className="bg-secondary-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-secondary-600">
            <span>
              Mostrando {sortedDocuments.length} de {documents.length} documentos
            </span>
            <div className="flex items-center space-x-4">
              <span>
                {documents.filter(d => d.status === DocumentStatus.DRAFT).length} rascunhos
              </span>
              <span>
                {documents.filter(d => d.status === DocumentStatus.SUBMITTED).length} submetidos
              </span>
              <span>
                {documents.filter(d => d.status === DocumentStatus.APPROVED).length} aprovados
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentsPage