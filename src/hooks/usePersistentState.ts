import { useState, useEffect } from 'react';

export function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  // Get initial state from localStorage or use default
  const [state, setState] = useState<T>(() => {
    const persistedValue = localStorage.getItem(key);
    return persistedValue ? JSON.parse(persistedValue) : defaultValue;
  });

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}