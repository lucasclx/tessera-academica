// src/Editor/TiptapEditor.tsx
import React, { useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent, /* BubbleMenu, */ Editor } from '@tiptap/react'; // BubbleMenu comentada
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import {
  BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, HighlighterIcon,
  AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon,
  ListIcon, ListOrderedIcon, QuoteIcon, CodeIcon, LinkIcon, ImageIcon,
  TableIcon, UndoIcon, RedoIcon, Heading1Icon, Heading2Icon, Heading3Icon, PilcrowIcon
} from 'lucide-react';

interface EditorProps {
  content?: string;
  placeholder?: string;
  onChange: (content: string) => void;
  onSelectionChange?: (selection: { from: number; to: number }) => void;
  editable?: boolean;
  className?: string;
  editorClassName?: string;
  showToolbar?: boolean;
}

export interface EditorRef {
  getContent: () => string;
  setContent: (content: string, emitUpdate?: boolean) => void;
  focus: (position?: 'start' | 'end' | 'all' | boolean | null) => void;
  insertText: (text: string) => void;
  getEditor: () => Editor | null;
}

const TiptapEditor = forwardRef<EditorRef, EditorProps>(({
  content = '',
  placeholder = 'Escreva seu texto aqui...',
  onChange,
  onSelectionChange,
  editable = true,
  className = 'bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden',
  editorClassName = 'min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar',
  showToolbar = true,
}, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      TextStyle, FontFamily,
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'], defaultAlignment: 'left' }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: 'text-primary-600 hover:text-primary-700 underline cursor-pointer', rel: 'noopener noreferrer nofollow', target: '_blank' } }),
      Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'max-w-full h-auto rounded-md border border-gray-200 my-4' } }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'border-collapse border border-gray-300 w-full my-4 table-fixed' } }),
      TableRow.configure({ HTMLAttributes: { class: 'border-b border-gray-200' } }),
      TableHeader.configure({ HTMLAttributes: { class: 'border border-gray-300 bg-gray-100 font-semibold p-2 text-left align-top' } }),
      TableCell.configure({ HTMLAttributes: { class: 'border border-gray-300 p-2 align-top' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: content,
    editable,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
    onSelectionUpdate: ({ editor: currentEditor }) => {
      if (onSelectionChange) {
        const { from, to } = currentEditor.state.selection;
        onSelectionChange({ from, to });
      }
    },
    editorProps: {
      attributes: { class: `prose prose-sm sm:prose lg:prose-base max-w-none focus:outline-none p-4 ${!editable ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'} ${editorClassName}` },
    },
  });

  useEffect(() => {
    if (editor) { 
      const currentEditorHTML = editor.getHTML();
      if (content !== currentEditorHTML) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);

  useImperativeHandle(ref, () => ({
    getContent: () => editor?.getHTML() || '',
    setContent: (newContent: string, emitUpdate: boolean = false) => editor?.commands.setContent(newContent, emitUpdate),
    focus: (position) => editor?.commands.focus(position),
    insertText: (text: string) => editor?.commands.insertContent(text),
    getEditor: () => editor,
  }));

  const setLinkCallback = useCallback(() => { if (!editor || !editable) return; const previousUrl = editor.getAttributes('link').href; const url = window.prompt('Insira a URL do link:', previousUrl || 'https://'); if (url === null) return; if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; } editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run(); }, [editor, editable]);
  const addImageCallback = useCallback(() => { if (!editor || !editable) return; const url = window.prompt('Insira a URL da imagem:'); if (url) { editor.chain().focus().setImage({ src: url }).run(); } }, [editor, editable]);
  const insertTableCallback = useCallback(() => { if (!editor || !editable) return; editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }, [editor, editable]);

  const ToolbarButton: React.FC<React.PropsWithChildren<{ onClick?: () => void; isActive?: boolean; disabled?: boolean; title?: string; className?: string; }>> = 
  ({ onClick, isActive = false, disabled = false, children, title, className = '' }) => (
    <button type="button" onClick={onClick} disabled={!editor || !editable || disabled} title={title}
      className={`p-1.5 sm:p-2 rounded-md transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-400 ${isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'} ${(!editor || !editable || disabled) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >{children}</button>
  );
  
  const EditorToolbar: React.FC = () => {
    if (!editor) {
      return <div className="editor-toolbar sticky top-0 z-10 bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap items-center gap-x-1 gap-y-0.5 h-[46px] min-h-[46px]"><span className="text-sm text-gray-400">Carregando editor...</span></div>;
    }
    const toggleHeading = (level: 1 | 2 | 3) => editor.chain().focus().toggleHeading({ level }).run();
    const setParagraph = () => editor.chain().focus().setParagraph().run();

    return (
      <div className="editor-toolbar sticky top-0 z-10 bg-gray-50 border-b border-gray-200 p-1 sm:p-2 flex flex-wrap items-center gap-x-1 gap-y-0.5">
        {/* Botões da Toolbar... (iguais à versão anterior) */}
        <div className="flex items-center border-r border-gray-200 pr-1 mr-1">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Desfazer (Ctrl+Z)"><UndoIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refazer (Ctrl+Y)"><RedoIcon size={18} /></ToolbarButton>
        </div>
        <div className="flex items-center border-r border-gray-200 pr-1 mr-1">
            <ToolbarButton onClick={setParagraph} isActive={editor.isActive('paragraph')} title="Parágrafo"><PilcrowIcon size={18} /></ToolbarButton>
            <ToolbarButton onClick={() => toggleHeading(1)} isActive={editor.isActive('heading', {level: 1})} title="Título 1"><Heading1Icon size={18}/></ToolbarButton>
            <ToolbarButton onClick={() => toggleHeading(2)} isActive={editor.isActive('heading', {level: 2})} title="Título 2"><Heading2Icon size={18}/></ToolbarButton>
            <ToolbarButton onClick={() => toggleHeading(3)} isActive={editor.isActive('heading', {level: 3})} title="Título 3"><Heading3Icon size={18}/></ToolbarButton>
        </div>
        <div className="flex items-center border-r border-gray-200 pr-1 mr-1">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Negrito (Ctrl+B)"><BoldIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Itálico (Ctrl+I)"><ItalicIcon size={18} /></ToolbarButton>
          {/* ... demais botões da toolbar como na versão anterior ... */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Sublinhado (Ctrl+U)"><UnderlineIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Riscado"><StrikethroughIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({color: '#FFF3A3'}).run()} isActive={editor.isActive('highlight')} title="Realçar"><HighlighterIcon size={18} /></ToolbarButton>
        </div>
        <div className="flex items-center border-r border-gray-200 pr-1 mr-1">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Lista com Marcadores"><ListIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Lista Numerada"><ListOrderedIcon size={18} /></ToolbarButton>
        </div>
        <div className="flex items-center border-r border-gray-200 pr-1 mr-1">
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Alinhar à Esquerda"><AlignLeftIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Centralizar"><AlignCenterIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Alinhar à Direita"><AlignRightIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justificar"><AlignJustifyIcon size={18} /></ToolbarButton>
        </div>
        <div className="flex items-center">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Citação"><QuoteIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Bloco de Código"><CodeIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={setLinkCallback} isActive={editor.isActive('link')} title="Inserir/Editar Link"><LinkIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={addImageCallback} title="Inserir Imagem"><ImageIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={insertTableCallback} title="Inserir Tabela"><TableIcon size={18} /></ToolbarButton>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {showToolbar && editable && <EditorToolbar />}
      
      {/* BubbleMenu COMENTADA para teste:
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100, placement: 'top' }}
          className="bg-gray-800 text-white shadow-lg border border-gray-700 rounded-md p-1 flex items-center space-x-0.5"
        >
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Negrito" className="text-white hover:bg-gray-700 !p-1.5"><BoldIcon size={16} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Itálico" className="text-white hover:bg-gray-700 !p-1.5"><ItalicIcon size={16} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Sublinhado" className="text-white hover:bg-gray-700 !p-1.5"><UnderlineIcon size={16} /></ToolbarButton>
          <ToolbarButton onClick={setLinkCallback} isActive={editor.isActive('link')} title="Link" className="text-white hover:bg-gray-700 !p-1.5"><LinkIcon size={16} /></ToolbarButton>
        </BubbleMenu>
      )}
      */}
      <EditorContent editor={editor} />
    </div>
  );
});

TiptapEditor.displayName = 'TiptapEditor';
export default TiptapEditor;