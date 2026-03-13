'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * A drop-in replacement for useState that persists data to localStorage.
 * On first render it reads from localStorage; every state change writes back.
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setStateRaw] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  // On mount, read from localStorage
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setStateRaw(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, [key]);

  // Write to localStorage whenever state changes (after mount)
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [key, state, isMounted]);

  // Wrap setter to also trigger localStorage sync
  const setState: React.Dispatch<React.SetStateAction<T>> = useCallback((value) => {
    setStateRaw(value);
  }, []);

  return [state, setState];
}
