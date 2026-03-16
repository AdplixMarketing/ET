import { useState, useCallback } from 'react';
import api from '../api/client';

export function useReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async (endpoint, params = {}) => {
    setLoading(true);
    try {
      const res = await api.get(endpoint, { params });
      setData(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch report:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, fetchReport };
}
