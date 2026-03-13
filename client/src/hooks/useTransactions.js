import { useState, useCallback } from 'react';
import api from '../api/client';

export function useTransactions() {
  const [data, setData] = useState({ transactions: [], total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransaction = async (formData) => {
    const res = await api.post('/transactions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  };

  const updateTransaction = async (id, formData) => {
    const res = await api.put(`/transactions/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  };

  const deleteTransaction = async (id) => {
    await api.delete(`/transactions/${id}`);
  };

  return { ...data, loading, fetch, createTransaction, updateTransaction, deleteTransaction };
}
