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

interface OllamaStatus {
  installed: boolean;
  running: boolean;
  modelAvailable: boolean;
  modelName: string;
  error?: string;
  setupInstructions?: string;
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
  const [enhanceWithAI, setEnhanceWithAI] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);

  // Fetch Ollama status
  useEffect(() => {
    async function fetchOllamaStatus() {
      try {
        const response = await fetch(`${apiUrl}/ollama/status`);
        const data = await response.json();
        if (data.success) {
          setOllamaStatus(data.data);
        }
      } catch (err) {
        console.warn('Failed to fetch Ollama status:', err);
      }
    }

    fetchOllamaStatus();
  }, [apiUrl]);

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
        body: JSON.stringify({
          enhance_with_ai: enhanceWithAI,
        }),
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
        body: JSON.stringify({
          enhance_with_ai: enhanceWithAI,
        }),
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

  const refreshOllamaStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/ollama/status`);
      const data = await response.json();
      if (data.success) {
        setOllamaStatus(data.data);
      }
    } catch (err) {
      console.warn('Failed to refresh Ollama status:', err);
    }
  };

  return (
    <div>
      <div class="page-header">
        <h1 class="page-title">Prompts</h1>
        <p class="page-subtitle">Generate and export prompts from annotations</p>
      </div>

      {/* Ollama Status Card */}
      <div class="card" style={{ marginBottom: '24px' }}>
        <div class="card-header">
          <span class="card-title">AI Enhancement Status</span>
          <button class="btn btn-secondary btn-sm" onClick={refreshOllamaStatus}>
            Refresh
          </button>
        </div>
        <div class="card-body">
          {ollamaStatus ? (
            <div>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>Ollama Service</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: ollamaStatus.running ? '#16a34a' : '#dc2626',
                      }}
                    />
                    <span style={{ fontWeight: 500 }}>
                      {ollamaStatus.running ? 'Running' : 'Not Running'}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>Model ({ollamaStatus.modelName})</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: ollamaStatus.modelAvailable ? '#16a34a' : ollamaStatus.running ? '#d97706' : '#dc2626',
                      }}
                    />
                    <span style={{ fontWeight: 500 }}>
                      {ollamaStatus.modelAvailable
                        ? 'Ready'
                        : ollamaStatus.running
                        ? 'Will auto-download'
                        : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>

              {!ollamaStatus.running && (
                <div
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginTop: '16px',
                  }}
                >
                  <div style={{ fontWeight: 500, color: '#92400e', marginBottom: '8px' }}>
                    Ollama is not running
                  </div>
                  <p style={{ color: '#a16207', fontSize: '13px', margin: 0 }}>
                    AI enhancement is disabled. Prompts will be generated using templates only.
                  </p>
                  <button
                    class="btn btn-secondary btn-sm"
                    style={{ marginTop: '12px' }}
                    onClick={() => setShowSetupInstructions(true)}
                  >
                    View Setup Instructions
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#6b7280' }}>Checking Ollama status...</div>
          )}
        </div>
      </div>

      <div class="card" style={{ marginBottom: '24px' }}>
        <div class="card-header">
          <span class="card-title">Generate Prompt</span>
        </div>
        <div class="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={enhanceWithAI}
                onChange={(e) => setEnhanceWithAI((e.target as HTMLInputElement).checked)}
                disabled={!ollamaStatus?.running}
              />
              Enhance with AI
              {!ollamaStatus?.running && (
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>(Ollama not running)</span>
              )}
            </label>
          </div>

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
                {generatedPrompt.enhanced && (
                  <span class="badge badge-green">AI Enhanced</span>
                )}
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

      {/* Setup Instructions Modal */}
      {showSetupInstructions && ollamaStatus?.setupInstructions && (
        <div class="modal-overlay" onClick={() => setShowSetupInstructions(false)}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h2 class="modal-title">Ollama Setup Instructions</h2>
              <button class="modal-close" onClick={() => setShowSetupInstructions(false)}>
                &times;
              </button>
            </div>
            <div class="modal-body">
              <pre
                style={{
                  background: '#1a1a1a',
                  color: '#f0f0f0',
                  padding: '20px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {ollamaStatus.setupInstructions}
              </pre>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onClick={() => setShowSetupInstructions(false)}>
                Close
              </button>
              <button
                class="btn btn-primary"
                onClick={() => {
                  navigator.clipboard.writeText(ollamaStatus.setupInstructions || '');
                  alert('Instructions copied to clipboard!');
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
