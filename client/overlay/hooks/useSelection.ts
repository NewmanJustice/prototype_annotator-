import { useState, useCallback, useEffect } from 'preact/hooks';

export type SelectionMode = 'none' | 'element' | 'rect';

interface ElementSelection {
  type: 'element';
  selector: string;
  xpath: string;
  textContent: string;
  rect: DOMRect;
}

interface RectSelection {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
}

export type Selection = ElementSelection | RectSelection | null;

interface UseSelectionResult {
  mode: SelectionMode;
  setMode: (mode: SelectionMode) => void;
  selection: Selection;
  clearSelection: () => void;
  hoveredElement: HTMLElement | null;
  hoveredRect: DOMRect | null;
  rectDrag: { startX: number; startY: number; endX: number; endY: number } | null;
}

function getSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .split(' ')
        .filter((c) => c.trim() && !c.startsWith('pa-'))
        .slice(0, 2);
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }

    const siblings = current.parentElement?.children;
    if (siblings && siblings.length > 1) {
      const index = Array.from(siblings).indexOf(current);
      if (index > 0) {
        selector += `:nth-child(${index + 1})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

function getXPath(element: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling: Node | null = current.previousSibling;

    while (sibling) {
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        (sibling as HTMLElement).tagName === current.tagName
      ) {
        index++;
      }
      sibling = sibling.previousSibling;
    }

    const tagName = current.tagName.toLowerCase();
    const part = index > 0 ? `${tagName}[${index + 1}]` : tagName;
    parts.unshift(part);

    current = current.parentElement;
  }

  return '/' + parts.join('/');
}

// Check if event originated from within our overlay (handles Shadow DOM)
function isOverlayEvent(e: Event): boolean {
  // Use composedPath to check through shadow DOM boundaries
  const path = e.composedPath();
  return path.some((el) => {
    if (el instanceof HTMLElement) {
      return el.id === 'prototype-annotator-root' || el.id === 'prototype-annotator-container';
    }
    return false;
  });
}

export function useSelection(): UseSelectionResult {
  const [mode, setMode] = useState<SelectionMode>('none');
  const [selection, setSelection] = useState<Selection>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const [rectDrag, setRectDrag] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setHoveredElement(null);
    setHoveredRect(null);
    setRectDrag(null);
  }, []);

  // Element selection mode handlers
  useEffect(() => {
    if (mode !== 'element') {
      setHoveredElement(null);
      setHoveredRect(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Ignore our own elements (use composedPath for Shadow DOM)
      if (isOverlayEvent(e)) {
        setHoveredElement(null);
        setHoveredRect(null);
        return;
      }

      const target = e.target as HTMLElement;
      setHoveredElement(target);
      setHoveredRect(target.getBoundingClientRect());
    };

    const handleClick = (e: MouseEvent) => {
      // Ignore our own elements (use composedPath for Shadow DOM)
      if (isOverlayEvent(e)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;

      const rect = target.getBoundingClientRect();

      setSelection({
        type: 'element',
        selector: getSelector(target),
        xpath: getXPath(target),
        textContent: target.textContent?.slice(0, 100) || '',
        rect,
      });

      setMode('none');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
    };
  }, [mode]);

  // Rectangle selection mode handlers
  useEffect(() => {
    if (mode !== 'rect') {
      setRectDrag(null);
      return;
    }

    const handleMouseDown = (e: MouseEvent) => {
      // Ignore our own elements (use composedPath for Shadow DOM)
      if (isOverlayEvent(e)) {
        return;
      }

      e.preventDefault();
      setRectDrag({
        startX: e.clientX,
        startY: e.clientY,
        endX: e.clientX,
        endY: e.clientY,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      setRectDrag((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          endX: e.clientX,
          endY: e.clientY,
        };
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      setRectDrag((prev) => {
        if (!prev) return null;

        const x = Math.min(prev.startX, e.clientX);
        const y = Math.min(prev.startY, e.clientY);
        const width = Math.abs(e.clientX - prev.startX);
        const height = Math.abs(e.clientY - prev.startY);

        // Only create selection if area is meaningful
        if (width > 10 && height > 10) {
          setSelection({
            type: 'rect',
            x,
            y,
            width,
            height,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          });
        }

        setMode('none');
        return null;
      });
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode]);

  // Keyboard shortcut to cancel selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode !== 'none') {
        setMode('none');
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode, clearSelection]);

  return {
    mode,
    setMode,
    selection,
    clearSelection,
    hoveredElement,
    hoveredRect,
    rectDrag,
  };
}
