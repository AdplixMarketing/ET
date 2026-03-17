import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FileText, CheckCircle, CreditCard, Loader, Lock } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || '';
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function PaymentForm({ token, total, processingFee, totalWithFee, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [cardError, setCardError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setCardError(null);

    try {
      // 1. Create payment intent on server
      const { data } = await axios.post(`${baseURL}/api/portal/${token}/pay`);

      // 2. Confirm payment with card details
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        setCardError(error.message);
        toast.error(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
        toast.success('Payment successful!');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Payment failed. Please try again.';
      setCardError(msg);
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 16px', fontSize: 16, fontWeight: 700, borderTop: '1px solid #F0F0F0', marginTop: 4 }}>
        <span>Amount to Pay</span>
        <span>${totalWithFee.toFixed(2)}</span>
      </div>

      {/* Card Input */}
      <div style={{
        padding: '14px 12px',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        marginBottom: 12,
        background: '#FAFAFA',
      }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1F2937',
                '::placeholder': { color: '#9CA3AF' },
              },
              invalid: { color: '#EF4444' },
            },
          }}
          onChange={(e) => {
            if (e.error) setCardError(e.error.message);
            else setCardError(null);
          }}
        />
      </div>

      {cardError && (
        <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{cardError}</div>
      )}

      <button
        type="submit"
        disabled={paying || !stripe}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: paying ? '#9CA3AF' : '#4A90E2',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 600,
          cursor: paying ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {paying ? (
          <>
            <Loader size={18} className="spin" /> Processing...
          </>
        ) : (
          <>
            <Lock size={16} /> Pay ${totalWithFee.toFixed(2)}
          </>
        )}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, fontSize: 11, color: '#9CA3AF' }}>
        <Lock size={10} /> Payments secured by Stripe
      </div>
    </form>
  );
}

function PortalContent() {
  const { token } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F3F4F6' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F3F4F6' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <FileText size={48} strokeWidth={1} style={{ color: '#8E8E93', marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1F2937' }}>Invoice Unavailable</h2>
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', background: '#F3F4F6', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        {/* Invoice Card */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ height: 4, background: 'linear-gradient(90deg, #4A90E2, #7B61FF)' }} />

          <div style={{ padding: '28px 24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1F2937' }}>
                  {invoice.business_name || 'Invoice'}
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>INVOICE</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>{invoice.invoice_number}</div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #F0F0F0', margin: '16px 0' }} />

            {/* Bill To + Dates */}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: 1, marginBottom: 4 }}>BILL TO</div>
                <div style={{ fontWeight: 600, color: '#1F2937' }}>{invoice.client_name}</div>
                {invoice.client_email && (
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{invoice.client_email}</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>ISSUE DATE</div>
                  <div style={{ fontSize: 14, color: '#1F2937' }}>
                    {format(new Date(invoice.issue_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', letterSpacing: 1 }}>DUE DATE</div>
                  <div style={{ fontSize: 14, color: '#1F2937' }}>
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
                      <td style={{ padding: '10px 4px', color: '#1F2937' }}>{item.description}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', color: '#1F2937' }}>{item.quantity}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', color: '#1F2937' }}>${parseFloat(item.rate).toFixed(2)}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', color: '#1F2937' }}>${parseFloat(item.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ marginTop: 20, borderTop: '2px solid #F0F0F0', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
                <span style={{ color: '#6B7280' }}>Subtotal</span>
                <span style={{ color: '#1F2937' }}>${subtotal.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
                  <span style={{ color: '#6B7280' }}>Tax ({invoice.tax_rate}%)</span>
                  <span style={{ color: '#1F2937' }}>${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 18, fontWeight: 700, color: '#1F2937' }}>
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

          <div style={{ padding: '14px 24px', background: '#F9FAFB', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
            Thank you for your business.
          </div>
        </div>

        {/* Payment Section */}
        {paid || invoice.status === 'paid' ? (
          <div style={{
            marginTop: 16, padding: '20px 24px', background: '#ECFDF5', borderRadius: 12,
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle size={32} style={{ color: '#34C759' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#065F46' }}>Payment Complete</div>
            <div style={{ fontSize: 14, color: '#047857' }}>This invoice has been paid. Thank you!</div>
          </div>
        ) : invoice.payment_enabled && stripePromise ? (
          <div style={{
            marginTop: 16, padding: '24px', background: '#fff',
            borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <CreditCard size={20} style={{ color: '#4A90E2' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>Pay Online</span>
            </div>
            <Elements stripe={stripePromise}>
              <PaymentForm
                token={token}
                total={total}
                processingFee={processingFee}
                totalWithFee={totalWithFee}
                onSuccess={() => setPaid(true)}
              />
            </Elements>
          </div>
        ) : invoice.payment_enabled && !stripePromise ? (
          <div style={{
            marginTop: 16, padding: '20px 24px', background: '#FEF3C7', borderRadius: 12, textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, color: '#92400E' }}>Online payment is not available at this time.</div>
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

export default function InvoicePortal() {
  return <PortalContent />;
}
