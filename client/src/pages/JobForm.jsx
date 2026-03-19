import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2 } from 'lucide-react';

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '', client_id: '', scheduled_date: '', scheduled_time: '',
    location: '', notes: '', status: 'scheduled',
  });
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/clients').then((res) => setClients(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      api.get(`/jobs/${id}`).then((res) => {
        const j = res.data;
        setForm({
          title: j.title || '',
          client_id: j.client_id || '',
          scheduled_date: j.scheduled_date?.slice(0, 10) || '',
          scheduled_time: j.scheduled_time?.slice(0, 5) || '',
          location: j.location || '',
          notes: j.notes || '',
          status: j.status || 'scheduled',
        });
      }).catch(() => toast.error('Failed to load job'));
    }
  }, [id, isEdit]);

  const handleClientChange = (clientId) => {
    setForm((prev) => {
      const updated = { ...prev, client_id: clientId };
      if (clientId && !prev.location) {
        const client = clients.find((c) => c.id === clientId);
        if (client?.address) updated.location = client.address;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Enter a job title'); return; }
    if (!form.scheduled_date) { toast.error('Pick a date'); return; }
    setSaving(true);
    try {
      const payload = { ...form, client_id: form.client_id || null };
      if (isEdit) {
        await api.put(`/jobs/${id}`, payload);
        toast.success('Job updated');
      } else {
        await api.post('/jobs', payload);
        toast.success('Job scheduled');
      }
      navigate('/jobs');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this job?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job deleted');
      navigate('/jobs');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>{isEdit ? 'Edit Job' : 'New Job'}</h1>
          {isEdit && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} onClick={handleDelete}>
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Job Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. AC repair, Kitchen remodel" required />
            </div>

            <div className="form-group">
              <label>Client</label>
              <select value={form.client_id} onChange={(e) => handleClientChange(e.target.value)}>
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} required />
            </div>

            {isEdit && (
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Time</label>
              <input type="time" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Job site address" />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Job details, special instructions, etc." />
            </div>
          </div>

          <button className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Job' : 'Schedule Job'}
          </button>
        </form>
      </div>
    </div>
  );
}
