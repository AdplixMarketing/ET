import { useState, useCallback } from 'react';
import api from '../api/client';

export function useDashboard() {
  const [summary, setSummary] = useState({ income: 0, expenses: 0, profit: 0 });
  const [chartData, setChartData] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, chartRes, recentRes] = await Promise.all([
        api.get('/dashboard/summary', { params }),
        api.get('/dashboard/chart', { params: { months: 6 } }),
        api.get('/dashboard/recent'),
      ]);
      setSummary(summaryRes.data);
      setChartData(chartRes.data);
      setRecent(recentRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, chartData, recent, loading, error, fetch };
}
