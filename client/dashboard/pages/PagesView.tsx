import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface PageSummary {
  url_canonical: string;
  annotation_count: number;
  latest_annotation_at: string;
}

interface PagesViewProps {
  apiUrl: string;
}

export const PagesView: FunctionComponent<PagesViewProps> = ({ apiUrl }) => {
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPages() {
      try {
        const response = await fetch(`${apiUrl}/pages`);
        const data = await response.json();

        if (data.success) {
          setPages(data.data);
        } else {
          setError(data.error || 'Failed to fetch pages');
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchPages();
  }, [apiUrl]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalAnnotations = pages.reduce((sum, p) => sum + p.annotation_count, 0);

  return (
    <div>
      <div class="page-header">
        <h1 class="page-title">Pages</h1>
        <p class="page-subtitle">All pages with annotations</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Pages</div>
          <div class="stat-value">{pages.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Annotations</div>
          <div class="stat-value">{totalAnnotations}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Annotated Pages</span>
        </div>

        {loading ? (
          <div class="loading">Loading...</div>
        ) : error ? (
          <div class="empty-state">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        ) : pages.length === 0 ? (
          <div class="empty-state">
            <h3>No pages yet</h3>
            <p>Annotations will appear here once you start adding them.</p>
          </div>
        ) : (
          <table class="table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Annotations</th>
                <th>Last Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.url_canonical}>
                  <td class="url-cell">
                    <a href={page.url_canonical} target="_blank" rel="noopener noreferrer">
                      {page.url_canonical}
                    </a>
                  </td>
                  <td>
                    <span class="badge badge-blue">{page.annotation_count}</span>
                  </td>
                  <td>{formatDate(page.latest_annotation_at)}</td>
                  <td>
                    <a href={page.url_canonical} target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
                      Open
                    </a>
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
