'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Transform {{variableName}} to a styled component reference marker
  const processedContent = content.replace(/\{\{([^}]+)\}\}/g, '`$comp:$1$`');

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Handle component references rendered as inline code
          code: ({ children, className: codeClassName }) => {
            const text = String(children);
            if (text.startsWith('$comp:') && text.endsWith('$')) {
              const varName = text.slice(6, -1);
              return (
                <span
                  className="inline-flex items-center rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-700 dark:bg-blue-400/20 dark:text-blue-300"
                  title={`Reference: ${varName}`}
                >
                  {varName}
                </span>
              );
            }
            return (
              <code className={cn('rounded bg-muted px-1 py-0.5 font-mono text-xs', codeClassName)}>
                {children}
              </code>
            );
          },
          // Customize heading sizes for notes
          h1: ({ children }) => <h1 className="mb-2 text-lg font-bold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-1.5 text-base font-bold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
          // Lists
          ul: ({ children }) => (
            <ul className="my-1 list-inside list-disc space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1 list-inside list-decimal space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => <li className="text-sm">{children}</li>,
          // Paragraphs
          p: ({ children }) => <p className="my-1">{children}</p>,
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 hover:underline dark:text-blue-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="my-1 border-l-2 border-muted-foreground/30 pl-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // Tables
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted px-2 py-1 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
          // Task list checkboxes
          input: ({ type, checked }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  aria-label="Task checkbox"
                  className="mr-1.5 h-3.5 w-3.5 rounded border-gray-300"
                />
              );
            }
            return null;
          },
          // Horizontal rules
          hr: () => <hr className="my-2 border-border" />,
          // Pre blocks for code
          pre: ({ children }) => (
            <pre className="my-1 overflow-x-auto rounded bg-muted p-2 text-xs">{children}</pre>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
