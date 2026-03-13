import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useCategories(type) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const params = type ? { type } : {};
      const res = await api.get('/categories', { params });
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetch(); }, [fetch]);

  const createCategory = async (data) => {
    const res = await api.post('/categories', data);
    setCategories((prev) => [...prev, res.data]);
    return res.data;
  };

  const updateCategory = async (id, data) => {
    const res = await api.put(`/categories/${id}`, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    return res.data;
  };

  const deleteCategory = async (id) => {
    await api.delete(`/categories/${id}`);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return { categories, loading, refetch: fetch, createCategory, updateCategory, deleteCategory };
}
