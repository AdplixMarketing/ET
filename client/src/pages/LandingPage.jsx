import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, FileText, BarChart3, Check, X, ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';
import styles from './LandingPage.module.css';

const features = [
  {
    icon: Camera,
    title: 'Receipt Scanning',
    desc: 'Snap a photo of any receipt and let AI extract the details automatically.',
    gradient: 'linear-gradient(135deg, #4A90E2, #6C5CE7)',
  },
  {
    icon: FileText,
    title: 'Invoicing',
    desc: 'Create and send professional invoices to your clients in seconds.',
    gradient: 'linear-gradient(135deg, #00C853, #00B4D8)',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    desc: 'Visual breakdowns of income, expenses, and trends at a glance.',
    gradient: 'linear-gradient(135deg, #FF9500, #FF6B6B)',
  },
];

const stats = [
  { icon: Zap, value: 'Instant', label: 'Receipt scanning' },
  { icon: Shield, value: '256-bit', label: 'Encryption' },
  { icon: TrendingUp, value: 'Real-time', label: 'Analytics' },
];

const plans = [
  {
    name: 'Free',
    desc: 'For individuals getting started',
    price: '$0',
    period: '/mo',
    yearly: null,
    cta: 'Start Free',
    ctaStyle: 'outline',
    pro: false,
    features: [
      { text: '15 transactions / month', ok: true },
      { text: '5 receipt scans / month', ok: true },
      { text: 'Basic reports', ok: true },
      { text: 'Unlimited invoices', ok: false },
      { text: 'Priority support', ok: false },
    ],
  },
  {
    name: 'FlowFi Pro',
    desc: 'For growing businesses',
    price: '$6.99',
    period: '/mo',
    yearly: '$4.99/mo billed yearly',
    cta: 'Start FlowFi Pro',
    ctaStyle: 'primary',
    pro: true,
    features: [
      { text: 'Unlimited transactions', ok: true },
      { text: 'Unlimited receipt scans', ok: true },
      { text: 'Advanced reports', ok: true },
      { text: 'Unlimited invoices', ok: true },
      { text: 'Priority support', ok: true },
    ],
  },
];

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

function RevealSection({ children, className, ...props }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={`${styles.reveal} ${className || ''}`} {...props}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>FlowFi</div>
        <div className={styles.navButtons}>
          <Link to="/login" className={styles.navLogin}>Log In</Link>
          <Link to="/register" className={styles.navSignup}>Sign Up</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGrid}></div>
        <div className={styles.heroOrb1}></div>
        <div className={styles.heroOrb2}></div>
        <div className={styles.heroOrb3}></div>
        <div className={styles.heroContent}>
          <div className={styles.heroPill}>
            <Zap size={14} />
            AI-powered financial tracking
          </div>
          <h1 className={styles.heroTitle}>
            Financial tracking<br />
            <span className={styles.heroGradientText}>made simple</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Track expenses, scan receipts, send invoices, and understand your
            finances — all in one beautiful place.
          </p>
          <div className={styles.heroActions}>
            <Link to="/register" className={styles.heroCta}>
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className={styles.heroCtaSecondary}>
              Log In
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          {stats.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <s.icon size={20} />
              <div>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <RevealSection>
          <h2 className={styles.sectionTitle}>Everything you need</h2>
          <p className={styles.sectionSubtitle}>
            Powerful tools to keep your finances organized
          </p>
        </RevealSection>
        <div className={styles.featureGrid}>
          {features.map((f, i) => (
            <RevealSection key={f.title} style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon} style={{ background: f.gradient }}>
                  <f.icon size={26} color="#fff" />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className={styles.featureGlow} style={{ background: f.gradient }}></div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricing}>
        <div className={styles.pricingInner}>
          <RevealSection>
            <h2 className={styles.sectionTitle}>Simple pricing</h2>
            <p className={styles.sectionSubtitle}>
              Start free, upgrade when you're ready
            </p>
          </RevealSection>
          <div className={styles.pricingGrid}>
            {plans.map((plan, i) => (
              <RevealSection key={plan.name} style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className={`${styles.pricingCard} ${plan.pro ? styles.pricingCardPro : ''}`}>
                  {plan.pro && <div className={styles.proBadge}>Most Popular</div>}
                  {plan.pro && <div className={styles.proGlow}></div>}
                  <div className={styles.pricingName}>{plan.name}</div>
                  <div className={styles.pricingDesc}>{plan.desc}</div>
                  <div className={styles.pricingPrice}>
                    {plan.price}
                    <span>{plan.period}</span>
                  </div>
                  {plan.yearly ? (
                    <div className={styles.pricingYearly}>{plan.yearly}</div>
                  ) : (
                    <div className={styles.pricingYearly}>&nbsp;</div>
                  )}
                  <ul className={styles.pricingFeatures}>
                    {plan.features.map((feat) => (
                      <li key={feat.text}>
                        {feat.ok ? (
                          <Check size={18} className={styles.checkIcon} />
                        ) : (
                          <X size={18} className={styles.xIcon} />
                        )}
                        {feat.text}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className={`${styles.pricingCta} ${plan.pro ? styles.pricingCtaPro : styles.pricingCtaFree}`}
                  >
                    {plan.cta}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className={styles.footerCta}>
        <div className={styles.footerCtaOrb}></div>
        <RevealSection>
          <h2 className={styles.footerCtaTitle}>Ready to simplify your finances?</h2>
          <p className={styles.footerCtaSubtitle}>
            Join thousands of businesses tracking smarter with FlowFi.
          </p>
          <Link to="/register" className={styles.footerCtaBtn}>
            Get Started Free
            <ArrowRight size={18} />
          </Link>
        </RevealSection>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        &copy; {new Date().getFullYear()} FlowFi. All rights reserved.
      </footer>
    </div>
  );
}
