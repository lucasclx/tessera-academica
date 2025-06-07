import React, { useEffect, useImperativeHandle, forwardRef, useMemo, useState } from 'react';
import { useEditor, EditorContent, Editor, BubbleMenu, EditorEvents } from '@tiptap/react';
import { PluginKey } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import {
  BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, HighlighterIcon,
  AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon,
  ListIcon, ListOrderedIcon, QuoteIcon, CodeIcon, LinkIcon, ImageIcon,
  TableIcon, UndoIcon, RedoIcon, Heading1Icon, Heading2Icon, Heading3Icon, PilcrowIcon,
  SubscriptIcon, SuperscriptIcon
} from 'lucide-react';

const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    {message && <p className="mt-3 text-gray-600">{message}</p>}
  </div>
);

interface EditorProps {
  content?: string;
  placeholder?: string;
  onChange: (content: string) => void;
  onSelectionChange?: (selection: { from: number; to: number }) => void;
  onAddComment?: (selection: { from: number; to: number }) => void;
  editable?: boolean;
  className?: string;
  editorClassName?: string;
  showToolbar?: boolean;
  maxLength?: number;
}

export interface EditorRef {
  getContent: () => string;
  setContent: (content: string, sourceOrEmitUpdate?: string | boolean) => void;
  focus: (position?: 'start' | 'end' | 'all' | boolean | null) => void;
  insertText: (text: string) => void;
  getEditor: () => Editor | null;
}

const editorExtensionsConfig = (placeholderText: string, charLimit?: number) => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
  }),
  TextStyle, FontFamily,
  Highlight.configure({ multicolor: true }),
  Underline,
  Subscript,
  Superscript,
  TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'], defaultAlignment: 'left' }),
  Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: 'text-primary-600 hover:text-primary-700 underline cursor-pointer', rel: 'noopener noreferrer nofollow', target: '_blank' } }),
  Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'max-w-full h-auto rounded-md border border-gray-200 my-4' } }),
  Table.configure({ resizable: true, HTMLAttributes: { class: 'border-collapse border border-gray-300 w-full my-4 table-fixed' } }),
  TableRow.configure({ HTMLAttributes: { class: 'border-b border-gray-200' } }),
  TableHeader.configure({ HTMLAttributes: { class: 'border border-gray-300 bg-gray-100 font-semibold p-2 text-left align-top' } }),
  TableCell.configure({ HTMLAttributes: { class: 'border border-gray-300 p-2 align-top' } }),
  Placeholder.configure({ placeholder: placeholderText }),
  CharacterCount.configure({ limit: charLimit }),
];

