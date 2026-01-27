import { FunctionComponent } from 'preact';
import type { SelectionMode } from '../hooks/useSelection';

interface SelectionToolsProps {
  mode: SelectionMode;
  hoveredRect: DOMRect | null;
  rectDrag: { startX: number; startY: number; endX: number; endY: number } | null;
}

export const SelectionTools: FunctionComponent<SelectionToolsProps> = ({
  mode,
  hoveredRect,
  rectDrag,
}) => {
  return (
    <>
      {/* Mode indicator */}
      {mode !== 'none' && (
        <div class="pa-mode-indicator">
          {mode === 'element' ? 'Click to select element' : 'Drag to draw rectangle'}
          <kbd>ESC</kbd> to cancel
        </div>
      )}

      {/* Element highlight */}
      {mode === 'element' && hoveredRect && (
        <div
          class="pa-element-highlight"
          style={{
            left: `${hoveredRect.left}px`,
            top: `${hoveredRect.top}px`,
            width: `${hoveredRect.width}px`,
            height: `${hoveredRect.height}px`,
          }}
        />
      )}

      {/* Rectangle selection */}
      {mode === 'rect' && rectDrag && (
        <div
          class="pa-selection-rect"
          style={{
            left: `${Math.min(rectDrag.startX, rectDrag.endX)}px`,
            top: `${Math.min(rectDrag.startY, rectDrag.endY)}px`,
            width: `${Math.abs(rectDrag.endX - rectDrag.startX)}px`,
            height: `${Math.abs(rectDrag.endY - rectDrag.startY)}px`,
          }}
        />
      )}
    </>
  );
};
