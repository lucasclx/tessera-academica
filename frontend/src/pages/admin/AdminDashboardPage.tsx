import { useState, useEffect } from 'react'
import { Users, FileText, Clock, CheckCircle } from 'lucide-react'

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAdvisors: 0,
    pendingRegistrations: 0
  })

  useEffect(() => {
    // Mock data
    setStats({
      totalUsers: 125,
      totalStudents: 98,
      totalAdvisors: 27,
      pendingRegistrations: 5
    })
  }, [])

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: <Users className="w-6 h-6" />,
      color: 'primary'
    },
    {
      title: 'Estudantes',
      value: stats.totalStudents,
      icon: <FileText className="w-6 h-6" />,
      color: 'success'
    },
    {
      title: 'Orientadores',
      value: stats.totalAdvisors,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'warning'
    },
    {
      title: 'Solicitações Pendentes',
      value: stats.pendingRegistrations,
      icon: <Clock className="w-6 h-6" />,
      color: 'danger'
    }
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-secondary-900">Painel Administrativo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">{stat.title}</p>
                <p className="text-2xl font-bold text-secondary-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/registrations"
            className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            <h3 className="font-medium text-secondary-900">Revisar Solicitações</h3>
            <p className="text-sm text-secondary-600 mt-1">
              {stats.pendingRegistrations} solicitações aguardando aprovação
            </p>
          </a>
          
          <a
            href="/admin/users"
            className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            <h3 className="font-medium text-secondary-900">Gerenciar Usuários</h3>
            <p className="text-sm text-secondary-600 mt-1">
              Ver e editar informações dos usuários
            </p>
          </a>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage