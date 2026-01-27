import { useState, useEffect, useCallback } from 'preact/hooks';

interface AnchorPayload {
  selector?: string;
  xpath?: string;
  textContent?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scrollX?: number;
  scrollY?: number;
  viewportWidth?: number;
  viewportHeight?: number;
}

export interface Annotation {
  id: string;
  url_full: string;
  url_canonical: string;
  title: string;
  body: string;
  anchor_type: 'element' | 'rect';
  anchor_payload: AnchorPayload;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string;
  updated_by: string;
}

interface CreateAnnotationInput {
  url_full: string;
  title: string;
  body: string;
  anchor_type: 'element' | 'rect';
  anchor_payload: AnchorPayload;
  actor?: string;
}

interface UseAnnotationsResult {
  annotations: Annotation[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CreateAnnotationInput) => Promise<Annotation | null>;
  update: (id: string, input: Partial<CreateAnnotationInput>) => Promise<Annotation | null>;
  remove: (id: string) => Promise<boolean>;
}

export function useAnnotations(apiUrl: string, defaultActor: string): UseAnnotationsResult {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUrl = window.location.origin + window.location.pathname;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiUrl}/annotations/by-url?url=${encodeURIComponent(currentUrl)}`
      );
      const data = await response.json();

      if (data.success) {
        setAnnotations(data.data);
      } else {
        setError(data.error || 'Failed to fetch annotations');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [apiUrl, currentUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: CreateAnnotationInput): Promise<Annotation | null> => {
      try {
        const response = await fetch(`${apiUrl}/annotations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...input,
            actor: input.actor || defaultActor,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setAnnotations((prev) => [data.data, ...prev]);
          return data.data;
        } else {
          setError(data.error || 'Failed to create annotation');
          return null;
        }
      } catch (err) {
        setError(String(err));
        return null;
      }
    },
    [apiUrl, defaultActor]
  );

  const update = useCallback(
    async (id: string, input: Partial<CreateAnnotationInput>): Promise<Annotation | null> => {
      try {
        const response = await fetch(`${apiUrl}/annotations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...input,
            actor: input.actor || defaultActor,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setAnnotations((prev) =>
            prev.map((a) => (a.id === id ? data.data : a))
          );
          return data.data;
        } else {
          setError(data.error || 'Failed to update annotation');
          return null;
        }
      } catch (err) {
        setError(String(err));
        return null;
      }
    },
    [apiUrl, defaultActor]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `${apiUrl}/annotations/${id}?actor=${encodeURIComponent(defaultActor)}`,
          { method: 'DELETE' }
        );

        const data = await response.json();

        if (data.success) {
          setAnnotations((prev) => prev.filter((a) => a.id !== id));
          return true;
        } else {
          setError(data.error || 'Failed to delete annotation');
          return false;
        }
      } catch (err) {
        setError(String(err));
        return false;
      }
    },
    [apiUrl, defaultActor]
  );

  return {
    annotations,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
  };
}
