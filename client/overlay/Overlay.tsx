import { FunctionComponent } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { SelectionTools } from './components/SelectionTools';
import { AnnotationMarker } from './components/AnnotationMarker';
import { useAnnotations, Annotation } from './hooks/useAnnotations';
import { useSelection, SelectionMode } from './hooks/useSelection';

interface OverlayProps {
  config: {
    basePath: string;
    apiUrl: string;
    defaultActor: string;
  };
}

export const Overlay: FunctionComponent<OverlayProps> = ({ config }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);

  const { annotations, loading, create, update, remove } = useAnnotations(
    config.apiUrl,
    config.defaultActor
  );

  const {
    mode,
    setMode,
    selection,
    clearSelection,
    hoveredRect,
    rectDrag,
  } = useSelection();

  // Open sidebar when selection is made
  useEffect(() => {
    if (selection) {
      setSidebarOpen(true);
    }
  }, [selection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input (use composedPath for Shadow DOM)
      const path = e.composedPath();
      const isTypingInInput = path.some(
        (el) => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      );
      if (isTypingInInput) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'e':
          setMode(mode === 'element' ? 'none' : 'element');
          break;
        case 'r':
          setMode(mode === 'rect' ? 'none' : 'rect');
          break;
        case 's':
          setSidebarOpen((prev) => !prev);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode, setMode]);

  const handleSetMode = useCallback(
    (newMode: SelectionMode) => {
      setMode(newMode);
      clearSelection();
      setSelectedAnnotation(null);
    },
    [setMode, clearSelection]
  );

  const handleCreateAnnotation = useCallback(
    async (data: { title: string; body: string }) => {
      if (!selection) return;

      const input = {
        url_full: window.location.href,
        title: data.title,
        body: data.body,
        anchor_type: selection.type as 'element' | 'rect',
        anchor_payload:
          selection.type === 'element'
            ? {
                selector: selection.selector,
                xpath: selection.xpath,
                textContent: selection.textContent,
              }
            : {
                x: selection.x,
                y: selection.y,
                width: selection.width,
                height: selection.height,
                scrollX: selection.scrollX,
                scrollY: selection.scrollY,
                viewportWidth: selection.viewportWidth,
                viewportHeight: selection.viewportHeight,
              },
      };

      await create(input);
      clearSelection();
    },
    [selection, create, clearSelection]
  );

  const handleUpdateAnnotation = useCallback(
    async (id: string, data: { title: string; body: string }) => {
      await update(id, data);
    },
    [update]
  );

  const handleDeleteAnnotation = useCallback(
    async (id: string) => {
      await remove(id);
    },
    [remove]
  );

  const handleCancelSelection = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleSelectAnnotation = useCallback((annotation: Annotation | null) => {
    setSelectedAnnotation(annotation);
    if (annotation) {
      setSidebarOpen(true);
    }
  }, []);

  return (
    <>
      <SelectionTools mode={mode} hoveredRect={hoveredRect} rectDrag={rectDrag} />

      {annotations.map((annotation, index) => (
        <AnnotationMarker
          key={annotation.id}
          annotation={annotation}
          index={index}
          isActive={selectedAnnotation?.id === annotation.id}
          onClick={() => handleSelectAnnotation(annotation)}
        />
      ))}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        annotations={annotations}
        loading={loading}
        selection={selection}
        selectedAnnotation={selectedAnnotation}
        onSelectAnnotation={handleSelectAnnotation}
        onCreateAnnotation={handleCreateAnnotation}
        onUpdateAnnotation={handleUpdateAnnotation}
        onDeleteAnnotation={handleDeleteAnnotation}
        onCancelSelection={handleCancelSelection}
        basePath={config.basePath}
      />

      <Toolbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        selectionMode={mode}
        onSetSelectionMode={handleSetMode}
      />
    </>
  );
};
