'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Generic hook to fetch data from an API route and manage CRUD operations.
 * All mutation errors are surfaced as toast.error — never thrown to avoid unhandled crashes.
 */
export function useApi<T extends { id: number | string }>(endpoint: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/${endpoint}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = useCallback(async (item: Partial<T> & Record<string, unknown>): Promise<T | null> => {
    try {
      const res = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to create');
        return null;
      }
      await fetchData();
      return json as T;
    } catch {
      toast.error('Network error — please try again');
      return null;
    }
  }, [endpoint, fetchData]);

  const update = useCallback(async (item: Partial<T> & Record<string, unknown>): Promise<T | null> => {
    try {
      const res = await fetch(`/api/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to update');
        return null;
      }
      await fetchData();
      return json as T;
    } catch {
      toast.error('Network error — please try again');
      return null;
    }
  }, [endpoint, fetchData]);

  const remove = useCallback(async (id: number | string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/${endpoint}?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to delete');
        return false;
      }
      await fetchData();
      return true;
    } catch {
      toast.error('Network error — please try again');
      return false;
    }
  }, [endpoint, fetchData]);

  return { data, setData, loading, error, refetch: fetchData, create, update, remove };
}
