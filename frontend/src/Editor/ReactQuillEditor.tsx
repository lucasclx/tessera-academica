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
  content = '', // Conteúdo inicial e prop para atualizações externas
  placeholder = 'Escreva seu texto aqui...',
  onChange, // Callback para notificar mudanças de conteúdo ao componente pai
  onSelectionChange,
  editable = true,
  className = 'bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden',
  showToolbar = true,
  maxLength,
  theme = 'snow',
}, ref) => {
  // Estado interno para o HTML do editor, permitindo que o editor seja um componente controlado
  // e também reaja a mudanças na prop 'content'.
  const [editorHtml, setEditorHtml] = useState<string>(content);
  const quillRef = useRef<ReactQuill>(null);
  // Flag para controlar se o editor Quill interno já foi inicializado.
  // Evita que a prop 'content' sobrescreva o estado interno prematuramente
  // ou em momentos inadequados durante a montagem inicial.
  const [isInitialized, setIsInitialized] = useState(false);

  // Efeito para sincronizar a prop 'content' (externa) com o estado 'editorHtml' (interno).
  // Roda quando 'content' muda ou quando 'isInitialized' muda.
  useEffect(() => {
    // Apenas atualiza o estado interno se:
    // 1. O conteúdo da prop for diferente do estado HTML interno (evita loops).
    // 2. O editor interno Quill já estiver inicializado.
    if (content !== editorHtml && isInitialized) {
      setEditorHtml(content);
    }
  }, [content, editorHtml, isInitialized]); // Adicionado editorHtml à lista de dependências para maior precisão na comparação

  // Efeito para configurar o editor Quill após a montagem inicial e definir 'isInitialized'.
  // Roda apenas uma vez ou se 'onSelectionChange' mudar (o que é raro).
  useEffect(() => {
    if (quillRef.current && !isInitialized) {
      const editor = quillRef.current.getEditor();
      
      if (onSelectionChange) {
        editor.on('selection-change', (range) => {
          if (range) {
            onSelectionChange({ from: range.index, to: range.index + range.length });
          }
        });
      }
      // Marca o editor como inicializado após a configuração.
      setIsInitialized(true);
    }
  }, [onSelectionChange, isInitialized]); // isInitialized na dependência previne re-execução desnecessária após true.

  const handleChange = useCallback((html: string, delta: any, source: string) => {
    if (maxLength && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const textLength = editor.getText().trim().length; // Usar trim() para contar caracteres significativos
      
      if (textLength > maxLength && source === 'user') {
        // Impede a alteração se exceder o limite, removendo o texto excedente.
        // Esta é uma forma de controle, mas pode ser ajustada para melhor UX.
        editor.deleteText(maxLength, textLength); 
        // Re-obtém o HTML após a deleção para garantir consistência
        const currentContentAfterDelete = editor.root.innerHTML;
        setEditorHtml(currentContentAfterDelete);
        onChange(currentContentAfterDelete);
        return;
      }
    }
    
    setEditorHtml(html); // Atualiza o estado interno
    onChange(html); // Notifica o componente pai
  }, [onChange, maxLength]);

  // Expõe métodos do editor para o componente pai via ref.
  useImperativeHandle(ref, () => ({
    getContent: () => {
      return quillRef.current?.getEditor().root.innerHTML || '';
    },
    setContent: (newContent: string, source: string = 'api') => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        const currentDOMContent = editor.root.innerHTML;
        
        // Apenas atualiza se o novo conteúdo for realmente diferente do que está no DOM do Quill.
        // Isso previne re-renderizações e perda de foco/cursor desnecessárias.
        if (currentDOMContent !== newContent) {
          const selection = editor.getSelection();
          // Substitui todo o conteúdo. 'source' pode ser 'user', 'api', 'silent'.
          editor.clipboard.dangerouslyPasteHTML(0, newContent, source as any); 
          
          // Tenta restaurar a seleção do cursor, útil quando o conteúdo é alterado programaticamente.
          // O setTimeout(..., 0) ajuda a garantir que a seleção seja aplicada após o DOM ser atualizado.
          if (selection && source === 'api') { 
            setTimeout(() => {
              editor.setSelection(selection.index, selection.length); // Restaurar com índice e tamanho
            }, 0);
          }
          
          // Sincroniza o estado React 'editorHtml' com o novo conteúdo.
          // Isso é importante para que a prop 'value' do ReactQuill seja atualizada.
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
        const selection = editor.getSelection() || { index: editor.getLength(), length: 0 }; // Insere no final se não houver seleção
        editor.insertText(selection.index, text);
      }
    },
    getText: () => {
      // Retorna o texto puro, sem formatação HTML.
      return quillRef.current?.getEditor().getText() || '';
    },
    getLength: () => {
      // Retorna o comprimento do conteúdo do editor (incluindo nova linha final, geralmente).
      return quillRef.current?.getEditor().getLength() || 0;
    },
  }));

  // Configuração dos módulos da toolbar.
  // A toolbar é exibida condicionalmente com base na prop 'showToolbar'.
  const toolbarModules = showToolbar ? {
    toolbar: {
      container: [ // Configuração padrão da toolbar "snow"
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
      handlers: { // Handlers customizados para funcionalidades específicas da toolbar
        image: function() { // Handler para o botão de imagem
          const url = prompt('Insira a URL da imagem:');
          if (url) {
            const editor = quillRef.current?.getEditor();
            const range = editor?.getSelection(true); // Pega a seleção atual ou o cursor
            if (editor && range) {
              editor.insertEmbed(range.index, 'image', url, Quill.sources.USER);
            }
          }
        }
        // Outros handlers podem ser adicionados aqui.
      }
    },
    // blotFormatter: {} // Exemplo de módulo para redimensionar imagens, se registrado.
  } : { toolbar: false }; // Se showToolbar for false, nenhuma toolbar padrão é configurada.

  // Lista de formatos permitidos pelo editor.
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

  // Calcula o comprimento do texto para o contador de caracteres.
  // Usa getText().trim().length para uma contagem mais precisa de caracteres visíveis.
  const textLength = quillRef.current?.getEditor().getText().trim().length || 0;

  return (
    <div className={className}>
      <ReactQuill
        ref={quillRef}
        // O tema é 'snow' se a toolbar for exibida, caso contrário 'bubble'.
        // O tema 'bubble' geralmente tem uma toolbar flutuante que aparece ao selecionar texto.
        theme={showToolbar ? theme : "bubble"} 
        value={editorHtml} // O conteúdo do editor é controlado pelo estado 'editorHtml'.
        onChange={handleChange}
        modules={toolbarModules}
        formats={formats}
        readOnly={!editable} // Define se o editor é apenas para leitura.
        placeholder={placeholder}
        style={{
          minHeight: showToolbar ? '400px' : '300px', // Altura mínima dinâmica.
        }}
      />
      
      {/* Contador de caracteres, exibido se 'maxLength' for fornecido. */}
      {maxLength && (
        <div className="flex justify-between items-center px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <span>
            {textLength}/{maxLength} caracteres
          </span>
          {textLength > maxLength * 0.9 && ( // Feedback visual quando próximo do limite.
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