import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  type FormEvent,
  type ReactNode,
} from 'react';
import styles from './Comments.module.css';

export type RichCommentInputHandle = {
  getHtml: () => string;
  insertText: (text: string) => void;
  insertCustomEmoji: (src: string, alt?: string) => void;
  insertQuote: (authorId: string, author: string, text: string) => void;
  clear: () => void;
  focus: () => void;
};

type Props = {
  placeholder: string;
  disabled?: boolean;
  onChange?: (html: string) => void;
};

const RichCommentInput = forwardRef<RichCommentInputHandle, Props>(
  ({placeholder, disabled, onChange}, ref): ReactNode => {
    const editorRef = useRef<HTMLDivElement | null>(null);

    const emitChange = () => {
      onChange?.(editorRef.current?.innerHTML ?? '');
    };

    const ensureSelectionInside = () => {
      const editor = editorRef.current;
      if (!editor) return null;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        return range;
      }
      const range = selection.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) {
        const newRange = document.createRange();
        newRange.selectNodeContents(editor);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
        return newRange;
      }
      return range;
    };

    const insertNode = (node: Node) => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection) {
        return;
      }
      const range = ensureSelectionInside();
      if (!range) return;
      range.deleteContents();
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      emitChange();
    };

    useImperativeHandle(
      ref,
      () => ({
        getHtml: () => editorRef.current?.innerHTML ?? '',
        insertText: (text: string) => {
          const textNode = document.createTextNode(text);
          insertNode(textNode);
        },
        insertQuote: (authorId: string, author: string, text: string) => {
          const block = document.createElement('blockquote');
          block.className = styles.quote;
          block.setAttribute('data-author-id', authorId);
          const authorEl = document.createElement('strong');
          authorEl.textContent = author;
          const bodyEl = document.createElement('p');
          bodyEl.textContent = text;
          block.appendChild(authorEl);
          block.appendChild(bodyEl);
          insertNode(block);
          const trailingSpace = document.createElement('br');
          insertNode(trailingSpace);
        },
        insertCustomEmoji: (src: string, alt?: string) => {
          const img = document.createElement('img');
          img.src = src;
          img.alt = alt || 'emoji';
          img.width = 24;
          img.height = 24;
          img.className = 'custom-emoji';
          insertNode(img);
        },
        clear: () => {
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
            emitChange();
          }
        },
        focus: () => {
          editorRef.current?.focus();
        },
      }),
      [],
    );

    const handleInput = () => emitChange();

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
      if (text) {
        const selection = window.getSelection();
        if (selection) {
          const range = ensureSelectionInside();
          if (range) {
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        emitChange();
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        event.preventDefault();
      }
    };

    return (
      <div
        ref={editorRef}
        className={styles.richInput}
        contentEditable={!disabled}
        data-placeholder={placeholder}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
        aria-label="Comment editor"
        role="textbox"
      />
    );
  },
);

RichCommentInput.displayName = 'RichCommentInput';

export default RichCommentInput;
