// File: frontend/src/pages/dashboard/DashboardPage.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  TrendingUp,
  Calendar,
  MessageSquare,
  Edit3,
  Eye
} from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import { Document, DocumentStatus } from '@/types'

const DashboardPage = () => {
  const { user, isStudent, isAdvisor } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data - em produção, isso viria da API
  useEffect(() => {
    const mockDocuments: Document[] = [
      {
        id: 1,
        title: 'Análise de Algoritmos de Machine Learning',
        description: 'Estudo comparativo de diferentes algoritmos...',
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
        description: 'Implementação de microsserviços...',
        status: DocumentStatus.SUBMITTED,
        studentId: 1,
        advisorId: 2,
        studentName: 'João Silva',
        advisorName: 'Prof. Dr. Maria Santos',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T16:45:00Z',
        versionCount: 5
      }
    ]

    setTimeout(() => {
      setDocuments(mockDocuments)
      setLoading(false)
    }, 1000)
  }, [])

  const stats = [
    {
      title: 'Documentos Ativos',
      value: documents.length,
      icon: <FileText className="w-6 h-6" />,
      color: 'primary',
      change: '+2 este mês'
    },
    {
      title: 'Em Revisão',
      value: documents.filter(d => d.status === DocumentStatus.SUBMITTED).length,
      icon: <Clock className="w-6 h-6" />,
      color: 'warning',
      change: '1 pendente'
    },
    {
      title: 'Aprovados',
      value: documents.filter(d => d.status === DocumentStatus.APPROVED).length,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'success',
      change: 'Meta atingida'
    },
    {
      title: isStudent ? 'Orientadores' : 'Orientandos',
      value: isStudent ? 1 : 5,
      icon: <Users className="w-6 h-6" />,
      color: 'secondary',
      change: 'Ativos'
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'comment',
      title: 'Novo comentário em "Análise de Algoritmos"',
      time: '2 horas atrás',
      user: 'Prof. Dr. Maria Santos'
    },
    {
      id: 2,
      type: 'version',
      title: 'Nova versão de "Sistemas Distribuídos"',
      time: '1 dia atrás',
      user: 'João Silva'
    },
    {
      id: 3,
      type: 'status',
      title: 'Documento submetido para revisão',
      time: '2 dias atrás',
      user: 'João Silva'
    }
  ]

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Olá, {user?.name}! 👋
          </h1>
          <p className="text-secondary-600 mt-1">
            Aqui está um resumo das suas atividades recentes.
          </p>
        </div>
        
        <Link
          to="/dashboard/documents"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Documento</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-secondary-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Documents */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-secondary-900">
                  Documentos Recentes
                </h2>
                <Link
                  to="/dashboard/documents"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Ver todos
                </Link>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">
                    Nenhum documento ainda
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    Comece criando seu primeiro documento acadêmico.
                  </p>
                  <Link to="/dashboard/documents" className="btn-primary">
                    Criar Documento
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.slice(0, 5).map((document) => (
                    <motion.div
                      key={document.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 hover:bg-secondary-50 rounded-lg transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-secondary-900 truncate">
                          {document.title}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                            {getStatusText(document.status)}
                          </span>
                          <span className="text-xs text-secondary-500">
                            {document.versionCount} versões
                          </span>
                          <span className="text-xs text-secondary-500">
                            Atualizado {new Date(document.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          to={`/dashboard/documents/${document.id}`}
                          className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/dashboard/documents/${document.id}/edit`}
                          className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200">
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-900">
                Atividade Recente
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'comment' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      {activity.type === 'version' && (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      {activity.type === 'status' && (
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-yellow-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-secondary-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-secondary-500 mt-1">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200">
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-900">
                Ações Rápidas
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <Link
                  to="/dashboard/documents"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <Plus className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-secondary-900">
                    Novo Documento
                  </span>
                </Link>
                
                <Link
                  to="/dashboard/notifications"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <AlertCircle className="w-5 h-5 text-warning-600" />
                  <span className="text-sm font-medium text-secondary-900">
                    Ver Notificações
                  </span>
                </Link>
                
                <Link
                  to="/dashboard/profile"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <Users className="w-5 h-5 text-secondary-600" />
                  <span className="text-sm font-medium text-secondary-900">
                    Meu Perfil
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Próximos Prazos
            </h2>
            <p className="text-primary-100">
              Mantenha-se organizado com seus prazos acadêmicos
            </p>
          </div>
          <Calendar className="w-8 h-8 text-primary-200" />
        </div>
        
        <div className="mt-4 bg-primary-500 bg-opacity-50 rounded-lg p-4">
          <p className="text-sm text-primary-100">
            Nenhum prazo próximo. Você está em dia! 🎉
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage