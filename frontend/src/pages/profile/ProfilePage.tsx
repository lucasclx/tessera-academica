import { useState } from 'react'
import { useAuth } from '@/stores/authStore'
import { User, Mail, Shield, Calendar, Save } from 'lucide-react'

const ProfilePage = () => {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })

  const handleSave = () => {
    // Lógica para salvar
    setEditing(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-secondary-900">Meu Perfil</h1>

      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-secondary-900">
                Informações Pessoais
              </h2>
              <button
                onClick={() => setEditing(!editing)}
                className="btn-secondary"
              >
                {editing ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Nome
                </label>
                {editing ? (
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                ) : (
                  <p className="text-secondary-900">{user?.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Email
                </label>
                <p className="text-secondary-900">{user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                  {user?.status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Papel
                </label>
                <p className="text-secondary-900">
                  {user?.roles?.map(role => role.name).join(', ')}
                </p>
              </div>
            </div>

            {editing && (
              <div className="mt-6">
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
