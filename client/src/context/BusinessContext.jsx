import { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

export const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [currentBusinessId, setCurrentBusinessId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    if (!user || user.plan !== 'max') return;
    setLoading(true);
    try {
      const res = await api.get('/businesses');
      setBusinesses(res.data);
      if (!currentBusinessId && res.data.length > 0) {
        const stored = localStorage.getItem('businessId');
        const defaultBiz = (stored && res.data.find((b) => b.id === parseInt(stored)))
          || res.data.find((b) => b.id === user.default_business_id)
          || res.data[0];
        setCurrentBusinessId(defaultBiz.id);
        localStorage.setItem('businessId', defaultBiz.id);
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentBusinessId]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const switchBusiness = useCallback((id) => {
    setCurrentBusinessId(id);
    localStorage.setItem('businessId', id);
  }, []);

  return (
    <BusinessContext.Provider value={{ businesses, currentBusinessId, switchBusiness, loading, fetchBusinesses }}>
      {children}
    </BusinessContext.Provider>
  );
}
