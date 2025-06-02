// src/Editor/ReactQuillEditor.tsx - VERSÃO OTIMIZADA
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Registrar formatos customizados do Quill, se necessário
// import BlotFormatter from 'quill-blot-formatter'; // Para redimensionar imagens
// Quill.register('modules/blotFormatter', BlotFormatter);

export interface EditorRef {
  getContent: () => string;
  setContent: (content: string, source?: string) => void;
  focus: () => void;
  insertText: (text: string) => void;
  getText: () => string;
  getLength: () => number;
}

interface ReactQuillEditorProps {
  content?: string;
  placeholder?: string;
  onChange: (content: string) => void;
  onSelectionChange?: (selection: { from: number; to: number }) => void;
  editable?: boolean;
  className?: string;
  showToolbar?: boolean;
  maxLength?: number;
  theme?: 'snow' | 'bubble';
}

const ReactQuillEditor = forwardRef<EditorRef, ReactQuillEditorProps>(({
  content = '',
  placeholder = 'Escreva seu texto aqui...',
  onChange,
  onSelectionChange,
  editable = true,
  className = 'bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden',
  showToolbar = true,
  maxLength,
  theme = 'snow',
}, ref) => {
  const [editorHtml, setEditorHtml] = useState<string>(content);
  const quillRef = useRef<ReactQuill>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sincronizar conteúdo externo
  useEffect(() => {
    if (content !== editorHtml && isInitialized) {
      setEditorHtml(content);
    }
  }, [content, isInitialized]);

  // Configurar editor após montagem
  useEffect(() => {
    if (quillRef.current && !isInitialized) {
      const editor = quillRef.current.getEditor();
      
      // Configurar seleção se necessário
      if (onSelectionChange) {
        editor.on('selection-change', (range) => {
          if (range) {
            onSelectionChange({ from: range.index, to: range.index + range.length });
          }
        });
      }
      
      setIsInitialized(true);
    }
  }, [onSelectionChange, isInitialized]);

  const handleChange = useCallback((html: string, delta: any, source: string) => {
    // Verificar limite de caracteres se especificado
    if (maxLength && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const textLength = editor.getText().length;
      
      if (textLength > maxLength && source === 'user') {
        // Prevenir alteração se exceder o limite
        editor.deleteText(maxLength, textLength);
        return;
      }
    }
    
    setEditorHtml(html);
    onChange(html);
  }, [onChange, maxLength]);

  useImperativeHandle(ref, () => ({
    getContent: () => {
      return quillRef.current?.getEditor().root.innerHTML || '';
    },
    setContent: (newContent: string, source: string = 'api') => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        const currentContent = editor.root.innerHTML;
        
        if (currentContent !== newContent) {
          // Preservar posição do cursor quando possível
          const selection = editor.getSelection();
          editor.clipboard.dangerouslyPasteHTML(0, newContent, source as any);
          
          // Restaurar cursor se estava focado
          if (selection && source === 'api') {
            setTimeout(() => {
              editor.setSelection(selection);
            }, 0);
          }
          
          setEditorHtml(newContent);
        }
      }
    },
    focus: () => {
      quillRef.current?.focus();
    },
    insertText: (text: string) => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        const selection = editor.getSelection() || { index: 0, length: 0 };
        editor.insertText(selection.index, text);
      }
    },
    getText: () => {
      return quillRef.current?.getEditor().getText() || '';
    },
    getLength: () => {
      return quillRef.current?.getEditor().getLength() || 0;
    },
  }));

  // Configuração da barra de ferramentas
  const toolbarModules = showToolbar ? {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'align': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        // Handlers customizados podem ser adicionados aqui
        image: function() {
          const url = prompt('Insira a URL da imagem:');
          if (url) {
            const editor = quillRef.current?.getEditor();
            const range = editor?.getSelection();
            if (editor && range) {
              editor.insertEmbed(range.index, 'image', url);
            }
          }
        }
      }
    },
    // Outros módulos podem ser adicionados aqui
    // blotFormatter: {} // Para redimensionamento de imagens
  } : { toolbar: false };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'align',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  // Calcular contagem de caracteres
  const textLength = quillRef.current?.getEditor().getText().length || 0;

  return (
    <div className={className}>
      <ReactQuill
        ref={quillRef}
        theme={showToolbar ? theme : "bubble"}
        value={editorHtml}
        onChange={handleChange}
        modules={toolbarModules}
        formats={formats}
        readOnly={!editable}
        placeholder={placeholder}
        style={{
          minHeight: showToolbar ? '400px' : '300px',
        }}
      />
      
      {/* Contador de caracteres */}
      {maxLength && (
        <div className="flex justify-between items-center px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <span>
            {textLength}/{maxLength} caracteres
          </span>
          {textLength > maxLength * 0.9 && (
            <span className={textLength >= maxLength ? 'text-red-600' : 'text-yellow-600'}>
              {textLength >= maxLength ? 'Limite atingido' : 'Próximo do limite'}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

ReactQuillEditor.displayName = 'ReactQuillEditor';
export default ReactQuillEditor;