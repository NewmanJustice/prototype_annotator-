import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface AnnotationEvent {
  id: string;
  annotation_id: string | null;
  event_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'EXPORT_PROMPT';
  actor: string;
  timestamp: string;
  diff: Record<string, { old: unknown; new: unknown }> | null;
  meta: Record<string, unknown> | null;
}

interface EventsViewProps {
  apiUrl: string;
}

const eventTypeColors: Record<string, string> = {
  CREATE: 'badge-green',
  UPDATE: 'badge-blue',
  DELETE: 'badge-red',
  RESTORE: 'badge-yellow',
  EXPORT_PROMPT: 'badge-gray',
};

const eventTypeIcons: Record<string, string> = {
  CREATE: '+',
  UPDATE: '~',
  DELETE: '-',
  RESTORE: '↺',
  EXPORT_PROMPT: '↗',
};

export const EventsView: FunctionComponent<EventsViewProps> = ({ apiUrl }) => {
  const [events, setEvents] = useState<AnnotationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/events?limit=${limit}&offset=${offset}`);
        const data = await response.json();

        if (data.success) {
          setEvents(data.data.items);
          setTotal(data.data.total);
        } else {
          setError(data.error || 'Failed to fetch events');
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [apiUrl, offset]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  const getEventDescription = (event: AnnotationEvent) => {
    switch (event.event_type) {
      case 'CREATE':
        return `Created annotation "${event.meta?.title || 'untitled'}"`;
      case 'UPDATE':
        const fields = event.diff ? Object.keys(event.diff).join(', ') : '';
        return `Updated annotation${fields ? `: ${fields}` : ''}`;
      case 'DELETE':
        return `Deleted annotation "${event.meta?.title || 'untitled'}"`;
      case 'RESTORE':
        return 'Restored annotation';
      case 'EXPORT_PROMPT':
        return `Exported prompt with ${event.meta?.annotation_count || 0} annotations`;
      default:
        return event.event_type;
    }
  };

  return (
    <div>
      <div class="page-header">
        <h1 class="page-title">Events</h1>
        <p class="page-subtitle">Activity timeline and audit log</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Events</div>
          <div class="stat-value">{total}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent Activity</span>
        </div>

        {loading ? (
          <div class="loading">Loading...</div>
        ) : error ? (
          <div class="empty-state">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div class="empty-state">
            <h3>No events yet</h3>
            <p>Events will appear here as you interact with annotations.</p>
          </div>
        ) : (
          <>
            <div class="card-body">
              <div class="timeline">
                {events.map((event) => (
                  <div key={event.id} class="timeline-item">
                    <div class="timeline-marker">
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {eventTypeIcons[event.event_type]}
                      </span>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-title">
                        <span class={`badge ${eventTypeColors[event.event_type]} `} style={{ marginRight: '8px' }}>
                          {event.event_type}
                        </span>
                        {getEventDescription(event)}
                      </div>
                      <div class="timeline-meta">
                        {formatRelativeTime(event.timestamp)} by {event.actor}
                        {event.annotation_id && (
                          <span style={{ marginLeft: '8px', color: '#9ca3af' }}>
                            ID: {event.annotation_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div class="pagination">
              <div class="pagination-info">
                Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
              </div>
              <div class="pagination-buttons">
                <button
                  class="btn btn-secondary btn-sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  Previous
                </button>
                <button
                  class="btn btn-secondary btn-sm"
                  disabled={offset + limit >= total}
                  onClick={() => setOffset(offset + limit)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
