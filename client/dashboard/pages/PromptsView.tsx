import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface PromptExport {
  id: string;
  created_at: string;
  actor: string;
  url_scope: string[];
  annotation_ids: string[];
  template_id: string;
  prompt_markdown: string;
  saved_path_md: string;
  saved_path_json: string;
}

interface GeneratedPrompt {
  markdown: string;
  annotations: unknown[];
  enhanced: boolean;
}

interface PromptsViewProps {
  apiUrl: string;
}

export const PromptsView: FunctionComponent<PromptsViewProps> = ({ apiUrl }) => {
  const [exports, setExports] = useState<PromptExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);

  useEffect(() => {
    async function fetchExports() {
      try {
        const response = await fetch(`${apiUrl}/prompts/exports`);
        const data = await response.json();

        if (data.success) {
          setExports(data.data);
        } else {
          setError(data.error || 'Failed to fetch exports');
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchExports();
  }, [apiUrl]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedPrompt(null);

    try {
      const response = await fetch(`${apiUrl}/prompts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (data.success) {
        setGeneratedPrompt(data.data);
      } else {
        alert(data.error || 'Failed to generate prompt');
      }
    } catch (err) {
      alert(String(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    setGenerating(true);

    try {
      const response = await fetch(`${apiUrl}/prompts/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (data.success) {
        setExports((prev) => [data.data, ...prev]);
        setGeneratedPrompt(null);
        alert(`Exported successfully!\n\nMarkdown: ${data.data.saved_path_md}\nJSON: ${data.data.saved_path_json}`);
      } else {
        alert(data.error || 'Failed to export prompt');
      }
    } catch (err) {
      alert(String(err));
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div class="page-header">
        <h1 class="page-title">Prompts</h1>
        <p class="page-subtitle">Generate and export prompts from annotations</p>
      </div>

      <div class="card" style={{ marginBottom: '24px' }}>
        <div class="card-header">
          <span class="card-title">Generate Prompt</span>
        </div>
        <div class="card-body">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              class="btn btn-secondary"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Preview'}
            </button>
            <button
              class="btn btn-primary"
              onClick={handleExport}
              disabled={generating}
            >
              {generating ? 'Exporting...' : 'Export to Files'}
            </button>
          </div>

          {generatedPrompt && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <strong>Preview</strong>
                <span class="badge badge-gray">{generatedPrompt.annotations.length} annotations</span>
              </div>
              <textarea
                style={{
                  width: '100%',
                  height: '400px',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  resize: 'vertical',
                }}
                value={generatedPrompt.markdown}
                readOnly
              />
            </div>
          )}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Export History ({exports.length})</span>
        </div>

        {loading ? (
          <div class="loading">Loading...</div>
        ) : error ? (
          <div class="empty-state">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        ) : exports.length === 0 ? (
          <div class="empty-state">
            <h3>No exports yet</h3>
            <p>Exported prompts will appear here.</p>
          </div>
        ) : (
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Actor</th>
                <th>Annotations</th>
                <th>Files</th>
              </tr>
            </thead>
            <tbody>
              {exports.map((exp) => (
                <tr key={exp.id}>
                  <td>{formatDate(exp.created_at)}</td>
                  <td>{exp.actor}</td>
                  <td>
                    <span class="badge badge-blue">{exp.annotation_ids.length}</span>
                  </td>
                  <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                    <div>{exp.saved_path_md}</div>
                    <div>{exp.saved_path_json}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
