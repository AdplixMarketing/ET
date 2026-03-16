import { useState, useCallback } from 'react';
import api from '../api/client';

export function useRecurring() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/recurring');
      setRules(res.data);
    } catch (err) {
      console.error('Failed to fetch recurring rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { rules, loading, fetch };
}
