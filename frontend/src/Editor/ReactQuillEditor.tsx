// Arquivo: srcs/src (cópia)/Editor/ReactQuillEditor.tsx
// src/Editor/ReactQuillEditor.tsx - VERSÃO OTIMIZADA E CORRIGIDA
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
  getEditor: () => Quill | null; // Adicionado para debug externo se necessário
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
  const lastContentPropRef = useRef<string>(content); // Para rastrear a prop 'content'
  const isUpdatingProgrammaticallyRef = useRef(false); // Para controle de updates programáticos
  const initTimeoutRef = useRef<NodeJS.Timeout>();

  const debugLog = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 ReactQuillEditor: ${message}`, data || '');
    }
  }, []);

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
            if (!isMounted || !editable || !quillRef.current) return;
            const url = prompt('Insira a URL da imagem:');
            if (url) {
              try {
                const editor = quillRef.current.getEditor();
                const range = editor.getSelection(true);
                editor.insertEmbed(range.index, 'image', url, Quill.sources.USER);
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
    'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'script', 'align', 'list', 'bullet', 'indent',
    'blockquote', 'code-block', 'link', 'image', 'video'
  ], []);

  useEffect(() => {
    debugLog('📦 Componente montado');
    setIsMounted(true);
    return () => {
      debugLog('📦 Componente desmontado');
      setIsMounted(false);
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
    };
  }, [debugLog]);

  // Efeito para sincronização de conteúdo externo (prop 'content')
  useEffect(() => {
    if (isMounted && isInitialized && !isUpdatingProgrammaticallyRef.current && content !== lastContentPropRef.current) {
      debugLog('🔄 Sincronizando prop "content" com editor', {
        newPropContent: content.substring(0, 50) + '...',
        currentEditorHtml: editorHtml.substring(0, 50) + '...'
      });

      const editor = quillRef.current?.getEditor();
      if (editor) {
        const currentEditorDOMContent = editor.root.innerHTML;
        if (currentEditorDOMContent !== content) {
          isUpdatingProgrammaticallyRef.current = true;
          editor.clipboard.dangerouslyPasteHTML(0, content);
          lastContentPropRef.current = content; // Crucial para evitar loop com a prop

          setTimeout(() => {
            if (isMounted) isUpdatingProgrammaticallyRef.current = false;
          }, 100);
        } else {
           lastContentPropRef.current = content;
        }
      }
    }
  }, [content, isMounted, isInitialized, editorHtml, debugLog]);


  // Efeito para inicialização do editor Quill
  useEffect(() => {
    if (quillRef.current && !isInitialized && isMounted) {
      debugLog('🚀 Tentando inicializar editor Quill...');
      initTimeoutRef.current = setTimeout(() => {
        if (!isMounted) return;
        try {
          const editor = quillRef.current?.getEditor();
          if (editor) {
            if (onSelectionChange) {
              editor.on('selection-change', (range, _oldRange, source) => { // Corrigido _oldRange
                if (range && isMounted && !isUpdatingProgrammaticallyRef.current && source === Quill.sources.USER) {
                  onSelectionChange({ from: range.index, to: range.index + range.length });
                }
              });
            }
            // O conteúdo inicial é passado via `value` para ReactQuill.
            // Se a prop `content` for diferente do que o editor renderizou inicialmente,
            // o useEffect de sincronização acima cuidará disso.
            // Atualiza o editorHtml e lastContentPropRef para o estado inicial do editor, se necessário.
            const initialDOMContent = editor.root.innerHTML;
            if (editorHtml !== initialDOMContent) {
                setEditorHtml(initialDOMContent);
            }
            if (lastContentPropRef.current !== initialDOMContent) {
                lastContentPropRef.current = initialDOMContent;
            }

            debugLog('✅ Editor Quill inicializado com sucesso');
            setIsInitialized(true);
          } else {
            console.warn('❓ Editor Quill (getEditor()) não encontrado durante a tentativa de inicialização.');
          }
        } catch (error) {
          console.warn('❌ Erro na inicialização do Quill:', error);
        }
      }, 150);
    }
    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
    };
  }, [isInitialized, isMounted, onSelectionChange, debugLog, editorHtml]); // Adicionado editorHtml para re-avaliar se a inicialização precisa forçar o estado


  const handleChange = useCallback((newHtml: string, _delta: any, source: string, editorInstance: Quill) => { // Corrigido _delta
    if (isUpdatingProgrammaticallyRef.current || !isMounted) {
      return;
    }

    const textContent = editorInstance.getText();
    debugLog('📝 Editor onChange disparado', { source, htmlLength: newHtml.length, textLength: textContent.trim().length });

    if (maxLength && source === Quill.sources.USER) {
      const textLength = textContent.trim().length;
      if (textLength > maxLength) {
        isUpdatingProgrammaticallyRef.current = true;
        // Quill pode ser um pouco temperamental com deleteText e o cursor.
        // Guardar a seleção, deletar, e restaurar pode ser necessário em casos complexos.
        const selection = editorInstance.getSelection();
        editorInstance.deleteText(maxLength, textLength - maxLength + 1);
        // O Quill vai disparar outro onChange após deleteText.
        // Deixar esse onChange propagar as alterações.
        if(selection) {
            // Tenta restaurar o cursor para uma posição válida
            editorInstance.setSelection(Math.min(selection.index, maxLength), 0, Quill.sources.SILENT);
        }
        setTimeout(() => {
          if(isMounted) isUpdatingProgrammaticallyRef.current = false;
        }, 50);
        return;
      }
    }

    // Atualizar estados e notificar o pai
    // Compara com o estado interno editorHtml para evitar chamar onChange desnecessariamente
    // se o conteúdo for o mesmo que já está no estado (útil se Quill disparar múltiplos eventos)
    if (newHtml !== editorHtml) {
        setEditorHtml(newHtml);
        lastContentPropRef.current = newHtml; // Mantém sincronizado com o que está efetivamente no editor
        onChange(newHtml);
    }

  }, [onChange, maxLength, isMounted, debugLog, editorHtml]);

  useImperativeHandle(ref, () => ({
    getContent: () => {
      try {
        return quillRef.current?.getEditor().root.innerHTML || editorHtml;
      } catch { return editorHtml; }
    },
    setContent: (newContent: string, source: string = 'api') // source é mais informativo que emitUpdate
      : void => {
      debugLog('📥 setContent chamado externamente', { source, newContentLength: newContent.length, currentEditorHtmlLength: editorHtml.length });
      if (!isMounted || !quillRef.current || !isInitialized ) { // Checa isInitialized
        console.warn("setContent chamado mas editor não está pronto/montado/inicializado. Agendando ou atualizando estado.");
        // Se não estiver inicializado, atualiza o estado para que o useEffect de sync pegue
        // ou para que seja o valor inicial quando o ReactQuill montar.
        lastContentPropRef.current = newContent;
        setEditorHtml(newContent); // Isso fará com que o ReactQuill receba o novo `value`
        return;
      }
      try {
        const editor = quillRef.current.getEditor();
        const currentDOMContent = editor.root.innerHTML;

        if (currentDOMContent !== newContent) {
          isUpdatingProgrammaticallyRef.current = true;
          editor.clipboard.dangerouslyPasteHTML(0, newContent); // Colar no início
          // O evento onChange do Quill será disparado por pasteHTML.
          // Esse evento atualizará editorHtml e lastContentPropRef.
          // lastContentPropRef.current = newContent; // Atualizado no onChange disparado
          setTimeout(() => {
            if(isMounted) isUpdatingProgrammaticallyRef.current = false;
          }, 100); // Aumentar um pouco para dar tempo ao editor
          debugLog('✅ Conteúdo definido programaticamente com sucesso via setContent');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao definir conteúdo programaticamente via setContent:', error);
        if(isMounted) isUpdatingProgrammaticallyRef.current = false;
        // Fallback para o estado se o editor falhar
        setEditorHtml(newContent);
        lastContentPropRef.current = newContent;
      }
    },
    focus: () => {
      try {
        if (quillRef.current && isMounted && isInitialized) quillRef.current.focus();
      } catch (error) { console.warn('⚠️ Erro ao focar editor:', error); }
    },
    insertText: (text: string) => {
      if (!isMounted || !quillRef.current || !isInitialized) return;
      try {
        const editor = quillRef.current.getEditor();
        const selection = editor.getSelection() || { index: editor.getLength(), length: 0 };
        editor.insertText(selection.index, text, Quill.sources.USER);
      } catch (error) { console.warn('⚠️ Erro ao inserir texto:', error); }
    },
    getText: () => {
      try {
        return quillRef.current?.getEditor().getText() || '';
      } catch {
        const div = document.createElement('div');
        div.innerHTML = editorHtml;
        return (div.textContent || div.innerText || '').trim();
      }
    },
    getLength: () => {
      try {
        return quillRef.current?.getEditor().getLength() || 0;
      } catch { return 0; }
    },
    getEditor: () => {
        try {
            return quillRef.current?.getEditor() || null;
        } catch { return null; }
    }
  }), [editorHtml, isMounted, isInitialized, debugLog, onChange]); // Adicionado onChange às dependências

  const textLength = useMemo(() => {
    if (isInitialized && quillRef.current) {
        try { return quillRef.current.getEditor().getText().trim().length || 0; } catch { /* fallback abaixo */ }
    }
    const div = document.createElement('div'); div.innerHTML = editorHtml;
    return (div.textContent || div.innerText || '').trim().length;
  }, [editorHtml, isInitialized]);

  return (
    <div className={className}>
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-1 p-1 bg-yellow-50 border border-yellow-200 rounded text-xs">
          DEBUG: Montado: {isMounted ? '✅' : '❌'} |
          Inicializado: {isInitialized ? '✅' : '❌'} |
          Editável: {editable ? '✅' : '❌'} |
          ProgUpdate: {isUpdatingProgrammaticallyRef.current ? '⚠️' : '✅'} |
          PropContent: {(content || '').substring(0,20)}... |
          EditorHTML: {editorHtml.substring(0,20)}... |
          LastPropContent: {(lastContentPropRef.current || '').substring(0,20)}...
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
        style={{ minHeight: showToolbar ? '400px' : '300px' }}
        preserveWhitespace={false}
      />
      {maxLength && (
        <div className="flex justify-between items-center px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <span>{textLength}/{maxLength} caracteres</span>
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