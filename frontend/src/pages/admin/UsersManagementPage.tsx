import { useState, useEffect } from 'react'
import { Search, Filter, Edit3, Trash2, UserCheck, UserX } from 'lucide-react'

const UsersManagementPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    // Mock data
    const mockUsers = [
      {
        id: 1,
        name: 'João Silva',
        email: 'joao@email.com',
        status: 'APPROVED',
        roles: [{ name: 'STUDENT' }],
        registrationDate: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        name: 'Prof. Dr. Maria Santos',
        email: 'maria@email.com',
        status: 'APPROVED',
        roles: [{ name: 'ADVISOR' }],
        registrationDate: '2024-01-10T09:00:00Z'
      },
      {
        id: 3,
        name: 'Carlos Oliveira',
        email: 'carlos@email.com',
        status: 'PENDING',
        roles: [{ name: 'STUDENT' }],
        registrationDate: '2024-01-20T14:30:00Z'
      }
    ]

    setTimeout(() => {
      setUsers(mockUsers)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-success-100 text-success-800'
      case 'PENDING':
        return 'bg-warning-100 text-warning-800'
      case 'REJECTED':
        return 'bg-danger-100 text-danger-800'
      default:
        return 'bg-secondary-100 text-secondary-800'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-secondary-900">Gerenciar Usuários</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-secondary-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <select
            className="border border-secondary-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos os Status</option>
            <option value="APPROVED">Aprovados</option>
            <option value="PENDING">Pendentes</option>
            <option value="REJECTED">Rejeitados</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200">
        {loading ? (
          <div className="p-6">Carregando usuários...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="text-left p-4 font-medium text-secondary-900">Usuário</th>
                  <th className="text-left p-4 font-medium text-secondary-900">Email</th>
                  <th className="text-left p-4 font-medium text-secondary-900">Papel</th>
                  <th className="text-left p-4 font-medium text-secondary-900">Status</th>
                  <th className="text-left p-4 font-medium text-secondary-900">Registro</th>
                  <th className="text-left p-4 font-medium text-secondary-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-secondary-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-secondary-600">{user.email}</td>
                    <td className="p-4">
                      <span className="text-sm bg-secondary-100 text-secondary-800 px-2 py-1 rounded">
                        {user.roles[0]?.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-secondary-600">
                      {new Date(user.registrationDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-secondary-400 hover:text-primary-600 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {user.status === 'PENDING' && (
                          <>
                            <button className="p-1 text-secondary-400 hover:text-success-600 transition-colors">
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-secondary-400 hover:text-danger-600 transition-colors">
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button className="p-1 text-secondary-400 hover:text-danger-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && filteredUsers.length > 0 && (
        <div className="bg-secondary-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-secondary-600">
            <span>Mostrando {filteredUsers.length} de {users.length} usuários</span>
            <div className="flex items-center space-x-4">
              <span>{users.filter((u: any) => u.status === 'APPROVED').length} aprovados</span>
              <span>{users.filter((u: any) => u.status === 'PENDING').length} pendentes</span>
              <span>{users.filter((u: any) => u.status === 'REJECTED').length} rejeitados</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersManagementPage