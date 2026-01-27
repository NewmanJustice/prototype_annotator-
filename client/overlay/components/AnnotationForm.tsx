import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Annotation } from '../hooks/useAnnotations';
import type { Selection } from '../hooks/useSelection';

interface AnnotationFormProps {
  selection: Selection;
  existingAnnotation?: Annotation | null;
  onSubmit: (data: { title: string; body: string }) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export const AnnotationForm: FunctionComponent<AnnotationFormProps> = ({
  selection,
  existingAnnotation,
  onSubmit,
  onCancel,
  onDelete,
}) => {
  const [title, setTitle] = useState(existingAnnotation?.title || '');
  const [body, setBody] = useState(existingAnnotation?.body || '');

  useEffect(() => {
    if (existingAnnotation) {
      setTitle(existingAnnotation.title);
      setBody(existingAnnotation.body);
    }
  }, [existingAnnotation]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), body: body.trim() });
  };

  return (
    <form class="pa-form" onSubmit={handleSubmit}>
      {selection && (
        <div class="pa-form-group">
          <label class="pa-form-label">Selection</label>
          <div style={{ fontSize: '12px', color: '#6b7280', padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
            {selection.type === 'element' ? (
              <>
                <div><strong>Type:</strong> Element</div>
                <div style={{ wordBreak: 'break-all' }}><strong>Selector:</strong> {selection.selector}</div>
              </>
            ) : (
              <>
                <div><strong>Type:</strong> Rectangle</div>
                <div><strong>Position:</strong> {Math.round(selection.x)}, {Math.round(selection.y)}</div>
                <div><strong>Size:</strong> {Math.round(selection.width)} x {Math.round(selection.height)}</div>
              </>
            )}
          </div>
        </div>
      )}

      <div class="pa-form-group">
        <label class="pa-form-label" for="pa-title">Title *</label>
        <input
          id="pa-title"
          type="text"
          class="pa-form-input"
          value={title}
          onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
          placeholder="Brief description"
          required
        />
      </div>

      <div class="pa-form-group">
        <label class="pa-form-label" for="pa-body">Details</label>
        <textarea
          id="pa-body"
          class="pa-form-input pa-form-textarea"
          value={body}
          onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
          placeholder="Additional context, suggestions, or feedback..."
        />
      </div>

      <div class="pa-form-actions">
        {existingAnnotation && onDelete && (
          <button type="button" class="pa-btn pa-btn-danger" onClick={onDelete}>
            Delete
          </button>
        )}
        <button type="button" class="pa-btn pa-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" class="pa-btn pa-btn-primary">
          {existingAnnotation ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
};
