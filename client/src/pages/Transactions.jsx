import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { format } from 'date-fns';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Transactions.module.css';

export default function Transactions() {
  const { transactions, total, page, totalPages, loading, fetch } = useTransactions();
  const { categories } = useCategories();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    q: '', type: '', category_id: '', page: 1,
  });

  useEffect(() => {
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.type) params.type = filters.type;
    if (filters.category_id) params.category_id = filters.category_id;
    params.page = filters.page;
    fetch(params);
  }, [filters, fetch]);

  return (
    <div className="page">
      <div className="container">
        <div className={styles.header}>
          <h1>Transactions</h1>
          <span className={styles.count}>{total} total</span>
        </div>

        {/* Search */}
        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
          />
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <button
            className={`${styles.chip} ${!filters.type ? styles.chipActive : ''}`}
            onClick={() => setFilters({ ...filters, type: '', page: 1 })}
          >
            All
          </button>
          <button
            className={`${styles.chip} ${filters.type === 'income' ? styles.chipActive : ''}`}
            onClick={() => setFilters({ ...filters, type: 'income', page: 1 })}
          >
            Income
          </button>
          <button
            className={`${styles.chip} ${filters.type === 'expense' ? styles.chipActive : ''}`}
            onClick={() => setFilters({ ...filters, type: 'expense', page: 1 })}
          >
            Expenses
          </button>

          <select
            value={filters.category_id}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value, page: 1 })}
            className={styles.selectFilter}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="spinner" />
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found</p>
          </div>
        ) : (
          <div className={styles.list}>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className={styles.item}
                onClick={() => navigate(`/transactions/${tx.id}`)}
              >
                <div className={styles.dot} style={{ background: tx.category_color || '#868E96' }} />
                <div className={styles.info}>
                  <span className={styles.name}>
                    {tx.vendor_or_client || tx.description || tx.category_name || 'Transaction'}
                  </span>
                  <span className={styles.meta}>
                    {tx.category_name} &middot; {format(new Date(tx.date), 'MMM d, yyyy')}
                    {tx.payment_method ? ` \u00B7 ${tx.payment_method}` : ''}
                  </span>
                </div>
                <span className={tx.type === 'income' ? styles.amountIncome : styles.amountExpense}>
                  {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className="btn btn-outline"
              disabled={page <= 1}
              onClick={() => setFilters({ ...filters, page: page - 1 })}
            >
              <ChevronLeft size={18} />
            </button>
            <span>{page} / {totalPages}</span>
            <button
              className="btn btn-outline"
              disabled={page >= totalPages}
              onClick={() => setFilters({ ...filters, page: page + 1 })}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        <button
          className={styles.fab}
          onClick={() => navigate('/transactions/new')}
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}
