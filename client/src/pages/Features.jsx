import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, FileText, BarChart3, ArrowRight, Users, LayoutTemplate,
  Repeat, Upload, Zap, Building2, CreditCard, TrendingUp, Shield,
  Clock, Smartphone, Receipt, PieChart, CalendarCheck, Menu, X,
} from 'lucide-react';
import styles from './Features.module.css';

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(styles.visible);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className, delay = 0, ...props }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={`${styles.reveal} ${className || ''}`} style={{ transitionDelay: `${delay}s`, ...props.style }} {...props}>
      {children}
    </div>
  );
}

const coreFeatures = [
  {
    icon: Receipt,
    title: 'AI Receipt Scanning',
    desc: 'Take a photo of any receipt and our AI instantly extracts the vendor, amount, and date. No manual entry needed — just snap and save. Works with gas stations, restaurants, office supplies, and everything in between.',
    gradient: 'linear-gradient(135deg, #4A90E2, #6C5CE7)',
  },
  {
    icon: FileText,
    title: 'Professional Invoicing',
    desc: 'Create clean, professional invoices in under 30 seconds. Add line items, set due dates, and send directly to your clients by email. Track which invoices are paid, pending, or overdue at a glance.',
    gradient: 'linear-gradient(135deg, #00C853, #00B4D8)',
  },
  {
    icon: BarChart3,
    title: 'Financial Reports',
    desc: 'See exactly where your money is going with visual breakdowns by category. Generate profit & loss reports for any date range and export them as CSV or PDF for your accountant or tax prep.',
    gradient: 'linear-gradient(135deg, #FF9500, #FF6B6B)',
  },
  {
    icon: PieChart,
    title: 'Expense Categories',
    desc: 'Organize every transaction with color-coded categories. Start with built-in defaults like Fuel, Supplies, and Marketing — or create your own custom categories that match how your business actually works.',
    gradient: 'linear-gradient(135deg, #845EF7, #E64980)',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    desc: 'Your data is protected with 256-bit encryption, the same standard used by major banks. Secure authentication with account lockout protection, email verification, and password policies keep your account safe.',
    gradient: 'linear-gradient(135deg, #339AF0, #20C997)',
  },
  {
    icon: Smartphone,
    title: 'Works on Any Device',
    desc: 'AddFi is a progressive web app — use it on your phone, tablet, or computer. Add it to your home screen for instant access that feels like a native app. No app store download required.',
    gradient: 'linear-gradient(135deg, #F06595, #FF922B)',
  },
];

const maxFeatures = [
  {
    icon: Users,
    title: 'Client Database',
    desc: 'Keep all your client info organized in one place. Track contact details, revenue history, and invoice count per client. When you create an invoice, just pick a client and their info auto-fills.',
  },
  {
    icon: CreditCard,
    title: 'Client Payment Portal',
    desc: 'Let clients pay invoices online with a credit card through a secure payment link. You get paid faster, they get a seamless experience. Powered by Stripe with a simple 3.5% processing fee.',
  },
  {
    icon: LayoutTemplate,
    title: 'Custom Invoice Templates',
    desc: 'Brand your invoices with custom colors, your logo, footer text, and layout options. Remove AddFi branding entirely. Make every invoice look like it came from a design studio.',
  },
  {
    icon: TrendingUp,
    title: 'Advanced Analytics',
    desc: 'Cash flow tracking, tax summaries by quarter, expense trends over time, revenue by client, period comparisons, and financial forecasting. Data-driven decisions for growing businesses.',
  },
  {
    icon: Repeat,
    title: 'Recurring Transactions & Invoices',
    desc: 'Set up recurring expenses or invoices that auto-create on a schedule. Monthly rent, weekly supplies, quarterly invoices — set it once and forget it.',
  },
  {
    icon: Upload,
    title: 'Data Import',
    desc: 'Import transactions from CSV files or bank statements. Map your columns, preview the data, and import hundreds of transactions in seconds instead of entering them one by one.',
  },
  {
    icon: Zap,
    title: 'Automation Rules',
    desc: 'Create rules that auto-categorize transactions based on vendor name or description. AddFi learns your patterns and handles the busywork so you can focus on your business.',
  },
  {
    icon: Building2,
    title: 'Multi-Business Support',
    desc: 'Run multiple businesses from one account. Each business gets its own transactions, invoices, clients, and reports. Switch between them instantly.',
  },
  {
    icon: Clock,
    title: 'Job Scheduling',
    desc: 'Book and manage jobs on a schedule. Assign clients, set dates and times, track job status from scheduled to completed, and link finished jobs to invoices.',
  },
];

const useCases = [
  {
    title: 'Contractors & Tradespeople',
    desc: 'Track job expenses, scan receipts from supply runs, invoice clients when the work is done, and see your profit margins — all from the job site.',
    icon: '🔧',
  },
  {
    title: 'Freelancers & Consultants',
    desc: 'Send professional invoices, track billable hours and expenses, get paid online through the client portal, and have clean records when tax season hits.',
    icon: '💻',
  },
  {
    title: 'Small Retail & Service',
    desc: 'Categorize daily expenses, track revenue by service type, manage multiple locations with multi-business support, and run monthly P&L reports.',
    icon: '🏪',
  },
  {
    title: 'Side Hustlers',
    desc: 'Just getting started? The free plan gives you everything you need to track income and expenses. Upgrade when your business grows — your data is always there.',
    icon: '🚀',
  },
];

