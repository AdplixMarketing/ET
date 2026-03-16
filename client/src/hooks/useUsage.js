import { useState, useCallback } from 'react';
import api from '../api/client';

export function useUsage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/usage');
      setUsage(res.data);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { usage, loading, fetch };
}