const TiptapEditor = forwardRef<EditorRef, EditorProps>(({
  content: initialContentProp = '',
  placeholder = 'Escreva seu texto aqui...',
  onChange,
  onSelectionChange,
  onAddComment,
  editable = true,
  className = '',
  editorClassName = 'min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar',
  showToolbar = true,
  maxLength,
}, ref) => {
  const [isEditorReallyReady, setIsEditorReallyReady] = useState(false);
  const extensions = useMemo(() => editorExtensionsConfig(placeholder, maxLength), [placeholder, maxLength]);

  const editor = useEditor({
    extensions,
    content: initialContentProp,
    editable: editable,
    onUpdate: ({ editor: currentEditor }: EditorEvents['update']) => {
      if (currentEditor.isDestroyed) return;
      onChange(currentEditor.getHTML());
    },
    onSelectionUpdate: ({ editor: currentEditor }: EditorEvents['selectionUpdate']) => {
      if (currentEditor.isDestroyed) return;
      if (onSelectionChange) {
        const { from, to } = currentEditor.state.selection;
        onSelectionChange({ from, to });
      }
    },
    editorProps: {
      attributes: { class: `prose prose-sm sm:prose lg:prose-base max-w-none focus:outline-none p-4 ${!editable ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'} ${editorClassName}` },
    },
    onCreate: ({ editor: createdEditor}) => {
        // console.log("TiptapEditor: onCreate disparado");
        if (!createdEditor.isDestroyed) {
            setIsEditorReallyReady(true);
        }
    },
    onDestroy: () => {
        // console.log("TiptapEditor: onDestroy disparado");
        setIsEditorReallyReady(false);
    }
  }, [extensions]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentEditorHTML = editor.getHTML();
      const tiptapEmptyContent = "<p></p>";
      const propIsEffectivelyEmpty = initialContentProp === "" || initialContentProp === "<p><br></p>";
      const editorIsEffectivelyEmpty = currentEditorHTML === tiptapEmptyContent || currentEditorHTML === "" || currentEditorHTML === "<p><br></p>";

      if (initialContentProp !== currentEditorHTML && !(propIsEffectivelyEmpty && editorIsEffectivelyEmpty)) {
        editor.commands.setContent(initialContentProp, false);
      }
    }
  }, [initialContentProp, editor]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  useImperativeHandle(ref, () => ({
    getContent: () => editor?.getHTML() || '',
    setContent: (newContent: string, sourceOrEmitUpdate?: string | boolean) => {
      if (editor && !editor.isDestroyed) {
        let emitUpdateForCommand = false;
        if (typeof sourceOrEmitUpdate === 'boolean') {
          emitUpdateForCommand = sourceOrEmitUpdate;
        }
        editor.commands.setContent(newContent, emitUpdateForCommand);
      } else {
        console.warn("TiptapEditor setContent (ref): editor não está pronto ou foi destruído.");
      }
    },
    focus: (position) => editor?.commands.focus(position),
    insertText: (text: string) => editor?.commands.insertContent(text),
    getEditor: () => editor || null,
  }));

  const ToolbarButton = React.memo<React.PropsWithChildren<{ onClick?: () => void; isActive?: boolean; isDisabled?: boolean; title?: string; className?: string; }>>(
    ({ onClick, isActive = false, isDisabled = false, children, title, className = '' }) => {
    return (
      <button type="button" onClick={onClick} disabled={isDisabled || !editable || !editor || editor.isDestroyed } title={title}
        className={`p-1.5 sm:p-2 rounded-md transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-400 ${isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'} ${isDisabled || !editable || !editor || editor.isDestroyed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >{children}</button>
    );
  });
  ToolbarButton.displayName = 'ToolbarButton';


  const EditorToolbar: React.FC = () => {
    if (!isEditorReallyReady || !editor || editor.isDestroyed || !editable) {
      return (
        <div className="editor-toolbar sticky top-0 z-10 bg-gray-50 border-b border-gray-200 p-1 sm:p-2 flex flex-wrap items-center gap-x-1 gap-y-0.5 min-h-[46px]">
          <span className="text-sm text-gray-400">
            { !editor || editor.isDestroyed ? "Editor não disponível" : (!editable ? "Modo de visualização" : "Carregando toolbar...") }
          </span>
        </div>
      );
    }
    const toggleHeading = (level: 1 | 2 | 3) => editor.chain().focus().toggleHeading({ level }).run();
    const setParagraph = () => editor.chain().focus().setParagraph().run();
    const setLinkCallback = () => { const previousUrl = editor.getAttributes('link').href; const url = window.prompt('Insira a URL do link:', previousUrl || 'https://'); if (url === null) return; if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; } editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run(); };
    const addImageCallback = () => { const url = window.prompt('Insira a URL da imagem:'); if (url) { editor.chain().focus().setImage({ src: url }).run(); } };
    const insertTableCallback = () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

    return (
      <div className="editor-toolbar sticky top-0 z-10 bg-gray-50 border-b border-gray-200 p-1 sm:p-2 flex flex-wrap items-center gap-x-1 gap-y-0.5 min-h-[46px]">
        <div className="flex items-center border-r border-gray-200 pr-1 mr-1">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} isDisabled={!editor.can().undo()} title="Desfazer (Ctrl+Z)"><UndoIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} isDisabled={!editor.can().redo()} title="Refazer (Ctrl+Y)"><RedoIcon size={18} /></ToolbarButton>
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
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Sublinhado (Ctrl+U)"><UnderlineIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Riscado"><StrikethroughIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({color: '#FFF3A3'}).run()} isActive={editor.isActive('highlight')} title="Realçar"><HighlighterIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscrito"><SubscriptIcon size={18} /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Sobrescrito"><SuperscriptIcon size={18} /></ToolbarButton>
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

  const bubbleMenuPluginKey = useMemo(() => new PluginKey('bubbleMenuKey-' + Math.random().toString(36).substr(2, 9)), []);

  if (!editor || !isEditorReallyReady) {
    return (
      <div className={`${className} flex items-center justify-center min-h-[400px]`}>
        <LoadingSpinner message="Preparando editor..." />
      </div>
    );
  }

  return (
    <div className={className}>
      {showToolbar && <EditorToolbar /> } {/* EditorToolbar é renderizada aqui */}

      {editable && editor && !editor.isDestroyed && isEditorReallyReady && (
        <BubbleMenu
          editor={editor}
          pluginKey={bubbleMenuPluginKey}
          tippyOptions={{
            duration: 100,
            placement: 'top-start',
            arrow: true,
            animation: 'shift-away',
            appendTo: () => document.body,
          }}
          className="bubble-menu bg-gray-800 text-white px-3 py-1.5 rounded-lg shadow-xl flex items-center space-x-1 border border-gray-700 z-50"
          shouldShow={({ editor: currentEditor, view: _view, state, from, to }) => {
            if (!currentEditor || currentEditor.isDestroyed || !isEditorReallyReady) return false;
            const { selection } = state;
            const { empty } = selection;
            // const hasFocus = _view.hasFocus(); // Removido hasFocus daqui, pois pode ser problemático
            if (empty) return false; // Só mostra se a seleção não estiver vazia
            return state.doc.textBetween(from, to, ' ').trim().length > 0;
          }}
        >
          <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editable || !editor.can().chain().focus().toggleBold().run()} className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-primary-500 text-white' : 'hover:bg-gray-700'} disabled:opacity-50`} title="Negrito (Ctrl+B)"><BoldIcon size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editable || !editor.can().chain().focus().toggleItalic().run()} className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-primary-500 text-white' : 'hover:bg-gray-700'} disabled:opacity-50`} title="Itálico (Ctrl+I)"><ItalicIcon size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editable || !editor.can().chain().focus().toggleUnderline().run()} className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-primary-500 text-white' : 'hover:bg-gray-700'} disabled:opacity-50`} title="Sublinhado (Ctrl+U)"><UnderlineIcon size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editable || !editor.can().chain().focus().toggleStrike().run()} className={`p-1.5 rounded ${editor.isActive('strike') ? 'bg-primary-500 text-white' : 'hover:bg-gray-700'} disabled:opacity-50`} title="Riscado"><StrikethroughIcon size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleSubscript().run()} disabled={!editable || !editor.can().chain().focus().toggleSubscript().run()} className={`p-1.5 rounded ${editor.isActive('subscript') ? 'bg-primary-500 text-white' : 'hover:bg-gray-700'} disabled:opacity-50`} title="Subscrito"><SubscriptIcon size={16} /></button>
          <button onClick={() => editor.chain().focus().toggleSuperscript().run()} disabled={!editable || !editor.can().chain().focus().toggleSuperscript().run()} className={`p-1.5 rounded ${editor.isActive('superscript') ? 'bg-primary-500 text-white' : 'hover:bg-gray-700'} disabled:opacity-50`} title="Sobrescrito"><SuperscriptIcon size={16} /></button>
          {onAddComment && (
            <button
              onClick={() => {
                const { from, to } = editor.state.selection;
                onAddComment({ from, to });
              }}
              disabled={!editable}
              className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-50"
              title="Comentar seleção"
            >
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => { const previousUrl = editor.getAttributes('link').href; const url = window.prompt('URL do link:', previousUrl || 'https://'); if (url === null) return; if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; } editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();}} disabled={!editable} className={`p-1.5 rounded ${editor.isActive('link') ? 'bg-primary-500 text-white' : 'hover:bg-gray-700'} disabled:opacity-50`} title="Link"><LinkIcon size={16} /></button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />

      {editor && !editor.isDestroyed && editable && isEditorReallyReady && (
        <div className="text-xs text-gray-500 p-2 border-t border-gray-200 bg-gray-50 flex justify-end space-x-4 rounded-b-lg">
          <span>{editor.storage.characterCount.characters()} caracteres</span>
          <span>{editor.storage.characterCount.words()} palavras</span>
          {maxLength !== undefined && editor.storage.characterCount.characters() > maxLength && (
            <span className='text-red-500 font-semibold'>
              Limite de {maxLength} caracteres excedido!
            </span>
          )}
        </div>
      )}
    </div>
  );
});

TiptapEditor.displayName = 'TiptapEditor';
export default TiptapEditor;