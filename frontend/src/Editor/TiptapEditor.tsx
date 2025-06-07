import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaUnderline,
  FaCode,
  FaParagraph,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaUndo,
  FaRedo,
  FaHighlighter,
} from "react-icons/fa6";
import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
import {
  BsCodeSlash,
  BsBlockquoteLeft,
  BsTypeSuperscript,
  BsTypeSubscript,
} from 'react-icons/bs';

export interface EditorRef {
  getContent: () => string;
  getHTML: () => string;
  getJSON: () => object;
  clearContent: () => void;
  focus: () => void;
  isFocused: () => boolean;
}

interface TiptapEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  onSelectionChange?: (selection: { from: number; to: number }) => void;
  onAddComment?: (selection: { from: number; to: number }) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  showToolbar?: boolean;
  editable?: boolean;
}

const ToolbarButton = ({
  onClick,
  isActive,
  children,
  title,
}: {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-2 rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-blue-100 text-blue-600'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

const Toolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const buttons = [
    { name: 'bold', icon: <FaBold />, action: () => editor.chain().focus().toggleBold().run() },
    { name: 'italic', icon: <FaItalic />, action: () => editor.chain().focus().toggleItalic().run() },
    { name: 'underline', icon: <FaUnderline />, action: () => editor.chain().focus().toggleUnderline().run() },
    { name: 'strike', icon: <FaStrikethrough />, action: () => editor.chain().focus().toggleStrike().run() },
    { name: 'highlight', icon: <FaHighlighter />, action: () => editor.chain().focus().toggleHighlight().run() },
    { name: 'superscript', icon: <BsTypeSuperscript />, action: () => editor.chain().focus().toggleSuperscript().run() },
    { name: 'subscript', icon: <BsTypeSubscript />, action: () => editor.chain().focus().toggleSubscript().run() },
    { type: 'divider' },
    { name: 'heading', level: 1, icon: <LuHeading1 />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { name: 'heading', level: 2, icon: <LuHeading2 />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { name: 'heading', level: 3, icon: <LuHeading3 />, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { name: 'paragraph', icon: <FaParagraph />, action: () => editor.chain().focus().setParagraph().run() },
    { type: 'divider' },
    { name: 'bulletList', icon: <FaListUl />, action: () => editor.chain().focus().toggleBulletList().run() },
    { name: 'orderedList', icon: <FaListOl />, action: () => editor.chain().focus().toggleOrderedList().run() },
    { name: 'blockquote', icon: <BsBlockquoteLeft />, action: () => editor.chain().focus().toggleBlockquote().run() },
    { name: 'codeBlock', icon: <BsCodeSlash />, action: () => editor.chain().focus().toggleCodeBlock().run() },
    { type: 'divider' },
    { name: 'undo', icon: <FaUndo />, action: () => editor.chain().focus().undo().run() },
    { name: 'redo', icon: <FaRedo />, action: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap items-center gap-1 sticky top-0 z-10">
      {buttons.map((btn, index) =>
        btn.type === 'divider' ? (
          <div key={index} className="w-px h-6 bg-gray-300 mx-2" />
        ) : (
          <ToolbarButton
            key={index}
            onClick={btn.action}
            isActive={
              'level' in btn
                ? editor.isActive(btn.name, { level: btn.level })
                : editor.isActive(btn.name)
            }
            title={btn.name}
          >
            {btn.icon}
          </ToolbarButton>
        )
      )}
    </div>
  );
};


const TiptapEditor = forwardRef<EditorRef, TiptapEditorProps>(
  (
    {
      content,
      onChange,
      onSelectionChange,
      onAddComment,
      placeholder = 'Escreva algo...',
      className = '',
      editorClassName = '',
      showToolbar = true,
      editable = true,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const editor = useEditor({
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder }),
        Underline,
        Link.configure({ openOnClick: true, autolink: true }),
        Highlight.configure({ multicolor: true }),
        Superscript,
        Subscript,
      ],
      content,
      editable,
      onUpdate: ({ editor }) => onChange(editor.getHTML()),
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      onSelectionUpdate({ editor }) {
        const { from, to } = editor.state.selection;
        if (from !== to && onSelectionChange) {
          onSelectionChange({ from, to });
        }
      },
    });

    useImperativeHandle(ref, () => ({
      getContent: () => editor?.getHTML() || '',
      getHTML: () => editor?.getHTML() || '',
      getJSON: () => editor?.getJSON() || {},
      clearContent: () => editor?.commands.clearContent(),
      focus: () => editor?.commands.focus(),
      isFocused: () => editor?.isFocused || false,
    }));
    
    if (!editor) return null;

    return (
      <div
        className={`tiptap-editor-wrapper transition-all duration-200 ${className} ${
          isFocused ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'
        }`}
      >
        {showToolbar && <Toolbar editor={editor} />}
        <EditorContent editor={editor} className={editorClassName} />
        <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="bg-gray-800 text-white p-2 rounded-lg shadow-lg flex gap-2"
        >
             <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><FaBold /></ToolbarButton>
             <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><FaItalic /></ToolbarButton>
             <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><FaUnderline /></ToolbarButton>
             {onAddComment && (
                <button
                    onClick={() => {
                        const { from, to } = editor.state.selection;
                        if(from !== to) onAddComment({ from, to });
                    }}
                    className="p-2 text-white hover:bg-gray-700 rounded"
                    title="Adicionar comentário"
                >
                    💬
                </button>
             )}
        </BubbleMenu>
        <FloatingMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            shouldShow={({ state }) => {
                const { $from } = state.selection;
                const node = $from.node($from.depth);
                return node.isTextblock && node.content.size === 0;
            }}
            className="bg-white border border-gray-200 p-2 rounded-lg shadow-lg flex flex-col gap-1"
        >
            <button className="flex items-center gap-2 p-1 text-gray-700 hover:bg-gray-100 rounded" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
               <LuHeading1/> Título 1
            </button>
            <button className="flex items-center gap-2 p-1 text-gray-700 hover:bg-gray-100 rounded" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
               <LuHeading2/> Título 2
            </button>
            <button className="flex items-center gap-2 p-1 text-gray-700 hover:bg-gray-100 rounded" onClick={() => editor.chain().focus().toggleBulletList().run()}>
               <FaListUl/> Lista com marcadores
            </button>
             <button className="flex items-center gap-2 p-1 text-gray-700 hover:bg-gray-100 rounded" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
               <BsCodeSlash/> Bloco de Código
            </button>
        </FloatingMenu>
      </div>
    );
  }
);

export default TiptapEditor;