import { useState, useCallback } from 'react';
import api from '../api/client';

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/jobs', { params });
      setJobs(res.data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = async (data) => {
    const res = await api.post('/jobs', data);
    return res.data;
  };

  const updateJob = async (id, data) => {
    const res = await api.put(`/jobs/${id}`, data);
    return res.data;
  };

  const deleteJob = async (id) => {
    await api.delete(`/jobs/${id}`);
  };

  return { jobs, loading, fetch, createJob, updateJob, deleteJob };
}
