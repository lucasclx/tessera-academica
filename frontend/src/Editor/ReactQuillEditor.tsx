// Arquivo: srcs/src (cópia)/Editor/ReactQuillEditor.tsx (Novo arquivo)
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill'; // Import Quill para tipos, se necessário
import 'react-quill/dist/quill.snow.css'; // Importe o tema CSS (ex: snow)

// Defina a interface EditorRef se o componente pai ainda precisar dela
export interface EditorRef {
  getContent: () => string;
  setContent: (content: string, source?: string) => void;
  focus: () => void;
  // Adicione outros métodos que seu DocumentEditPage possa precisar
}

interface ReactQuillEditorProps {
  content?: string;
  placeholder?: string;
  onChange: (content: string) => void;
  editable?: boolean;
  className?: string; // Para o container do editor
  editorClassName?: string; // Para a área de edição interna (se aplicável via CSS)
  showToolbar?: boolean; // Controla a visibilidade da toolbar
}

const ReactQuillEditor = forwardRef<EditorRef, ReactQuillEditorProps>(({
  content = '',
  placeholder = 'Escreva seu texto aqui...',
  onChange,
  editable = true,
  className = 'bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden',
  // editorClassName não é diretamente aplicável ao ReactQuill da mesma forma, mas você pode estilizar .ql-editor
  showToolbar = true,
}, ref) => {
  const [editorHtml, setEditorHtml] = useState<string>(content);
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    // Sincroniza o conteúdo se a prop 'content' mudar externamente
    // Evita loop se a mudança foi originada pelo próprio editor
    if (content !== editorHtml) {
      setEditorHtml(content);
    }
  }, [content]);

  const handleChange = (html: string) => {
    setEditorHtml(html);
    onChange(html);
  };

  useImperativeHandle(ref, () => ({
    getContent: () => {
      return quillRef.current?.getEditor().root.innerHTML || '';
    },
    setContent: (newContent: string, source: string = 'api') => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        if (editor.root.innerHTML !== newContent) {
            // Para evitar re-renderização desnecessária e perda de cursor,
            // verifique se o conteúdo realmente mudou.
            // O 'source' pode ser usado para distinguir updates programáticos de updates do usuário.
            editor.clipboard.dangerouslyPasteHTML(0, newContent, source as any); 
            // Ou, para limpar e definir: editor.setText(''); editor.clipboard.dangerouslyPasteHTML(0, newContent);
            setEditorHtml(newContent); // Sincroniza estado interno
        }
      }
    },
    focus: () => {
      quillRef.current?.focus();
    },
  }));

  // Configuração da barra de ferramentas (módulos e formatos)
  // Consulte a documentação do React Quill para todas as opções
  const modules = showToolbar ? {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      [{ 'font': [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }], // Cor de texto e de fundo
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }], // Recuo
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'], // Vídeo é um exemplo, pode não precisar
      ['table'], // Módulo de tabela (pode precisar de configuração adicional ou extensão)
      ['clean'] // Remover formatação
    ],
    // Adicionar outros módulos como manipulação de imagem, etc.
    // imageResize: { parchment: Quill.import('parchment') }, // Exemplo, se usar extensão de redimensionamento
  } : { toolbar: false };

  const formats = [
    'header', 'font',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'link', 'image', 'video', 'table'
  ];

  return (
    <div className={className}>
      <ReactQuill
        ref={quillRef}
        theme={showToolbar ? "snow" : "bubble"} // "snow" é o tema com toolbar, "bubble" é flutuante
        value={editorHtml}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        readOnly={!editable}
        placeholder={placeholder}
        // A classe do editor interno é .ql-editor, você pode estilizá-la globalmente
        // ou tentar passar um estilo para o container do ReactQuill.
        // A prop `className` aqui se aplica ao div wrapper do ReactQuill.
      />
    </div>
  );
});

ReactQuillEditor.displayName = 'ReactQuillEditor';
export default ReactQuillEditor;