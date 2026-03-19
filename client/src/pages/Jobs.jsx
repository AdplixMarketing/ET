import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../hooks/useJobs';
import { useAuth } from '../hooks/useAuth';
import UpgradePrompt from '../components/ui/UpgradePrompt';
import Skeleton from '../components/ui/Skeleton';
import { Plus, CalendarCheck } from 'lucide-react';
import styles from './Jobs.module.css';

const statusFilters = [
  { key: '', label: 'All' },
  { key: 'scheduled', label: 'Upcoming' },
  { key: 'in_progress', label: 'Active' },
  { key: 'completed', label: 'Done' },
  { key: 'cancelled', label: 'Cancelled' },
];

const badgeClass = {
  scheduled: styles.badgeScheduled,
  in_progress: styles.badgeInProgress,
  completed: styles.badgeCompleted,
  cancelled: styles.badgeCancelled,
};

const badgeLabel = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const jobDate = new Date(d);
  jobDate.setHours(0, 0, 0, 0);

  if (jobDate.getTime() === today.getTime()) return 'Today';
  if (jobDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function Jobs() {
  const { user } = useAuth();
  const { jobs, loading, fetch } = useJobs();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (user?.plan === 'max') {
      fetch(filter ? { status: filter } : {});
    }
  }, [user, filter, fetch]);

  if (user?.plan !== 'max') {
    return (
      <div className="page">
        <div className="container">
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Schedule</h1>
          <UpgradePrompt message="Schedule and manage jobs, link them to clients and invoices. Available on AddFi Max." />
        </div>
      </div>
    );
  }

  // Group jobs by date
  const grouped = {};
  jobs.forEach((job) => {
    const key = job.scheduled_date?.slice(0, 10) || 'unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(job);
  });
  const dateKeys = Object.keys(grouped).sort();

  return (
    <div className="page">
      <div className="container">
        <div className={styles.header}>
          <h1>Schedule</h1>
          <button className="btn btn-primary" onClick={() => navigate('/jobs/new')}>
            <Plus size={18} /> New Job
          </button>
        </div>

        <div className={styles.filters}>
          {statusFilters.map((f) => (
            <button
              key={f.key}
              className={`${styles.chip} ${filter === f.key ? styles.chipActive : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ marginTop: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={72} style={{ borderRadius: 10, marginBottom: 8 }} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <CalendarCheck size={48} strokeWidth={1} />
            <p style={{ marginTop: 12 }}>{filter ? 'No jobs with this status' : 'No jobs scheduled yet'}</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/jobs/new')}>
              Schedule your first job
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {dateKeys.map((dateKey) => {
              const d = new Date(dateKey + 'T00:00:00');
              const month = d.toLocaleDateString('en-US', { month: 'short' });
              const day = d.getDate();

              return (
                <div key={dateKey}>
                  <div className={styles.dayHeader}>{formatDateLabel(dateKey)}</div>
                  {grouped[dateKey].map((job) => (
                    <div key={job.id} className={styles.item} onClick={() => navigate(`/jobs/${job.id}`)}>
                      <div className={styles.dateBox}>
                        <span className={styles.dateMonth}>{month}</span>
                        <span className={styles.dateDay}>{day}</span>
                      </div>
                      <div className={styles.info}>
                        <span className={styles.title}>{job.title}</span>
                        <span className={styles.meta}>
                          {job.client_name ? `${job.client_name} · ` : ''}
                          {job.scheduled_time ? formatTime(job.scheduled_time) : 'No time set'}
                          {job.end_time ? ` - ${formatTime(job.end_time)}` : ''}
                          {job.location ? ` · ${job.location}` : ''}
                        </span>
                      </div>
                      <span className={`${styles.badge} ${badgeClass[job.status]}`}>
                        {badgeLabel[job.status]}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
