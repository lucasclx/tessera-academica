import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, UserPlus, Mail, Settings, Crown } from 'lucide-react'

const CollaboratorsPage = () => {
  const { id } = useParams<{ id: string }>()
  const [collaborators, setCollaborators] = useState([])

  useEffect(() => {
    // Mock data
    setCollaborators([
      {
        id: 1,
        name: 'João Silva',
        email: 'joao@email.com',
        role: 'PRIMARY_STUDENT',
        permission: 'FULL_ACCESS'
      },
      {
        id: 2,
        name: 'Prof. Dr. Maria Santos',
        email: 'maria@email.com',
        role: 'PRIMARY_ADVISOR',
        permission: 'FULL_ACCESS'
      }
    ])
  }, [id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/dashboard/documents/${id}`}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-secondary-900">Colaboradores</h1>
        </div>

        <button className="btn-primary flex items-center space-x-2">
          <UserPlus className="w-4 h-4" />
          <span>Adicionar Colaborador</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-secondary-200">
        <div className="p-6">
          <div className="space-y-4">
            {collaborators.map((collaborator: any) => (
              <div key={collaborator.id} className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {collaborator.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-secondary-900">{collaborator.name}</h3>
                    <p className="text-sm text-secondary-500">{collaborator.email}</p>
                  </div>
                  {collaborator.role.includes('PRIMARY') && (
                    <Crown className="w-4 h-4 text-warning-500" />
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-secondary-100 text-secondary-800 px-2 py-1 rounded">
                    {collaborator.role}
                  </span>
                  <button className="p-2 text-secondary-400 hover:text-secondary-600">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollaboratorsPage