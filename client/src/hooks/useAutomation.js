import { useState, useCallback } from 'react';
import api from '../api/client';

export function useAutomation() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/automation');
      setRules(res.data);
    } catch (err) {
      console.error('Failed to fetch automation rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRule = async (data) => {
    const res = await api.post('/automation', data);
    return res.data;
  };

  const updateRule = async (id, data) => {
    const res = await api.put(`/automation/${id}`, data);
    return res.data;
  };

  const deleteRule = async (id) => {
    await api.delete(`/automation/${id}`);
  };

  return { rules, loading, fetch, createRule, updateRule, deleteRule };
}
