'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import {
  splitTextByLinks,
  resolveLink,
  linkLabel,
  type LinkableBoard,
  type LinkableContainer,
  type ResolvedLink,
} from '@/lib/links';

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
  /** Render references as their current value instead of the component name. */
  showValues?: boolean;
  /** Boards in the story, for resolving `#board` links. */
  boards?: LinkableBoard[];
  /** Containers in the story, for resolving `#board/container` links. */
  containers?: LinkableContainer[];
  /** Called when a valid board/container link is clicked. */
  onLinkClick?: (link: ResolvedLink) => void;
}

type ResolveReference = (name: string) => ReferenceComponent | undefined;

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * What a reference shows in "show values" mode. A list resolves to its
 * selected choice when it has one, since that's the value a reader would
 * actually encounter; otherwise it falls back to the raw value.
 */
function displayValue(component: ReferenceComponent): string {
  const selected = (component as { selected_value?: unknown }).selected_value;
  if (selected !== undefined && selected !== null) return formatValue(selected);
  return formatValue(component.current_value);
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
  showValues,
}: {
  children: React.ReactNode;
  resolve: ResolveReference;
  onReferenceClick?: (name: string) => void;
  showValues?: boolean;
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
            title={showValues ? `${name} (${referenceTitle(component)})` : referenceTitle(component)}
          >
            {showValues ? displayValue(component) : name}
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
  boards,
  containers,
  onLinkClick,
  showValues,
}: MarkdownRendererProps) {
  // Case-insensitive lookup, mirroring the component store's name matching.
  const resolve = useMemo<ResolveReference>(() => {
    const map = new Map((components ?? []).map((c) => [c.name.toLowerCase(), c]));
    return (name: string) => map.get(name.toLowerCase());
  }, [components]);

  // Text runs pass through link splitting first, then component-reference
  // splitting, so a single string can contain both kinds of token.
  const renderTextRun = (value: string, keyPrefix: string) => {
    const segments = splitTextByLinks(value);
    if (segments.length === 1 && segments[0].type === 'text') {
      return (
        <TextWithComponents
          resolve={resolve}
          onReferenceClick={onReferenceClick}
          showValues={showValues}
        >
          {value}
        </TextWithComponents>
      );
    }

    return segments.map((segment, index) => {
      if (segment.type === 'text') {
        return (
          <TextWithComponents
            key={`${keyPrefix}-t${index}`}
            resolve={resolve}
            onReferenceClick={onReferenceClick}
            showValues={showValues}
          >
            {segment.value}
          </TextWithComponents>
        );
      }

      const resolved = resolveLink(segment.target, boards ?? [], containers ?? []);
      const label = linkLabel(segment.target);

      if (!resolved.valid) {
        return (
          <span
            key={`${keyPrefix}-l${index}`}
            className="inline-flex items-center gap-0.5 rounded border border-amber-400 bg-amber-500/15 px-1.5 py-0.5 font-mono text-xs font-semibold text-amber-700 dark:text-amber-300"
            title={
              resolved.boardId
                ? `No container "${segment.target.containerName}" on board "${segment.target.boardName}"`
                : `No board named "${segment.target.boardName}"`
            }
          >
            <span aria-hidden>⚠</span>
            {label}
          </span>
        );
      }

      const clickable = Boolean(onLinkClick);
      return (
        <span
          key={`${keyPrefix}-l${index}`}
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          onClick={
            clickable
              ? (e) => {
                  e.stopPropagation();
                  onLinkClick?.(resolved);
                }
              : undefined
          }
          onKeyDown={
            clickable
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onLinkClick?.(resolved);
                  }
                }
              : undefined
          }
          className={cn(
            'inline-flex items-center rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-xs font-semibold text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300',
            clickable && 'cursor-pointer hover:bg-emerald-500/30'
          )}
          title={segment.target.containerName ? 'Go to container' : 'Go to board'}
        >
          {label}
        </span>
      );
    });
  };

  const renderText = (children: React.ReactNode) =>
    React.Children.map(children, (child, index) =>
      typeof child === 'string' ? renderTextRun(child, `r${index}`) : child
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
