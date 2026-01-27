import { FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';
import type { Annotation } from '../hooks/useAnnotations';

interface AnnotationMarkerProps {
  annotation: Annotation;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export const AnnotationMarker: FunctionComponent<AnnotationMarkerProps> = ({
  annotation,
  index,
  isActive,
  onClick,
}) => {
  const position = useMemo(() => {
    const payload = annotation.anchor_payload;

    if (annotation.anchor_type === 'element' && 'selector' in payload) {
      // Try to find the element
      try {
        const element = document.querySelector(payload.selector as string);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            left: rect.right + window.scrollX - 12,
            top: rect.top + window.scrollY - 12,
          };
        }
      } catch {
        // Selector might be invalid
      }
      return null;
    }

    if (annotation.anchor_type === 'rect' && 'x' in payload) {
      // Calculate position based on stored viewport info
      const { x, y, scrollX, scrollY, viewportWidth, viewportHeight } = payload as {
        x: number;
        y: number;
        scrollX: number;
        scrollY: number;
        viewportWidth: number;
        viewportHeight: number;
      };

      // Adjust for current viewport if size changed
      const scaleX = window.innerWidth / viewportWidth;
      const scaleY = window.innerHeight / viewportHeight;

      return {
        left: x * scaleX - 12,
        top: y * scaleY + window.scrollY - scrollY * scaleY - 12,
      };
    }

    return null;
  }, [annotation]);

  if (!position) {
    return null;
  }

  return (
    <div
      class={`pa-marker ${isActive ? 'active' : ''}`}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
      }}
      onClick={onClick}
      title={annotation.title}
    >
      {index + 1}
    </div>
  );
};
