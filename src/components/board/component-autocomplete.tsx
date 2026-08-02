'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface AutocompleteComponent {
  id: string;
  name: string;
  type: string;
}

interface ComponentAutocompleteTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  /** Called on Escape when the suggestion dropdown is not open. */
  onEscape?: () => void;
  components: AutocompleteComponent[];
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const MAX_SUGGESTIONS = 8;

// Match an in-progress "@query" immediately before the caret. The `@` must be
// at the start or preceded by a non-word character so we don't fire inside
// emails or existing words.
const MENTION_RE = /(?:^|[^\w@])@(\w*)$/;

export function ComponentAutocompleteTextarea({
  value,
  onChange,
  onBlur,
  onEscape,
  components,
  placeholder,
  className,
  autoFocus,
}: ComponentAutocompleteTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  const suggestions = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return components
      .filter((c) => c.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [components, query]);

  const isOpen = query !== null && suggestions.length > 0 && position !== null;

  const closeDropdown = useCallback(() => {
    setQuery(null);
    setPosition(null);
    setActiveIndex(0);
  }, []);

  const updatePosition = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({ left: rect.left, top: rect.bottom + 4 });
  }, []);

  const detectMention = useCallback(
    (text: string, caret: number) => {
      const match = text.slice(0, caret).match(MENTION_RE);
      if (match) {
        setQuery(match[1]);
        setMentionStart(caret - match[1].length - 1); // position of the '@'
        setActiveIndex(0);
        updatePosition();
      } else {
        closeDropdown();
      }
    },
    [updatePosition, closeDropdown]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      onChange(next);
      detectMention(next, e.target.selectionStart);
    },
    [onChange, detectMention]
  );

  const insertComponent = useCallback(
    (name: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const caret = el.selectionStart;
      const before = value.slice(0, mentionStart);
      const after = value.slice(caret);
      const token = `{{${name}}}`;
      const nextValue = before + token + after;

      onChange(nextValue);
      closeDropdown();

      const caretPos = (before + token).length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(caretPos, caretPos);
      });
    },
    [value, mentionStart, onChange, closeDropdown]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isOpen) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % suggestions.length);
            return;
          case 'ArrowUp':
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
            return;
          case 'Enter':
          case 'Tab':
            e.preventDefault();
            insertComponent(suggestions[activeIndex].name);
            return;
          case 'Escape':
            e.preventDefault();
            e.stopPropagation();
            closeDropdown();
            return;
        }
        return;
      }

      if (e.key === 'Escape') {
        onEscape?.();
      }
    },
    [isOpen, suggestions, activeIndex, insertComponent, closeDropdown, onEscape]
  );

  const handleBlur = useCallback(() => {
    closeDropdown();
    onBlur();
  }, [closeDropdown, onBlur]);

  // Keep the dropdown aligned if the user scrolls the canvas while it's open.
  useEffect(() => {
    if (!isOpen) return;
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={className}
        placeholder={placeholder}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- editing affordance opens focused
        autoFocus={autoFocus}
        onClick={(e) => e.stopPropagation()}
      />

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <ul
            className="fixed z-50 max-h-56 w-56 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            style={{ left: position.left, top: position.top }}
            role="listbox"
          >
            {suggestions.map((component, index) => (
              <li key={component.id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  // Prevent the textarea from blurring before the click registers.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertComponent(component.name)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm',
                    index === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  )}
                >
                  <span className="truncate font-medium">{component.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{component.type}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </>
  );
}
