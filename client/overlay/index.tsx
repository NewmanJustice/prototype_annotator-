import { render } from 'preact';
import { Overlay } from './Overlay';
import overlayStyles from './styles/overlay.css?inline';

interface ClientConfig {
  basePath: string;
  apiUrl: string;
  defaultActor: string;
}

declare global {
  interface Window {
    __PROTOTYPE_ANNOTATOR_CONFIG__?: ClientConfig;
  }
}

function mountOverlay() {
  // Get config from injected global
  const config = window.__PROTOTYPE_ANNOTATOR_CONFIG__;
  if (!config) {
    console.error('[prototype-annotator] No configuration found');
    return;
  }

  // Check if already mounted
  if (document.getElementById('prototype-annotator-root')) {
    return;
  }

  // Create host element
  const host = document.createElement('div');
  host.id = 'prototype-annotator-root';
  document.body.appendChild(host);

  // Create shadow DOM for style isolation
  const shadow = host.attachShadow({ mode: 'open' });

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = overlayStyles;
  shadow.appendChild(styleEl);

  // Create container for Preact
  const container = document.createElement('div');
  container.id = 'prototype-annotator-container';
  shadow.appendChild(container);

  // Mount Preact app
  render(<Overlay config={config} />, container);

  console.log('[prototype-annotator] Overlay mounted');
}

// Mount when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountOverlay);
} else {
  mountOverlay();
}
