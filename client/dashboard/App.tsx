import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { PagesView } from './pages/PagesView';
import { AnnotationsView } from './pages/AnnotationsView';
import { EventsView } from './pages/EventsView';
import { PromptsView } from './pages/PromptsView';

type View = 'pages' | 'annotations' | 'events' | 'prompts';

const PagesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

const AnnotationsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const EventsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PromptsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

function getApiUrl(): string {
  // Extract base path from current URL
  const pathParts = window.location.pathname.split('/');
  const dashboardIndex = pathParts.findIndex((p) => p === 'dashboard');
  if (dashboardIndex > 0) {
    const basePath = pathParts.slice(0, dashboardIndex).join('/');
    return `${window.location.origin}${basePath}/api`;
  }
  return `${window.location.origin}/__prototype-annotator/api`;
}

export const App: FunctionComponent = () => {
  const [currentView, setCurrentView] = useState<View>('pages');
  const apiUrl = getApiUrl();

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'pages';
      if (['pages', 'annotations', 'events', 'prompts'].includes(hash)) {
        setCurrentView(hash as View);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (view: View) => {
    window.location.hash = view;
  };

  return (
    <div class="dashboard">
      <aside class="dashboard-sidebar">
        <div class="dashboard-logo">
          <h1>Prototype Annotator</h1>
          <span>Dashboard</span>
        </div>
        <nav class="dashboard-nav">
          <a
            href="#pages"
            class={`nav-link ${currentView === 'pages' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('pages');
            }}
          >
            <PagesIcon />
            Pages
          </a>
          <a
            href="#annotations"
            class={`nav-link ${currentView === 'annotations' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('annotations');
            }}
          >
            <AnnotationsIcon />
            Annotations
          </a>
          <a
            href="#events"
            class={`nav-link ${currentView === 'events' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('events');
            }}
          >
            <EventsIcon />
            Events
          </a>
          <a
            href="#prompts"
            class={`nav-link ${currentView === 'prompts' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('prompts');
            }}
          >
            <PromptsIcon />
            Prompts
          </a>
        </nav>
      </aside>

      <main class="dashboard-main">
        {currentView === 'pages' && <PagesView apiUrl={apiUrl} />}
        {currentView === 'annotations' && <AnnotationsView apiUrl={apiUrl} />}
        {currentView === 'events' && <EventsView apiUrl={apiUrl} />}
        {currentView === 'prompts' && <PromptsView apiUrl={apiUrl} />}
      </main>
    </div>
  );
};
