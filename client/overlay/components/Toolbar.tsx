import { FunctionComponent } from 'preact';
import type { SelectionMode } from '../hooks/useSelection';

interface ToolbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectionMode: SelectionMode;
  onSetSelectionMode: (mode: SelectionMode) => void;
}

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ElementIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M3 9h18" />
  </svg>
);

const RectIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2" />
    <path d="M8 8h8v8H8z" />
  </svg>
);

export const Toolbar: FunctionComponent<ToolbarProps> = ({
  sidebarOpen,
  onToggleSidebar,
  selectionMode,
  onSetSelectionMode,
}) => {
  return (
    <div class="pa-toolbar">
      <button
        class={`pa-toolbar-btn ${selectionMode === 'element' ? 'active' : ''}`}
        onClick={() => onSetSelectionMode(selectionMode === 'element' ? 'none' : 'element')}
        title="Select element (E)"
      >
        <ElementIcon />
      </button>
      <button
        class={`pa-toolbar-btn ${selectionMode === 'rect' ? 'active' : ''}`}
        onClick={() => onSetSelectionMode(selectionMode === 'rect' ? 'none' : 'rect')}
        title="Draw rectangle (R)"
      >
        <RectIcon />
      </button>
      <button
        class="pa-toolbar-btn"
        onClick={onToggleSidebar}
        title="Toggle sidebar (S)"
      >
        {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
      </button>
    </div>
  );
};
