import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import { useCallback, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette
} from 'lucide-react'

interface TipTapEditorProps {
  content?: string
  onUpdate?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

const TipTapEditor = ({
  content = '',
  onUpdate,
  placeholder = 'Comece a escrever...',
  editable = true,
  className = ''
}: TipTapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      TextStyle,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onUpdate?.(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
        'data-placeholder': placeholder,
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    title 
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-700'
          : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )

  const ColorPicker = ({ type }: { type: 'text' | 'highlight' }) => {
    const colors = [
      '#000000', '#374151', '#6B7280', '#9CA3AF',
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
      '#8B5CF6', '#EC4899', '#F97316', '#84CC16'
    ]

    return (
      <div className="flex flex-wrap gap-1 p-2 bg-white border border-secondary-200 rounded-lg shadow-lg">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => {
              if (type === 'text') {
                editor?.chain().focus().setColor(color).run()
              } else {
                editor?.chain().focus().setHighlight({ color }).run()
              }
            }}
            className="w-6 h-6 rounded border border-secondary-300 hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        {type === 'highlight' && (
          <button
            onClick={() => editor?.chain().focus().unsetHighlight().run()}
            className="w-6 h-6 rounded border border-secondary-300 bg-white hover:scale-110 transition-transform flex items-center justify-center text-xs"
            title="Remover destaque"
          >
            ×
          </button>
        )}
      </div>
    )
  }

  if (!editor) {
    return null
  }

  return (
    <div className={`border border-secondary-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      {editable && (
        <div className="border-b border-secondary-200 bg-secondary-50 p-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* History */}
            <div className="flex items-center border-r border-secondary-300 pr-2 mr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Desfazer"
              >
                <Undo className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Refazer"
              >
                <Redo className="w-4 h-4" />
              </ToolbarButton>
            </div>

            {/* Headings */}
            <div className="flex items-center border-r border-secondary-300 pr-2 mr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                title="Título 1"
              >
                <Heading1 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Título 2"
              >
                <Heading2 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                title="Título 3"
              >
                <Heading3 className="w-4 h-4" />
              </ToolbarButton>
            </div>

            {/* Text Formatting */}
            <div className="flex items-center border-r border-secondary-300 pr-2 mr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Negrito"
              >
                <Bold className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Itálico"
              >
                <Italic className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                title="Sublinhado"
              >
                <UnderlineIcon className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="Riscado"
              >
                <Strikethrough className="w-4 h-4" />
              </ToolbarButton>
            </div>

            {/* Lists */}
            <div className="flex items-center border-r border-secondary-300 pr-2 mr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Lista não ordenada"
              >
                <List className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Lista ordenada"
              >
                <ListOrdered className="w-4 h-4" />
              </ToolbarButton>
            </div>

            {/* Alignment */}
            <div className="flex items-center border-r border-secondary-300 pr-2 mr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                title="Alinhar à esquerda"
              >
                <AlignLeft className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                title="Centralizar"
              >
                <AlignCenter className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                title="Alinhar à direita"
              >
                <AlignRight className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                title="Justificar"
              >
                <AlignJustify className="w-4 h-4" />
              </ToolbarButton>
            </div>

            {/* Other */}
            <div className="flex items-center">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="Citação"
              >
                <Quote className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive('codeBlock')}
                title="Bloco de código"
              >
                <Code className="w-4 h-4" />
              </ToolbarButton>
              
              {/* Color Pickers */}
              <div className="relative group">
                <ToolbarButton
                  onClick={() => {}}
                  title="Cor do texto"
                >
                  <Palette className="w-4 h-4" />
                </ToolbarButton>
                <div className="absolute top-full left-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <ColorPicker type="text" />
                </div>
              </div>
              
              <div className="relative group">
                <ToolbarButton
                  onClick={() => {}}
                  title="Destacar texto"
                >
                  <Highlighter className="w-4 h-4" />
                </ToolbarButton>
                <div className="absolute top-full left-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <ColorPicker type="highlight" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      {editable && (
        <div className="border-t border-secondary-200 bg-secondary-50 px-4 py-2 text-xs text-secondary-500">
          {editor.storage.characterCount?.characters() || 0} caracteres, {' '}
          {editor.storage.characterCount?.words() || 0} palavras
        </div>
      )}
    </div>
  )
}

export default TipTapEditor