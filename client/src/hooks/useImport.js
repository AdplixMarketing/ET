import { useState, useCallback } from 'react';
import api from '../api/client';

export function useImport() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/imports/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch import history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { history, loading, fetch };
}
