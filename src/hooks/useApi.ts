'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook to fetch data from an API route and manage CRUD operations.
 * Replaces usePersistedState for all modules.
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

  const create = useCallback(async (item: Partial<T> & Record<string, unknown>) => {
    const res = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create');
    await fetchData(); // Refresh data
    return json;
  }, [endpoint, fetchData]);

  const update = useCallback(async (item: Partial<T> & Record<string, unknown>) => {
    const res = await fetch(`/api/${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update');
    await fetchData();
    return json;
  }, [endpoint, fetchData]);

  const remove = useCallback(async (id: number | string) => {
    const res = await fetch(`/api/${endpoint}?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete');
    await fetchData();
    return json;
  }, [endpoint, fetchData]);

  return { data, setData, loading, error, refetch: fetchData, create, update, remove };
}
