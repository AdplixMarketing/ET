import { useContext } from 'react';
import { BusinessContext } from '../context/BusinessContext';

export function useBusinesses() {
  const context = useContext(BusinessContext);
  if (!context) {
    return { businesses: [], currentBusinessId: null, switchBusiness: () => {}, loading: false, fetchBusinesses: () => {} };
  }
  return context;
}
