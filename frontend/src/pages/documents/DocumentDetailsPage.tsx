// File: frontend/src/pages/documents/DocumentDetailsPage.tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit3, Users, Clock, Eye, MessageSquare, GitBranch } from 'lucide-react'
import { Document, DocumentStatus } from '@/types'

const DocumentDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data - em produção, isso viria da API
    const mockDocument: Document = {
      id: Number(id),
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
    }

    setTimeout(() => {
      setDocument(mockDocument)
      setLoading(false)
    }, 1000)
  }, [id])

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  if (!document) {
    return <div className="p-8">Documento não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/dashboard/documents"
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-secondary-900">{document.title}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <p className="text-secondary-600 mb-4">{document.description}</p>
        
        <div className="flex items-center space-x-6 text-sm text-secondary-500">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Atualizado em {new Date(document.updatedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>{document.advisorName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <GitBranch className="w-4 h-4" />
            <span>{document.versionCount} versões</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <Link
          to={`/dashboard/documents/${document.id}/edit`}
          className="btn-primary flex items-center space-x-2"
        >
          <Edit3 className="w-4 h-4" />
          <span>Editar</span>
        </Link>
        
        <Link
          to={`/dashboard/documents/${document.id}/versions`}
          className="btn-secondary flex items-center space-x-2"
        >
          <GitBranch className="w-4 h-4" />
          <span>Versões</span>
        </Link>
        
        <Link
          to={`/dashboard/documents/${document.id}/collaborators`}
          className="btn-secondary flex items-center space-x-2"
        >
          <Users className="w-4 h-4" />
          <span>Colaboradores</span>
        </Link>
      </div>
    </div>
  )
}

export default DocumentDetailsPage