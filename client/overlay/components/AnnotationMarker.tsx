import { FunctionComponent } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import type { Annotation } from '../hooks/useAnnotations';

interface AnnotationMarkerProps {
  annotation: Annotation;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

interface Position {
  left: number;
  top: number;
}

export const AnnotationMarker: FunctionComponent<AnnotationMarkerProps> = ({
  annotation,
  index,
  isActive,
  onClick,
}) => {
  const [position, setPosition] = useState<Position | null>(null);

  const calculatePosition = useCallback((): Position | null => {
    const payload = annotation.anchor_payload;

    if (annotation.anchor_type === 'element' && 'selector' in payload) {
      // Try to find the element
      try {
        const element = document.querySelector(payload.selector as string);
        if (element) {
          // getBoundingClientRect returns viewport-relative coords, perfect for position: fixed
          const rect = element.getBoundingClientRect();
          return {
            left: rect.right - 12,
            top: rect.top - 12,
          };
        }
      } catch {
        // Selector might be invalid
      }
      return null;
    }

    if (annotation.anchor_type === 'rect' && 'x' in payload) {
      // Rectangle positions are stored as document-relative coordinates
      const { x, y, width, scrollX, scrollY, viewportWidth, viewportHeight } = payload as {
        x: number;
        y: number;
        width: number;
        scrollX: number;
        scrollY: number;
        viewportWidth: number;
        viewportHeight: number;
      };

      // Adjust for current viewport if size changed
      const scaleX = window.innerWidth / viewportWidth;
      const scaleY = window.innerHeight / viewportHeight;

      // Calculate document position of the annotation
      const docX = (x + scrollX) * scaleX;
      const docY = (y + scrollY) * scaleY;

      // Convert to viewport-relative position for position: fixed
      return {
        left: docX - window.scrollX + width * scaleX - 12,
        top: docY - window.scrollY - 12,
      };
    }

    return null;
  }, [annotation]);

  useEffect(() => {
    // Calculate initial position
    setPosition(calculatePosition());

    // Recalculate on scroll and resize
    const handleUpdate = () => {
      setPosition(calculatePosition());
    };

    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [calculatePosition]);

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
