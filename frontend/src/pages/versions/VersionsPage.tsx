import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, GitBranch, Clock, User, MessageSquare } from 'lucide-react'

const VersionsPage = () => {
  const { id } = useParams<{ id: string }>()
  const [versions, setVersions] = useState([])

  useEffect(() => {
    // Mock data
    setVersions([
      {
        id: 1,
        versionNumber: '3.0',
        commitMessage: 'Adicionada seção de metodologia',
        createdByName: 'João Silva',
        createdAt: '2024-01-20T14:30:00Z',
        commentCount: 2
      },
      {
        id: 2,
        versionNumber: '2.0',
        commitMessage: 'Revisão da introdução',
        createdByName: 'João Silva',
        createdAt: '2024-01-18T10:15:00Z',
        commentCount: 5
      },
      {
        id: 3,
        versionNumber: '1.0',
        commitMessage: 'Versão inicial',
        createdByName: 'João Silva',
        createdAt: '2024-01-15T09:00:00Z',
        commentCount: 1
      }
    ])
  }, [id])

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to={`/dashboard/documents/${id}`}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-secondary-900">Histórico de Versões</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-secondary-200">
        <div className="p-6">
          <div className="space-y-4">
            {versions.map((version: any, index) => (
              <div key={version.id} className="flex items-center space-x-4 p-4 border border-secondary-200 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <GitBranch className="w-4 h-4 text-primary-600" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-secondary-900">v{version.versionNumber}</span>
                    {index === 0 && (
                      <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                        Atual
                      </span>
                    )}
                  </div>
                  <p className="text-secondary-600 text-sm mb-2">{version.commitMessage}</p>
                  <div className="flex items-center space-x-4 text-xs text-secondary-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{version.createdByName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{version.commentCount} comentários</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Ver
                  </button>
                  {index !== 0 && (
                    <button className="text-secondary-600 hover:text-secondary-700 text-sm font-medium">
                      Comparar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VersionsPage
