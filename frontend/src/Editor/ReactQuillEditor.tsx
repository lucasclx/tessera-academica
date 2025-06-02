// src/Editor/ReactQuillEditor.tsx - VERSÃO CORRIGIDA
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const [isMounted, setIsMounted] = useState(false);
  const initTimeoutRef = useRef<NodeJS.Timeout>();

  // Efeito para marcar como montado
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  // Efeito para sincronizar conteúdo externo
  useEffect(() => {
    if (content !== editorHtml && isInitialized && isMounted) {
      setEditorHtml(content);
    }
  }, [content, editorHtml, isInitialized, isMounted]);

  // Efeito para inicialização do editor
  useEffect(() => {
    if (quillRef.current && !isInitialized && isMounted) {
      // Adicionar um pequeno delay para garantir que o DOM esteja pronto
      initTimeoutRef.current = setTimeout(() => {
        if (!isMounted) return;
        
        try {
          const editor = quillRef.current?.getEditor();
          if (editor && onSelectionChange) {
            editor.on('selection-change', (range) => {
              if (range && isMounted) {
                onSelectionChange({ from: range.index, to: range.index + range.length });
              }
            });
          }
          setIsInitialized(true);
        } catch (error) {
          console.warn('Erro na inicialização do Quill:', error);
        }
      }, 100);
    }

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [onSelectionChange, isInitialized, isMounted]);

  const handleChange = useCallback((html: string, delta: any, source: string) => {
    if (!isMounted) return;

    if (maxLength && quillRef.current) {
      try {
        const editor = quillRef.current.getEditor();
        const textLength = editor.getText().trim().length;
        
        if (textLength > maxLength && source === 'user') {
          // Prevenir mudança se exceder o limite
          editor.deleteText(maxLength, textLength);
          const currentContentAfterDelete = editor.root.innerHTML;
          setEditorHtml(currentContentAfterDelete);
          onChange(currentContentAfterDelete);
          return;
        }
      } catch (error) {
        console.warn('Erro ao verificar limite de caracteres:', error);
      }
    }
    
    setEditorHtml(html);
    onChange(html);
  }, [onChange, maxLength, isMounted]);

  // Expor métodos via ref com verificações de segurança
  useImperativeHandle(ref, () => ({
    getContent: () => {
      try {
        return quillRef.current?.getEditor().root.innerHTML || '';
      } catch {
        return editorHtml;
      }
    },
    setContent: (newContent: string, source: string = 'api') => {
      if (!isMounted || !quillRef.current) return;

      try {
        const editor = quillRef.current.getEditor();
        const currentDOMContent = editor.root.innerHTML;
        
        if (currentDOMContent !== newContent) {
          // Usar setText + setContents para evitar problemas de range
          if (source === 'api') {
            // Limpar primeiro, depois definir conteúdo
            editor.setText('');
            setTimeout(() => {
              if (isMounted && quillRef.current) {
                try {
                  editor.clipboard.dangerouslyPasteHTML(0, newContent);
                  setEditorHtml(newContent);
                } catch (error) {
                  console.warn('Erro ao definir conteúdo do editor:', error);
                  // Fallback: definir através do estado
                  setEditorHtml(newContent);
                }
              }
            }, 0);
          } else {
            editor.clipboard.dangerouslyPasteHTML(0, newContent);
            setEditorHtml(newContent);
          }
        }
      } catch (error) {
        console.warn('Erro ao definir conteúdo:', error);
        // Fallback para estado React
        setEditorHtml(newContent);
      }
    },
    focus: () => {
      try {
        quillRef.current?.focus();
      } catch (error) {
        console.warn('Erro ao focar editor:', error);
      }
    },
    insertText: (text: string) => {
      if (!isMounted || !quillRef.current) return;

      try {
        const editor = quillRef.current.getEditor();
        const selection = editor.getSelection() || { index: editor.getLength(), length: 0 };
        editor.insertText(selection.index, text);
      } catch (error) {
        console.warn('Erro ao inserir texto:', error);
      }
    },
    getText: () => {
      try {
        return quillRef.current?.getEditor().getText() || '';
      } catch {
        // Fallback: extrair texto do HTML
        const div = document.createElement('div');
        div.innerHTML = editorHtml;
        return div.textContent || div.innerText || '';
      }
    },
    getLength: () => {
      try {
        return quillRef.current?.getEditor().getLength() || 0;
      } catch {
        return 0;
      }
    },
  }));

  // Configuração da toolbar com handlers seguros
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
        image: function() {
          if (!isMounted) return;
          
          const url = prompt('Insira a URL da imagem:');
          if (url && quillRef.current) {
            try {
              const editor = quillRef.current.getEditor();
              const range = editor.getSelection(true);
              if (editor && range) {
                editor.insertEmbed(range.index, 'image', url, Quill.sources.USER);
              }
            } catch (error) {
              console.warn('Erro ao inserir imagem:', error);
            }
          }
        }
      }
    },
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

  // Calcular comprimento do texto com verificação de segurança
  const textLength = (() => {
    try {
      return quillRef.current?.getEditor().getText().trim().length || 0;
    } catch {
      // Fallback: contar caracteres do HTML sem tags
      const div = document.createElement('div');
      div.innerHTML = editorHtml;
      return (div.textContent || div.innerText || '').trim().length;
    }
  })();

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
        preserveWhitespace={false} // Ajuda a evitar problemas de range
      />
      
      {/* Contador de caracteres */}
      {maxLength && (
        <div className="flex justify-between items-center px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <span>
            {textLength}/{maxLength} caracteres
          </span>
          {textLength > maxLength * 0.9 && (
            <span className={textLength >= maxLength ? 'text-red-600 font-semibold' : 'text-yellow-600'}>
              {textLength >= maxLength ? 'Limite atingido!' : 'Próximo do limite'}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

ReactQuillEditor.displayName = 'ReactQuillEditor';
export default ReactQuillEditor;