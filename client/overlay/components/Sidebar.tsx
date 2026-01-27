import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import type { Annotation } from '../hooks/useAnnotations';
import type { Selection } from '../hooks/useSelection';
import { AnnotationForm } from './AnnotationForm';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  annotations: Annotation[];
  loading: boolean;
  selection: Selection;
  selectedAnnotation: Annotation | null;
  onSelectAnnotation: (annotation: Annotation | null) => void;
  onCreateAnnotation: (data: { title: string; body: string }) => void;
  onUpdateAnnotation: (id: string, data: { title: string; body: string }) => void;
  onDeleteAnnotation: (id: string) => void;
  onCancelSelection: () => void;
  basePath: string;
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const Sidebar: FunctionComponent<SidebarProps> = ({
  open,
  onClose,
  annotations,
  loading,
  selection,
  selectedAnnotation,
  onSelectAnnotation,
  onCreateAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onCancelSelection,
  basePath,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');

  // Switch to form tab when there's a selection
  const showForm = selection || selectedAnnotation;

  const handleCreateSubmit = (data: { title: string; body: string }) => {
    onCreateAnnotation(data);
    setActiveTab('list');
  };

  const handleUpdateSubmit = (data: { title: string; body: string }) => {
    if (selectedAnnotation) {
      onUpdateAnnotation(selectedAnnotation.id, data);
      onSelectAnnotation(null);
      setActiveTab('list');
    }
  };

  const handleDelete = () => {
    if (selectedAnnotation) {
      onDeleteAnnotation(selectedAnnotation.id);
      onSelectAnnotation(null);
      setActiveTab('list');
    }
  };

  const handleCancel = () => {
    onCancelSelection();
    onSelectAnnotation(null);
    setActiveTab('list');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div class={`pa-sidebar ${open ? 'open' : ''}`}>
      <div class="pa-sidebar-header">
        <h2 class="pa-sidebar-title">Annotations</h2>
        <button class="pa-close-btn" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      {!showForm && (
        <div class="pa-tabs">
          <button
            class={`pa-tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            List ({annotations.length})
          </button>
        </div>
      )}

      <div class="pa-sidebar-content">
        {showForm ? (
          <AnnotationForm
            selection={selection}
            existingAnnotation={selectedAnnotation}
            onSubmit={selectedAnnotation ? handleUpdateSubmit : handleCreateSubmit}
            onCancel={handleCancel}
            onDelete={selectedAnnotation ? handleDelete : undefined}
          />
        ) : (
          <>
            {loading ? (
              <div class="pa-empty-state">Loading...</div>
            ) : annotations.length === 0 ? (
              <div class="pa-empty-state">
                <p>No annotations yet</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  Use the toolbar to select an element or draw a rectangle
                </p>
              </div>
            ) : (
              <div class="pa-annotation-list">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    class="pa-annotation-item"
                    onClick={() => onSelectAnnotation(annotation)}
                  >
                    <div class="pa-annotation-item-title">{annotation.title}</div>
                    {annotation.body && (
                      <div class="pa-annotation-item-body">{annotation.body}</div>
                    )}
                    <div class="pa-annotation-item-meta">
                      {annotation.anchor_type} • {formatDate(annotation.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div class="pa-sidebar-footer">
        <a
          href={`${basePath}/dashboard`}
          target="_blank"
          rel="noopener noreferrer"
          class="pa-btn pa-btn-secondary"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          Open Dashboard
        </a>
      </div>
    </div>
  );
};
