import { useState, useEffect } from 'react'
import { Search, Check, X, Eye, Calendar, User, Building } from 'lucide-react'

const RegistrationRequestsPage = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Mock data
    const mockRequests = [
      {
        id: 1,
        user: {
          id: 3,
          name: 'Carlos Oliveira',
          email: 'carlos@email.com',
          status: 'PENDING'
        },
        institution: 'Universidade de São Paulo',
        department: 'Ciência da Computação',
        justification: 'Preciso de acesso para desenvolver minha dissertação de mestrado sobre algoritmos de machine learning.',
        status: 'PENDING',
        createdAt: '2024-01-20T14:30:00Z'
      },
      {
        id: 2,
        user: {
          id: 4,
          name: 'Ana Paula',
          email: 'ana@email.com',
          status: 'PENDING'
        },
        institution: 'UNICAMP',
        department: 'Engenharia de Software',
        justification: 'Sou orientadora e gostaria de usar a plataforma com meus orientandos.',
        status: 'PENDING',
        createdAt: '2024-01-19T09:15:00Z'
      }
    ]

    setTimeout(() => {
      setRequests(mockRequests)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredRequests = requests.filter((request: any) => {
    return request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           request.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           request.institution.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleApprove = (id: number) => {
    if (window.confirm('Tem certeza que deseja aprovar esta solicitação?')) {
      setRequests(reqs => reqs.filter((r: any) => r.id !== id))
    }
  }

  const handleReject = (id: number) => {
    const reason = window.prompt('Motivo da rejeição:')
    if (reason) {
      setRequests(reqs => reqs.filter((r: any) => r.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-secondary-900">Solicitações de Cadastro</h1>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="relative">
          <Search className="w-5 h-5 text-secondary-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar solicitações..."
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200">
        {loading ? (
          <div className="p-6">Carregando solicitações...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Nenhuma solicitação pendente
            </h3>
            <p className="text-secondary-600">
              Todas as solicitações foram processadas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {filteredRequests.map((request: any) => (
              <div key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {request.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-secondary-900">{request.user.name}</h3>
                        <p className="text-sm text-secondary-600">{request.user.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <Building className="w-4 h-4" />
                        <span>{request.institution}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <User className="w-4 h-4" />
                        <span>{request.department}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-secondary-900 mb-2">Justificativa:</h4>
                      <p className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                        {request.justification}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-secondary-500">
                      <Calendar className="w-3 h-3" />
                      <span>Solicitado em {new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-success-100 text-success-700 rounded-lg hover:bg-success-200 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aprovar</span>
                    </button>
                    
                    <button
                      onClick={() => handleReject(request.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-danger-100 text-danger-700 rounded-lg hover:bg-danger-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Rejeitar</span>
                    </button>

                    <button className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && filteredRequests.length > 0 && (
        <div className="bg-secondary-50 rounded-lg p-4">
          <p className="text-sm text-secondary-600">
            {filteredRequests.length} solicitação{filteredRequests.length !== 1 ? 'ões' : ''} pendente{filteredRequests.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

export default RegistrationRequestsPage