import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, Download, Send, CheckCircle, Edit3, Trash2 } from 'lucide-react';
import styles from './InvoiceView.module.css';

const STATUS_COLORS = {
  draft: '#8E8E93',
  sent: '#4A90E2',
  paid: '#34C759',
  overdue: '#FF3B30',
};

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/invoices/${id}`)
      .then((res) => setInvoice(res.data))
      .catch(() => toast.error('Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSend = async () => {
    try {
      await api.post(`/invoices/${id}/send`);
      setInvoice({ ...invoice, status: 'sent' });
      toast.success('Invoice marked as sent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleMarkPaid = async () => {
    try {
      await api.post(`/invoices/${id}/paid`);
      setInvoice({ ...invoice, status: 'paid' });
      toast.success('Invoice marked as paid — income recorded!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDownload = async () => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      toast.success('PDF downloaded');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this draft invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted');
      navigate('/invoices');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading) return <div className="spinner" />;
  if (!invoice) return null;

  return (
    <div className="page">
      <div className="container">
        <div className={styles.topBar}>
          <button className={styles.back} onClick={() => navigate('/invoices')}>
            <ArrowLeft size={20} />
          </button>
          <h1>{invoice.invoice_number}</h1>
          <span
            className={styles.status}
            style={{ color: STATUS_COLORS[invoice.status], background: `${STATUS_COLORS[invoice.status]}15` }}
          >
            {invoice.status}
          </span>
        </div>

        {/* Invoice Card */}
        <div className={styles.invoiceCard}>
          <div className={styles.accentBar} />
          <div className={styles.invoiceBody}>
            {/* Header */}
            <div className={styles.invoiceHeader}>
              <div className={styles.brandSide}>
                <h2>{user?.business_name || 'My Business'}</h2>
                <div className={styles.brandEmail}>{user?.email}</div>
              </div>
              <div>
                <div className={styles.invoiceLabel}>INVOICE</div>
                <div className={styles.invoiceNumber}>{invoice.invoice_number}</div>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Bill To + Dates */}
            <div className={styles.infoRow}>
              <div>
                <div className={styles.label}>BILL TO</div>
                <div className={styles.clientName}>{invoice.client_name}</div>
                {invoice.client_email && (
                  <div className={styles.clientEmail}>{invoice.client_email}</div>
                )}
              </div>
              <div className={styles.datesBlock}>
                <div className={styles.dateItem}>
                  <div className={styles.label}>ISSUE DATE</div>
                  <span className={styles.dateValue}>
                    {format(new Date(invoice.issue_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className={styles.dateItem}>
                  <div className={styles.label}>DUE DATE</div>
                  <span className={styles.dateValue}>
                    {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div
                  className={styles.statusBadge}
                  style={{ background: STATUS_COLORS[invoice.status] }}
                >
                  {invoice.status}
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Line Items */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, i) => (
                    <tr key={i}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>${parseFloat(item.rate).toFixed(2)}</td>
                      <td>${parseFloat(item.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>${parseFloat(invoice.subtotal).toFixed(2)}</span>
              </div>
              {parseFloat(invoice.tax_rate) > 0 && (
                <div className={styles.totalRow}>
                  <span>Tax ({invoice.tax_rate}%)</span>
                  <span>${parseFloat(invoice.tax_amount).toFixed(2)}</span>
                </div>
              )}
              <div className={styles.totalFinal}>
                <span>Total</span>
                <span>${parseFloat(invoice.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className={styles.notesSection}>
                <div className={styles.label}>NOTES</div>
                <p className={styles.notesText}>{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.invoiceFooter}>
            Thank you for your business.
            <span>Generated with AddFi</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className="btn btn-outline" style={{ flex: 1, minWidth: 0, padding: '10px 0' }} onClick={handleDownload}>
            <Download size={16} /> PDF
          </button>

          {invoice.status === 'draft' && (
            <>
              <button className="btn btn-primary" style={{ flex: 1, minWidth: 0, padding: '10px 0' }} onClick={handleSend}>
                <Send size={16} /> Mark Sent
              </button>
              <button className="btn btn-outline" style={{ flex: 1, minWidth: 0, padding: '10px 0' }} onClick={() => navigate(`/invoices/${id}/edit`)}>
                <Edit3 size={16} /> Edit
              </button>
              <button className="btn btn-danger" style={{ minWidth: 0, padding: '10px 12px' }} onClick={handleDelete}>
                <Trash2 size={16} />
              </button>
            </>
          )}

          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <button className="btn btn-success" style={{ flex: 1, minWidth: 0, padding: '10px 0' }} onClick={handleMarkPaid}>
              <CheckCircle size={16} /> Mark Paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
