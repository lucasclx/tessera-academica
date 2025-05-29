import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Eye, Users } from 'lucide-react'
import TipTapEditor from '@/components/editor/TipTapEditor'

const DocumentEditorPage = () => {
  const { id } = useParams<{ id: string }>()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    // Mock data - carregar documento
    setTitle('Análise de Algoritmos de Machine Learning')
    setContent('<h1>Introdução</h1><p>Este documento apresenta uma análise comparativa...</p>')
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLastSaved(new Date())
    setSaving(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/dashboard/documents/${id}`}
              className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
            />
          </div>

          <div className="flex items-center space-x-4">
            {lastSaved && (
              <span className="text-sm text-secondary-500">
                Salvo às {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar'}</span>
            </button>

            <Link
              to={`/dashboard/documents/${id}`}
              className="btn-secondary flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Visualizar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6">
        <TipTapEditor
          content={content}
          onUpdate={setContent}
          placeholder="Comece a escrever seu documento..."
          className="h-full"
        />
      </div>
    </div>
  )
}

export default DocumentEditorPage
