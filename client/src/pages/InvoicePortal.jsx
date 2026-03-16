import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FileText, CheckCircle, CreditCard, Loader } from 'lucide-react';
import styles from './Auth.module.css';

const baseURL = import.meta.env.VITE_API_URL || '';

export default function InvoicePortal() {
  const { token } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${baseURL}/api/portal/${token}`)
      .then((res) => setInvoice(res.data))
      .catch((err) => {
        const msg = err.response?.data?.error || 'Invoice not found or link has expired.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handlePay = async () => {
    setPaying(true);
    try {
      await axios.post(`${baseURL}/api/portal/${token}/pay`);
      setPaid(true);
      toast.success('Payment successful!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card} style={{ textAlign: 'center' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card} style={{ textAlign: 'center' }}>
          <FileText size={48} strokeWidth={1} style={{ color: '#8E8E93', marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Invoice Unavailable</h2>
          <p style={{ color: '#6B7280' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const subtotal = parseFloat(invoice.subtotal || 0);
  const taxRate = parseFloat(invoice.tax_rate || 0);
  const taxAmount = parseFloat(invoice.tax_amount || 0);
  const total = parseFloat(invoice.total || 0);
  const processingFee = Math.round(total * 0.035 * 100) / 100;
  const totalWithFee = Math.round((total + processingFee) * 100) / 100;

  return (
    <div className={styles.wrapper}>
      <div style={{ width: '100%', maxWidth: 600, padding: '0 16px' }}>
        {/* Invoice Card */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          {/* Accent bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #4A90E2, #7B61FF)' }} />

          <div style={{ padding: '28px 24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                  {invoice.business_name || 'Invoice'}
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>INVOICE</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{invoice.invoice_number}</div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #F0F0F0', margin: '16px 0' }} />

            {/* Bill To + Dates */}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: 1, marginBottom: 4 }}>BILL TO</div>
                <div style={{ fontWeight: 600 }}>{invoice.client_name}</div>
                {invoice.client_email && (
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{invoice.client_email}</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>ISSUE DATE</div>
                  <div style={{ fontSize: 14 }}>
                    {format(new Date(invoice.issue_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>DUE DATE</div>
                  <div style={{ fontSize: 14 }}>
                    {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #F0F0F0', margin: '16px 0' }} />

            {/* Items Table */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>Rate</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F8F8F8' }}>
                      <td style={{ padding: '10px 4px' }}>{item.description}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right' }}>${parseFloat(item.rate).toFixed(2)}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right' }}>${parseFloat(item.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ marginTop: 20, borderTop: '2px solid #F0F0F0', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
                <span style={{ color: '#6B7280' }}>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
                  <span style={{ color: '#6B7280' }}>Tax ({invoice.tax_rate}%)</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 18, fontWeight: 700 }}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div style={{ marginTop: 20, padding: '12px 16px', background: '#F9FAFB', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: 1, marginBottom: 4 }}>NOTES</div>
                <p style={{ margin: 0, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 24px', background: '#F9FAFB', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
            Thank you for your business.
          </div>
        </div>

        {/* Payment Section */}
        {paid || invoice.status === 'paid' ? (
          <div
            style={{
              marginTop: 16,
              padding: '20px 24px',
              background: '#ECFDF5',
              borderRadius: 12,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle size={32} style={{ color: '#34C759' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#065F46' }}>Payment Complete</div>
            <div style={{ fontSize: 14, color: '#047857' }}>
              This invoice has been paid. Thank you!
            </div>
          </div>
        ) : invoice.payment_enabled ? (
          <div
            style={{
              marginTop: 16,
              padding: '20px 24px',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
              A 3.5% processing fee applies to online payments.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
              <span style={{ color: '#6B7280' }}>Invoice Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
              <span style={{ color: '#6B7280' }}>Processing Fee (3.5%)</span>
              <span>${processingFee.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 700, borderTop: '1px solid #F0F0F0', marginTop: 4 }}>
              <span>Amount to Pay</span>
              <span>${totalWithFee.toFixed(2)}</span>
            </div>
            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              disabled={paying}
              onClick={handlePay}
            >
              {paying ? (
                <>
                  <Loader size={16} className="spin" /> Processing...
                </>
              ) : (
                <>
                  <CreditCard size={16} /> Pay Now &mdash; ${totalWithFee.toFixed(2)}
                </>
              )}
            </button>
          </div>
        ) : null}

        {/* Branding */}
        <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 24, fontSize: 12, color: '#D1D5DB' }}>
          Powered by AddFi
        </div>
      </div>
    </div>
  );
}
