import { Link } from 'react-router-dom';
import { Camera, FileText, BarChart3, Check, X } from 'lucide-react';
import styles from './LandingPage.module.css';

const features = [
  {
    icon: Camera,
    title: 'Receipt Scanning',
    desc: 'Snap a photo of any receipt and let AI extract the details automatically.',
  },
  {
    icon: FileText,
    title: 'Invoicing',
    desc: 'Create and send professional invoices to your clients in seconds.',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    desc: 'Visual breakdowns of income, expenses, and trends at a glance.',
  },
];

const plans = [
  {
    name: 'Free',
    desc: 'For individuals getting started',
    price: '$0',
    period: '/mo',
    yearly: null,
    cta: 'Start Free',
    ctaClass: 'btn btn-outline',
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
    ctaClass: 'btn btn-primary',
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

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>FlowFi</div>
        <div className={styles.navButtons}>
          <Link to="/login" className="btn btn-outline">Log In</Link>
          <Link to="/register" className="btn btn-primary">Sign Up</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Financial tracking made simple</h1>
          <p className={styles.heroSubtitle}>
            Track expenses, scan receipts, send invoices, and understand your
            finances — all in one place.
          </p>
          <Link to="/register" className={`btn btn-primary ${styles.heroCta}`}>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Everything you need</h2>
        <p className={styles.sectionSubtitle}>
          Powerful tools to keep your finances organized
        </p>
        <div className={styles.featureGrid}>
          {features.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <f.icon size={28} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricing}>
        <div className={styles.pricingInner}>
          <h2 className={styles.sectionTitle}>Simple pricing</h2>
          <p className={styles.sectionSubtitle}>
            Start free, upgrade when you're ready
          </p>
          <div className={styles.pricingGrid}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`${styles.pricingCard} ${plan.pro ? styles.pricingCardPro : ''}`}
              >
                {plan.pro && <div className={styles.proBadge}>Most Popular</div>}
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
                <Link to="/register" className={`${plan.ctaClass} ${styles.pricingCta}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className={styles.footerCta}>
        <h2 className={styles.footerCtaTitle}>Ready to simplify your finances?</h2>
        <p className={styles.footerCtaSubtitle}>
          Join thousands of businesses tracking smarter with FlowFi.
        </p>
        <Link to="/register" className="btn btn-primary" style={{ fontSize: 17, padding: '16px 36px' }}>
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        &copy; {new Date().getFullYear()} FlowFi. All rights reserved.
      </footer>
    </div>
  );
}
