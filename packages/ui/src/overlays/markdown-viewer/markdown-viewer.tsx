import {
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Markdown } from '../../data-display/markdown/markdown.js';
import { Icon, IconButton, Input } from '../../primitives/index.js';
import { FloatingWindow, type FloatingWindowWidth } from '../floating-window/floating-window.js';
import './markdown-viewer.css';

/** Window width scale: sm 380, md 460, lg 600. */
export type MarkdownViewerWidth = FloatingWindowWidth;

export interface MarkdownViewerProps {
  readonly title: ReactNode;
  readonly content: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly width?: MarkdownViewerWidth;
  readonly className?: string;
}

const SEARCH_HIGHLIGHT = 'ui-markdown-viewer-search';
const SEARCH_HIGHLIGHT_ACTIVE = 'ui-markdown-viewer-search-active';

/**
 * Collects every case-insensitive match of `query` as a DOM Range, matching
 * across element boundaries (bold or linked text mid-match still counts) by
 * indexing the concatenated text content of the subtree.
 */
function collectMatches(root: HTMLElement, query: string): Range[] {
  const nodes: Text[] = [];
  const starts: number[] = [];
  let text = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    starts.push(text.length);
    nodes.push(node);
    text += node.data;
  }

  const locate = (offset: number): { node: Text; offset: number } => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if ((starts[mid] as number) <= offset) low = mid;
      else high = mid - 1;
    }
    return { node: nodes[low] as Text, offset: offset - (starts[low] as number) };
  };

  const needle = query.toLowerCase();
  const haystack = text.toLowerCase();
  const ranges: Range[] = [];
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    const start = locate(index);
    const end = locate(index + needle.length - 1);
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset + 1);
    ranges.push(range);
    index = haystack.indexOf(needle, index + needle.length);
  }
  return ranges;
}

// CSS Custom Highlight API paints matches without mutating the DOM React owns;
// browsers without it still get the match counter, cycling, and scrolling.
function applyHighlights(ranges: readonly Range[], activeIndex: number): void {
  const registry = globalThis.CSS?.highlights;
  if (!registry || typeof Highlight === 'undefined') return;
  if (ranges.length === 0) {
    registry.delete(SEARCH_HIGHLIGHT);
    registry.delete(SEARCH_HIGHLIGHT_ACTIVE);
    return;
  }
  registry.set(SEARCH_HIGHLIGHT, new Highlight(...ranges));
  const active = ranges[activeIndex];
  if (active) registry.set(SEARCH_HIGHLIGHT_ACTIVE, new Highlight(active));
  else registry.delete(SEARCH_HIGHLIGHT_ACTIVE);
}

function clearHighlights(): void {
  const registry = globalThis.CSS?.highlights;
  registry?.delete(SEARCH_HIGHLIGHT);
  registry?.delete(SEARCH_HIGHLIGHT_ACTIVE);
}

/**
 * Floating non-modal reading window for Markdown content. It opens above the
 * page on the window layer without a scrim, so the page behind stays fully
 * interactive; Escape closes it, pointer interaction outside does not. The
 * header carries a find-in-document search (Enter / Shift+Enter cycle through
 * matches) and the shared floating-window expand control. Reflows to a bottom
 * sheet below the mobile breakpoint.
 */
export function MarkdownViewer({
  title,
  content,
  open,
  onOpenChange,
  width = 'md',
  className,
}: MarkdownViewerProps): ReactElement {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchVersion, setSearchVersion] = useState(0);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const rangesRef = useRef<Range[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Each open starts with search closed.
  useEffect(() => {
    if (!open) {
      setSearchOpen(false);
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => () => clearHighlights(), []);

  useEffect(() => {
    const body = bodyRef.current;
    if (!open || !searchOpen || !body || query.trim() === '') {
      rangesRef.current = [];
      setMatches(0);
      clearHighlights();
      return;
    }

    const recompute = (): void => {
      let ranges: Range[] = [];
      try {
        ranges = collectMatches(body, query);
      } catch {
        ranges = [];
      }
      rangesRef.current = ranges;
      setMatches(ranges.length);
      setActiveIndex((current) => Math.min(current, Math.max(0, ranges.length - 1)));
      setSearchVersion((version) => version + 1);
    };

    recompute();
    // Shiki swaps fallback code for highlighted spans after load — recompute so
    // ranges never point into detached nodes.
    const observer = new MutationObserver(recompute);
    observer.observe(body, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [open, searchOpen, query]);

  // searchVersion re-applies highlights after every range recompute — ranges
  // live in a ref, so a recompute with an unchanged match count must still
  // repaint (the old Range objects point into detached nodes).
  useEffect(() => {
    if (!searchOpen || query.trim() === '') return;
    applyHighlights(rangesRef.current, activeIndex);
    const active = rangesRef.current[activeIndex];
    if (active) {
      const container = active.startContainer;
      const element = container instanceof Element ? container : container.parentElement;
      element?.scrollIntoView?.({ block: 'center' });
    }
  }, [searchOpen, query, activeIndex, searchVersion]);

  const cycleMatch = useCallback((direction: 1 | -1) => {
    const total = rangesRef.current.length;
    if (total === 0) return;
    setActiveIndex((current) => (current + direction + total) % total);
  }, []);

  const toggleSearch = (): void => {
    if (searchOpen) {
      setSearchOpen(false);
      setQuery('');
    } else {
      setSearchOpen(true);
    }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      cycleMatch(event.shiftKey ? -1 : 1);
      return;
    }
    if (event.key === 'Escape') {
      // Escape owns the search first: clear the query, then close the bar.
      event.preventDefault();
      event.stopPropagation();
      if (query !== '') setQuery('');
      else setSearchOpen(false);
    }
  };

  return (
    <FloatingWindow
      actions={
        <IconButton
          aria-label="Search content"
          aria-pressed={searchOpen}
          onClick={toggleSearch}
          variant="ghost"
        >
          <Icon name="search" size={16} />
        </IconButton>
      }
      className={['ui-markdown-viewer', className].filter(Boolean).join(' ')}
      onEscapeKeyDown={(event) => {
        if (searchOpen && document.activeElement === searchInputRef.current) {
          event.preventDefault();
        }
      }}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
      titleClassName="ui-markdown-viewer__title"
      width={width}
    >
      {searchOpen ? (
        <div className="ui-markdown-viewer__search">
          <Input
            aria-label="Search in document"
            className="ui-markdown-viewer__search-input"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Find in document…"
            ref={searchInputRef}
            value={query}
          />
          {query !== '' ? (
            <span aria-live="polite" className="ui-markdown-viewer__search-count">
              {matches === 0 ? '0/0' : `${activeIndex + 1}/${matches}`}
            </span>
          ) : null}
          <IconButton
            aria-label="Previous match"
            disabled={matches === 0}
            onClick={() => cycleMatch(-1)}
            variant="ghost"
          >
            <Icon name="chevron-up" size={16} />
          </IconButton>
          <IconButton
            aria-label="Next match"
            disabled={matches === 0}
            onClick={() => cycleMatch(1)}
            variant="ghost"
          >
            <Icon name="chevron-down" size={16} />
          </IconButton>
        </div>
      ) : null}
      <div className="ui-floating-window__body ui-markdown-viewer__body" ref={bodyRef}>
        <Markdown content={content} />
      </div>
    </FloatingWindow>
  );
}