export default function Features() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLogo}>
          <img src="/logo-512.png" alt="AddFi" className={styles.navLogoImg} />
          AddFi
        </Link>
        <div className={styles.navButtons}>
          <Link to="/pricing" className={styles.navLogin}>Pricing</Link>
          <Link to="/login" className={styles.navLogin}>Log In</Link>
          <Link to="/register" className={styles.navSignup}>Sign Up</Link>
        </div>
        <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/pricing" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Pricing</Link>
          <Link to="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Log In</Link>
          <Link to="/register" className={styles.mobileSignup} onClick={() => setMenuOpen(false)}>Sign Up</Link>
        </div>
      )}

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroOrb}></div>
        <h1 className={styles.heroTitle}>
          Built for businesses that<br />
          <span className={styles.gradientText}>don't need QuickBooks</span>
        </h1>
        <p className={styles.heroSubtitle}>
          AddFi is financial tracking stripped down to what actually matters. No accountant required. No learning curve. Just open it and go.
        </p>
      </section>

      {/* Core Features */}
      <section className={styles.section}>
        <Reveal>
          <h2 className={styles.sectionTitle}>What AddFi does</h2>
          <p className={styles.sectionSubtitle}>Simple, powerful tools that save you hours every week</p>
        </Reveal>
        <div className={styles.featureGrid}>
          {coreFeatures.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon} style={{ background: f.gradient }}>
                  <f.icon size={24} color="#fff" />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={styles.sectionAlt}>
        <Reveal>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <p className={styles.sectionSubtitle}>Up and running in under 2 minutes</p>
        </Reveal>
        <div className={styles.stepsGrid}>
          {[
            { step: '1', title: 'Sign up for free', desc: 'Create your account in seconds. No credit card needed.' },
            { step: '2', title: 'Add your first transaction', desc: 'Type it in manually or scan a receipt with your camera.' },
            { step: '3', title: 'See your finances clearly', desc: 'Your dashboard shows income, expenses, and trends instantly.' },
            { step: '4', title: 'Send invoices & get paid', desc: 'Create professional invoices and let clients pay online.' },
          ].map((s, i) => (
            <Reveal key={s.step} delay={i * 0.1}>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>{s.step}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Max Features */}
      <section className={styles.section}>
        <Reveal>
          <h2 className={styles.sectionTitle}>AddFi Max — for growing businesses</h2>
          <p className={styles.sectionSubtitle}>
            Everything in Pro, plus the tools you need when your business starts scaling
          </p>
        </Reveal>
        <div className={styles.maxGrid}>
          {maxFeatures.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <div className={styles.maxCard}>
                <f.icon size={22} className={styles.maxIcon} />
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className={styles.sectionAlt}>
        <Reveal>
          <h2 className={styles.sectionTitle}>Who uses AddFi</h2>
          <p className={styles.sectionSubtitle}>Built for real businesses, not corporations</p>
        </Reveal>
        <div className={styles.useCaseGrid}>
          {useCases.map((u, i) => (
            <Reveal key={u.title} delay={i * 0.1}>
              <div className={styles.useCaseCard}>
                <div className={styles.useCaseEmoji}>{u.icon}</div>
                <h3>{u.title}</h3>
                <p>{u.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Install Guide */}
      <section className={styles.section} id="install">
        <Reveal>
          <h2 className={styles.sectionTitle}>Add AddFi to your home screen</h2>
          <p className={styles.sectionSubtitle}>Get instant access like a native app — no app store needed</p>
        </Reveal>
        <div className={styles.installGrid}>
          <Reveal delay={0}>
            <div className={styles.installCard}>
              <div className={styles.installBadge}>iPhone / Safari</div>
              <ol className={styles.installSteps}>
                <li>Open <strong>addfi.co</strong> in Safari</li>
                <li>Tap the <strong>Share</strong> button (square with arrow) at the bottom</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong> in the top right</li>
              </ol>
              <p className={styles.installNote}>AddFi will appear on your home screen like a regular app</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className={styles.installCard}>
              <div className={styles.installBadge}>Android / Chrome</div>
              <ol className={styles.installSteps}>
                <li>Open <strong>addfi.co</strong> in Chrome</li>
                <li>Tap the <strong>three dots</strong> (⋮) in the top right</li>
                <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                <li>Tap <strong>"Add"</strong> to confirm</li>
              </ol>
              <p className={styles.installNote}>Chrome may also show an install banner automatically</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaOrb}></div>
        <Reveal>
          <h2 className={styles.ctaTitle}>Start tracking your finances today</h2>
          <p className={styles.ctaSubtitle}>Free forever. Upgrade when you're ready. No credit card required.</p>
          <div className={styles.ctaActions}>
            <Link to="/register" className={styles.ctaBtn}>
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/pricing" className={styles.ctaBtnSecondary}>
              See Pricing
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link to="/">Home</Link>
          <Link to="/features">Features</Link>
          <Link to="/pricing">Pricing</Link>
          <a href="mailto:support@addfi.co">Contact</a>
        </div>
        <p>&copy; {new Date().getFullYear()} AddFi. All rights reserved.</p>
      </footer>
    </div>
  );
}
