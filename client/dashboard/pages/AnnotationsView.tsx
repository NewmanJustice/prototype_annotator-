import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface Annotation {
  id: string;
  url_full: string;
  url_canonical: string;
  title: string;
  body: string;
  anchor_type: 'element' | 'rect';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string;
  updated_by: string;
}

interface AnnotationsViewProps {
  apiUrl: string;
}

export const AnnotationsView: FunctionComponent<AnnotationsViewProps> = ({ apiUrl }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Prompt generation state
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [promptContent, setPromptContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [enhanceWithAI, setEnhanceWithAI] = useState(true);
  const [aiEnhanced, setAiEnhanced] = useState(false);

  useEffect(() => {
    async function fetchAnnotations() {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/annotations?includeDeleted=${showDeleted}`);
        const data = await response.json();

        if (data.success) {
          setAnnotations(data.data);
        } else {
          setError(data.error || 'Failed to fetch annotations');
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchAnnotations();
  }, [apiUrl, showDeleted]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this annotation?')) return;

    try {
      const response = await fetch(`${apiUrl}/annotations/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        alert(data.error || 'Failed to delete annotation');
      }
    } catch (err) {
      alert(String(err));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`${apiUrl}/annotations/${id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (data.success) {
        setAnnotations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, deleted_at: null } : a))
        );
      } else {
        alert(data.error || 'Failed to restore annotation');
      }
    } catch (err) {
      alert(String(err));
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const activeAnnotations = annotations.filter((a) => !a.deleted_at);
    if (selectedIds.size === activeAnnotations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeAnnotations.map((a) => a.id)));
    }
  };

  const handleGeneratePrompt = async () => {
    if (selectedIds.size === 0) return;

    setGenerating(true);
    setShowPromptEditor(true);
    setPromptContent('');
    setAiEnhanced(false);

    try {
      const response = await fetch(`${apiUrl}/prompts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotation_ids: Array.from(selectedIds),
          enhance_with_ai: enhanceWithAI,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setPromptContent(data.data.markdown);
        setAiEnhanced(data.data.enhanced);
      } else {
        alert(data.error || 'Failed to generate prompt');
        setShowPromptEditor(false);
      }
    } catch (err) {
      alert(String(err));
      setShowPromptEditor(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPrompt = async () => {
    setGenerating(true);

    try {
      // Use /prompts/confirm endpoint with edited markdown
      const response = await fetch(`${apiUrl}/prompts/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotation_ids: Array.from(selectedIds),
          markdown: promptContent, // Pass the (possibly edited) markdown
        }),
      });
      const data = await response.json();

      if (data.success) {
        alert(`Exported successfully!\n\nMarkdown: ${data.data.saved_path_md}\nJSON: ${data.data.saved_path_json}`);
        setShowPromptEditor(false);
        setSelectedIds(new Set());
      } else {
        alert(data.error || 'Failed to export prompt');
      }
    } catch (err) {
      alert(String(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(promptContent);
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Failed to copy: ' + String(err));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeAnnotations = annotations.filter((a) => !a.deleted_at);
  const allSelected = activeAnnotations.length > 0 && selectedIds.size === activeAnnotations.length;

  return (
    <div>
      <div class="page-header">
        <h1 class="page-title">Annotations</h1>
        <p class="page-subtitle">Manage all annotations across your prototype</p>
      </div>

      {/* Selection action bar */}
      {selectedIds.size > 0 && (
        <div class="card" style={{ marginBottom: '16px', background: '#eff6ff' }}>
          <div class="card-body" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500 }}>
              {selectedIds.size} annotation{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={enhanceWithAI}
                  onChange={(e) => setEnhanceWithAI((e.target as HTMLInputElement).checked)}
                />
                Enhance with AI
              </label>
              <button class="btn btn-primary" onClick={handleGeneratePrompt}>
                Generate Prompt
              </button>
              <button class="btn btn-secondary" onClick={() => setSelectedIds(new Set())}>
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      <div class="card">
        <div class="card-header">
          <span class="card-title">All Annotations ({annotations.length})</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted((e.target as HTMLInputElement).checked)}
            />
            Show deleted
          </label>
        </div>

        {loading ? (
          <div class="loading">Loading...</div>
        ) : error ? (
          <div class="empty-state">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        ) : annotations.length === 0 ? (
          <div class="empty-state">
            <h3>No annotations yet</h3>
            <p>Start annotating your prototype to see them here.</p>
          </div>
        ) : (
          <table class="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    title="Select all"
                  />
                </th>
                <th>Title</th>
                <th>Page</th>
                <th>Type</th>
                <th>Created</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {annotations.map((annotation) => (
                <tr
                  key={annotation.id}
                  style={{
                    opacity: annotation.deleted_at ? 0.5 : 1,
                    background: selectedIds.has(annotation.id) ? '#eff6ff' : undefined,
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(annotation.id)}
                      onChange={() => toggleSelection(annotation.id)}
                      disabled={!!annotation.deleted_at}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{annotation.title}</div>
                    {annotation.body && (
                      <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {annotation.body}
                      </div>
                    )}
                  </td>
                  <td class="url-cell">
                    <a href={annotation.url_full} target="_blank" rel="noopener noreferrer">
                      {new URL(annotation.url_canonical).pathname}
                    </a>
                  </td>
                  <td>
                    <span class={`badge ${annotation.anchor_type === 'element' ? 'badge-blue' : 'badge-yellow'}`}>
                      {annotation.anchor_type}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: '#6b7280' }}>
                    {formatDate(annotation.created_at)}
                    <div style={{ fontSize: '11px' }}>by {annotation.created_by}</div>
                  </td>
                  <td>
                    {annotation.deleted_at ? (
                      <span class="badge badge-red">Deleted</span>
                    ) : (
                      <span class="badge badge-green">Active</span>
                    )}
                  </td>
                  <td>
                    {annotation.deleted_at ? (
                      <button
                        class="btn btn-secondary btn-sm"
                        onClick={() => handleRestore(annotation.id)}
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        class="btn btn-secondary btn-sm"
                        onClick={() => handleDelete(annotation.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Prompt Editor Modal */}
      {showPromptEditor && (
        <div class="modal-overlay" onClick={() => !generating && setShowPromptEditor(false)}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h2 class="modal-title">
                Generated Prompt
                {aiEnhanced && <span class="badge badge-green" style={{ marginLeft: '8px' }}>AI Enhanced</span>}
              </h2>
              <button
                class="modal-close"
                onClick={() => setShowPromptEditor(false)}
                disabled={generating}
              >
                &times;
              </button>
            </div>
            <div class="modal-body">
              {generating ? (
                <div class="loading" style={{ padding: '40px' }}>
                  Generating prompt{enhanceWithAI ? ' with AI enhancement' : ''}...
                </div>
              ) : (
                <textarea
                  class="prompt-editor"
                  value={promptContent}
                  onInput={(e) => setPromptContent((e.target as HTMLTextAreaElement).value)}
                  placeholder="Generated prompt will appear here..."
                />
              )}
            </div>
            <div class="modal-footer">
              <button
                class="btn btn-secondary"
                onClick={handleCopyToClipboard}
                disabled={generating || !promptContent}
              >
                Copy to Clipboard
              </button>
              <button
                class="btn btn-secondary"
                onClick={() => setShowPromptEditor(false)}
                disabled={generating}
              >
                Cancel
              </button>
              <button
                class="btn btn-primary"
                onClick={handleExportPrompt}
                disabled={generating || !promptContent}
              >
                Export to Files
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
