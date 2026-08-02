'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';

/** Minimal component shape the renderer needs to resolve `{{references}}`. */
export interface ReferenceComponent {
  name: string;
  type?: string;
  current_value?: unknown;
  description?: string | null;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** Components available for `{{reference}}` resolution. */
  components?: ReferenceComponent[];
  /** Called when a valid reference chip is clicked. */
  onReferenceClick?: (name: string) => void;
}

type ResolveReference = (name: string) => ReferenceComponent | undefined;

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function referenceTitle(component: ReferenceComponent): string {
  const parts = [`${component.type ?? 'component'} = ${formatValue(component.current_value)}`];
  if (component.description) parts.push(component.description);
  return parts.join(' — ');
}

// Render a text run, converting `{{name}}` tokens into reference chips.
function TextWithComponents({
  children,
  resolve,
  onReferenceClick,
}: {
  children: React.ReactNode;
  resolve: ResolveReference;
  onReferenceClick?: (name: string) => void;
}) {
  if (typeof children !== 'string') {
    return <>{children}</>;
  }

  const parts = children.split(/(\{\{[^}]+\}\})/g);
  if (parts.length === 1) {
    return <>{children}</>;
  }

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\{\{([^}]+)\}\}$/);
        if (!match) {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }

        const name = match[1].trim();
        const component = resolve(name);

        // Unknown component -> visible warning (PRD 4.6.4, invalid reference, P0).
        if (!component) {
          return (
            <span
              key={index}
              className="inline-flex items-center gap-0.5 rounded border border-amber-400 bg-amber-500/15 px-1.5 py-0.5 font-mono text-xs font-semibold text-amber-700 dark:text-amber-300"
              title={`Unknown component: ${name}`}
            >
              <span aria-hidden>⚠</span>
              {name}
            </span>
          );
        }

        const clickable = Boolean(onReferenceClick);
        return (
          <span
            key={index}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={
              clickable
                ? (e) => {
                    e.stopPropagation();
                    onReferenceClick?.(name);
                  }
                : undefined
            }
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onReferenceClick?.(name);
                    }
                  }
                : undefined
            }
            className={cn(
              'inline-flex items-center rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-700 dark:bg-blue-400/20 dark:text-blue-300',
              clickable && 'cursor-pointer hover:bg-blue-500/30'
            )}
            title={referenceTitle(component)}
          >
            {name}
          </span>
        );
      })}
    </>
  );
}

export function MarkdownRenderer({
  content,
  className,
  components,
  onReferenceClick,
}: MarkdownRendererProps) {
  // Case-insensitive lookup, mirroring the component store's name matching.
  const resolve = useMemo<ResolveReference>(() => {
    const map = new Map((components ?? []).map((c) => [c.name.toLowerCase(), c]));
    return (name: string) => map.get(name.toLowerCase());
  }, [components]);

  const renderText = (children: React.ReactNode) =>
    React.Children.map(children, (child) =>
      typeof child === 'string' ? (
        <TextWithComponents resolve={resolve} onReferenceClick={onReferenceClick}>
          {child}
        </TextWithComponents>
      ) : (
        child
      )
    );

  return (
    <div className={cn('prose-sm max-w-none text-inherit', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ children, className: codeClassName }) => (
            <code className={cn('rounded bg-muted px-1 py-0.5 font-mono text-xs', codeClassName)}>
              {children}
            </code>
          ),
          p: ({ children }) => <p className="my-1 text-inherit">{renderText(children)}</p>,
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
          ul: ({ children, className: listClassName }) => {
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
            const isTaskItem = liClassName?.includes('task-list-item');
            return (
              <li
                className={cn(
                  'text-sm text-inherit',
                  isTaskItem && 'flex list-none items-start gap-1.5'
                )}
              >
                {renderText(children)}
              </li>
            );
          },
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="line-through">{children}</del>,
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
          blockquote: ({ children }) => (
            <blockquote className="my-1 border-l-2 border-muted-foreground/30 pl-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
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
          hr: () => <hr className="my-2 border-border" />,
          pre: ({ children }) => (
            <pre className="my-1 overflow-x-auto rounded bg-muted p-2 text-xs">{children}</pre>
          ),
          br: () => <br />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
