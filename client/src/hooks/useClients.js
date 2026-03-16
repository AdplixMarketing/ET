import { useState, useCallback } from 'react';
import api from '../api/client';

export function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/clients', { params });
      setClients(res.data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = async (data) => {
    const res = await api.post('/clients', data);
    return res.data;
  };

  const updateClient = async (id, data) => {
    const res = await api.put(`/clients/${id}`, data);
    return res.data;
  };

  const deleteClient = async (id) => {
    await api.delete(`/clients/${id}`);
  };

  return { clients, loading, fetch, createClient, updateClient, deleteClient };
}
