import { type CSSProperties, isValidElement, memo, type ReactElement, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SyntaxCodeBlock } from '../syntax-code-block/syntax-code-block.js';
import './markdown.css';

export interface MarkdownProps {
  readonly content: string;
  readonly className?: string;
}

const REMARK_PLUGINS = [remarkGfm];

function extractFencedCode(children: ReactNode): { code: string; language?: string } {
  const child = Array.isArray(children) ? children.find((node) => isValidElement(node)) : children;
  if (isValidElement<{ className?: string; children?: ReactNode }>(child)) {
    const language = /language-([\w+-]+)/.exec(child.props.className ?? '')?.[1];
    return { code: String(child.props.children ?? '').replace(/\n$/, ''), language };
  }
  return { code: String(children ?? '') };
}

const MARKDOWN_COMPONENTS: Components = {
  ol: ({ children, start }) => {
    const startAt = typeof start === 'number' && Number.isFinite(start) ? start : 1;
    return (
      <ol
        start={startAt === 1 ? undefined : startAt}
        style={{ '--ui-markdown-ordered-start': startAt - 1 } as CSSProperties}
      >
        {children}
      </ol>
    );
  },
  pre: ({ children }) => {
    const { code, language } = extractFencedCode(children);
    return <SyntaxCodeBlock language={language} value={code} />;
  },
  // Fenced blocks are captured by `pre` above, so this only sees inline code.
  code: ({ children }) => <code className="ui-markdown__inline-code">{children}</code>,
  table: ({ children }) => (
    <div className="ui-markdown__table-wrap">
      <table>{children}</table>
    </div>
  ),
};

/**
 * Read-only GitHub Flavored Markdown renderer: headings, paragraphs, lists,
 * links, tables, inline code, and fenced code with a language chip, a copy
 * control, and dual-theme syntax highlighting. Raw HTML in the source is never
 * rendered.
 */
export const Markdown = memo(function Markdown({
  content,
  className,
}: MarkdownProps): ReactElement {
  return (
    <div className={['ui-markdown', className].filter(Boolean).join(' ')}>
      <ReactMarkdown components={MARKDOWN_COMPONENTS} remarkPlugins={REMARK_PLUGINS}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
