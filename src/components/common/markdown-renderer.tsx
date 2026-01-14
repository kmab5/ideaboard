'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Component to render text with {{component}} references highlighted
function TextWithComponents({ children }: { children: React.ReactNode }) {
  if (typeof children !== 'string') {
    return <>{children}</>;
  }

  // Split text by {{...}} pattern and render component references
  const parts = children.split(/(\{\{[^}]+\}\})/g);

  if (parts.length === 1) {
    return <>{children}</>;
  }

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\{\{([^}]+)\}\}$/);
        if (match) {
          return (
            <span
              key={index}
              className="inline-flex items-center rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-700 dark:bg-blue-400/20 dark:text-blue-300"
              title={`Reference: ${match[1]}`}
            >
              {match[1]}
            </span>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose-sm max-w-none text-inherit', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Handle inline code
          code: ({ children, className: codeClassName }) => {
            return (
              <code className={cn('rounded bg-muted px-1 py-0.5 font-mono text-xs', codeClassName)}>
                {children}
              </code>
            );
          },
          // Handle text nodes to detect {{component}} references
          p: ({ children }) => (
            <p className="my-1 text-inherit">
              {React.Children.map(children, (child) => {
                if (typeof child === 'string') {
                  return <TextWithComponents>{child}</TextWithComponents>;
                }
                return child;
              })}
            </p>
          ),
          // Customize heading sizes for notes
          h1: ({ children }) => <h1 className="mb-2 text-lg font-bold text-inherit">{children}</h1>,
          h2: ({ children }) => (
            <h2 className="mb-1.5 text-base font-bold text-inherit">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 text-sm font-semibold text-inherit">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1 text-sm font-medium text-inherit">{children}</h4>
          ),
          // Lists - using explicit margin and padding
          ul: ({ children, className: listClassName }) => {
            // Check if it's a task list (contains checkboxes)
            const isTaskList = listClassName?.includes('contains-task-list');
            return (
              <ul
                className={cn(
                  'my-1 ml-4 space-y-0.5 text-inherit',
                  isTaskList ? '!ml-0 list-none' : 'list-disc'
                )}
              >
                {children}
              </ul>
            );
          },
          ol: ({ children }) => (
            <ol className="my-1 ml-4 list-decimal space-y-0.5 text-inherit">{children}</ol>
          ),
          li: ({ children, className: liClassName }) => {
            // Check if it's a task list item
            const isTaskItem = liClassName?.includes('task-list-item');
            return (
              <li
                className={cn(
                  'text-sm text-inherit',
                  isTaskItem && 'flex list-none items-start gap-1.5'
                )}
              >
                {React.Children.map(children, (child) => {
                  if (typeof child === 'string') {
                    return <TextWithComponents>{child}</TextWithComponents>;
                  }
                  return child;
                })}
              </li>
            );
          },
          // Strong/Bold
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          // Emphasis/Italic
          em: ({ children }) => <em className="italic">{children}</em>,
          // Strikethrough
          del: ({ children }) => <del className="line-through">{children}</del>,
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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
          thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
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
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-default rounded border-gray-300 text-primary accent-primary"
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
          // Line breaks
          br: () => <br />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
