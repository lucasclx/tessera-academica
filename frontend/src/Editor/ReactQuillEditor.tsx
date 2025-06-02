// src/Editor/ReactQuillEditor.tsx - VERSÃO OTIMIZADA
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback, useMemo } from 'react';
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
  const lastContentRef = useRef<string>(content);
  const isUpdatingRef = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout>();

  // Debug logs reduzidos - apenas para mudanças importantes
  const debugLog = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 ReactQuillEditor: ${message}`, data || '');
    }
  }, []);

  // Memoizar configurações da toolbar para evitar re-criações
  const toolbarModules = useMemo(() => {
    if (!showToolbar) return { toolbar: false };
    
    return {
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
            if (!isMounted || !editable) return;
            
            const url = prompt('Insira a URL da imagem:');
            if (url && quillRef.current) {
              try {
                const editor = quillRef.current.getEditor();
                const range = editor.getSelection(true);
                if (editor && range) {
                  editor.insertEmbed(range.index, 'image', url, Quill.sources.USER);
                }
              } catch (error) {
                console.warn('⚠️ Erro ao inserir imagem:', error);
              }
            }
          }
        }
      },
    };
  }, [showToolbar, isMounted, editable]);

  const formats = useMemo(() => [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'align',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ], []);

  // Efeito para marcar como montado
  useEffect(() => {
    debugLog('📦 Componente montado');
    setIsMounted(true);
    
    return () => {
      debugLog('📦 Componente desmontado');
      setIsMounted(false);
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [debugLog]);

  // Efeito para sincronização de conteúdo externo (OTIMIZADO)
  useEffect(() => {
    // Evitar loops: só atualizar se o conteúdo realmente mudou e não estamos em atualização
    if (
      content !== lastContentRef.current && 
      content !== editorHtml && 
      !isUpdatingRef.current &&
      isMounted &&
      isInitialized
    ) {
      debugLog('🔄 Sincronizando conteúdo externo', { 
        new: content.substring(0, 50) + '...', 
        current: editorHtml.substring(0, 50) + '...' 
      });
      
      lastContentRef.current = content;
      setEditorHtml(content);
      
      // Atualizar o editor se estiver pronto
      if (quillRef.current) {
        try {
          const editor = quillRef.current.getEditor();
          const currentContent = editor.root.innerHTML;
          if (currentContent !== content) {
            isUpdatingRef.current = true;
            editor.clipboard.dangerouslyPasteHTML(0, content);
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 100);
          }
        } catch (error) {
          console.warn('⚠️ Erro ao sincronizar conteúdo:', error);
          isUpdatingRef.current = false;
        }
      }
    }
  }, [content, editorHtml, isMounted, isInitialized, debugLog]);

  // Efeito para inicialização do editor (OTIMIZADO)
  useEffect(() => {
    if (quillRef.current && !isInitialized && isMounted) {
      debugLog('🚀 Inicializando editor Quill');
      
      initTimeoutRef.current = setTimeout(() => {
        if (!isMounted) return;
        
        try {
          const editor = quillRef.current?.getEditor();
          if (editor) {
            // Configurar listener de seleção apenas uma vez
            if (onSelectionChange) {
              editor.on('selection-change', (range) => {
                if (range && isMounted && !isUpdatingRef.current) {
                  onSelectionChange({ from: range.index, to: range.index + range.length });
                }
              });
            }
            
            // Definir conteúdo inicial se houver
            if (content && content !== editor.root.innerHTML) {
              isUpdatingRef.current = true;
              editor.clipboard.dangerouslyPasteHTML(0, content);
              setEditorHtml(content);
              lastContentRef.current = content;
              setTimeout(() => {
                isUpdatingRef.current = false;
              }, 100);
            }
            
            debugLog('✅ Editor Quill inicializado com sucesso');
            setIsInitialized(true);
          }
        } catch (error) {
          console.warn('❌ Erro na inicialização do Quill:', error);
          isUpdatingRef.current = false;
        }
      }, 100);
    }

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [onSelectionChange, isInitialized, isMounted, content, debugLog]);

  // Handler de mudança otimizado
  const handleChange = useCallback((html: string, delta: any, source: string) => {
    // Evitar loops durante atualizações programáticas
    if (isUpdatingRef.current || !isMounted) {
      return;
    }

    debugLog('📝 Editor onChange', { source, length: html.length });

    // Verificar limite de caracteres
    if (maxLength && quillRef.current && source === 'user') {
      try {
        const editor = quillRef.current.getEditor();
        const textLength = editor.getText().trim().length;
        
        if (textLength > maxLength) {
          // Prevenir mudança se exceder o limite
          isUpdatingRef.current = true;
          editor.deleteText(maxLength, textLength);
          const currentContentAfterDelete = editor.root.innerHTML;
          setEditorHtml(currentContentAfterDelete);
          lastContentRef.current = currentContentAfterDelete;
          onChange(currentContentAfterDelete);
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 50);
          return;
        }
      } catch (error) {
        console.warn('⚠️ Erro ao verificar limite de caracteres:', error);
      }
    }
    
    // Atualizar estados
    setEditorHtml(html);
    lastContentRef.current = html;
    onChange(html);
  }, [onChange, maxLength, isMounted, debugLog]);

  // Expor métodos via ref com verificações de segurança
  useImperativeHandle(ref, () => ({
    getContent: () => {
      try {
        return quillRef.current?.getEditor().root.innerHTML || editorHtml;
      } catch {
        return editorHtml;
      }
    },
    
    setContent: (newContent: string, source: string = 'api') => {
      debugLog('📥 setContent chamado', { 
        source, 
        contentLength: newContent.length,
        isUpdating: isUpdatingRef.current 
      });
      
      if (!isMounted || !quillRef.current || isUpdatingRef.current) return;

      try {
        const editor = quillRef.current.getEditor();
        const currentDOMContent = editor.root.innerHTML;
        
        if (currentDOMContent !== newContent) {
          isUpdatingRef.current = true;
          
          if (source === 'api') {
            // Para updates programáticos, usar pasteHTML
            editor.clipboard.dangerouslyPasteHTML(0, newContent);
          } else {
            // Para updates do usuário, usar pasteHTML também
            editor.clipboard.dangerouslyPasteHTML(0, newContent);
          }
          
          setEditorHtml(newContent);
          lastContentRef.current = newContent;
          
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 100);
          
          debugLog('✅ Conteúdo definido com sucesso');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao definir conteúdo:', error);
        isUpdatingRef.current = false;
        // Fallback para state
        setEditorHtml(newContent);
        lastContentRef.current = newContent;
      }
    },
    
    focus: () => {
      try {
        if (quillRef.current && isMounted) {
          quillRef.current.focus();
        }
      } catch (error) {
        console.warn('⚠️ Erro ao focar editor:', error);
      }
    },
    
    insertText: (text: string) => {
      if (!isMounted || !quillRef.current) return;

      try {
        const editor = quillRef.current.getEditor();
        const selection = editor.getSelection() || { index: editor.getLength(), length: 0 };
        editor.insertText(selection.index, text);
      } catch (error) {
        console.warn('⚠️ Erro ao inserir texto:', error);
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
  }), [editorHtml, isMounted, debugLog]);

  // Calcular comprimento do texto de forma otimizada
  const textLength = useMemo(() => {
    try {
      if (quillRef.current && isInitialized) {
        return quillRef.current.getEditor().getText().trim().length || 0;
      }
    } catch {
      // Fallback
      const div = document.createElement('div');
      div.innerHTML = editorHtml;
      return (div.textContent || div.innerText || '').trim().length;
    }
    return 0;
  }, [editorHtml, isInitialized]);

  debugLog('📊 Renderizando ReactQuillEditor', { 
    textLength, 
    isInitialized, 
    isMounted,
    isUpdating: isUpdatingRef.current
  });

  return (
    <div className={className}>
      {/* Debug info - apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
          🔍 DEBUG: Montado: {isMounted ? '✅' : '❌'} | 
          Inicializado: {isInitialized ? '✅' : '❌'} | 
          Editável: {editable ? '✅' : '❌'} |
          Atualizando: {isUpdatingRef.current ? '⚠️' : '✅'}
        </div>
      )}
      
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
        preserveWhitespace={false}
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