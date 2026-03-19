import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, Crown, Sparkles, Menu } from 'lucide-react';
import styles from './Pricing.module.css';

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

const plans = [
  {
    name: 'Free',
    desc: 'For individuals getting started',
    price: '$0',
    period: '/mo',
    yearly: null,
    cta: 'Start Free',
    tier: null,
    icon: null,
  },
  {
    name: 'AddFi Pro',
    desc: 'For growing businesses',
    price: '$7.99',
    period: '/mo',
    yearly: '$5.99/mo billed yearly',
    cta: 'Start Pro',
    tier: 'pro',
    icon: Sparkles,
    popular: true,
  },
  {
    name: 'AddFi Max',
    desc: 'For scaling businesses',
    price: '$79',
    period: '/mo',
    yearly: '$59/mo billed yearly',
    cta: 'Start Max',
    tier: 'max',
    icon: Crown,
  },
];

const comparisonCategories = [
  {
    category: 'Transactions',
    rows: [
      { feature: 'Transactions per month', free: '15', pro: '200', max: 'Unlimited' },
      { feature: 'Receipt scans per month', free: '5', pro: '80', max: 'Unlimited' },
      { feature: 'Custom categories', free: false, pro: true, max: true },
      { feature: 'Auto-categorization', free: false, pro: false, max: true },
      { feature: 'Duplicate detection', free: false, pro: false, max: true },
      { feature: 'Data import (CSV)', free: false, pro: false, max: true },
      { feature: 'Recurring transactions', free: false, pro: false, max: true },
    ],
  },
  {
    category: 'Invoicing',
    rows: [
      { feature: 'Create & send invoices', free: false, pro: true, max: true },
      { feature: 'PDF generation', free: false, pro: true, max: true },
      { feature: 'Custom invoice templates', free: false, pro: false, max: true },
      { feature: 'Remove AddFi branding', free: false, pro: false, max: true },
      { feature: 'Client payment portal', free: false, pro: false, max: true },
      { feature: 'Recurring invoices', free: false, pro: false, max: true },
      { feature: 'Automatic payment reminders', free: false, pro: false, max: true },
    ],
  },
  {
    category: 'Reports & Analytics',
    rows: [
      { feature: 'Profit & Loss report', free: true, pro: true, max: true },
      { feature: 'Export as CSV / PDF', free: false, pro: true, max: true },
      { feature: 'Cash flow tracking', free: false, pro: false, max: true },
      { feature: 'Tax summary by quarter', free: false, pro: false, max: true },
      { feature: 'Expense trends', free: false, pro: false, max: true },
      { feature: 'Revenue by client', free: false, pro: false, max: true },
      { feature: 'Period comparison', free: false, pro: false, max: true },
      { feature: 'Financial forecasting', free: false, pro: false, max: true },
    ],
  },
  {
    category: 'Business Tools',
    rows: [
      { feature: 'Client database', free: false, pro: false, max: true },
      { feature: 'Multi-business support', free: false, pro: false, max: true },
      { feature: 'Automation rules', free: false, pro: false, max: true },
      { feature: 'Stripe payment processing', free: false, pro: false, max: true },
    ],
  },
  {
    category: 'General',
    rows: [
      { feature: 'Mobile-friendly PWA', free: true, pro: true, max: true },
      { feature: 'Dark mode', free: true, pro: true, max: true },
      { feature: 'Data export (GDPR)', free: true, pro: true, max: true },
      { feature: 'Email support', free: true, pro: true, max: true },
    ],
  },
];

const faqs = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes. Upgrade or downgrade whenever you want. When you upgrade, you get instant access. When you downgrade, you keep your current plan until the billing period ends. Your data is never deleted.',
  },
  {
    q: 'What happens when I hit my transaction limit?',
    a: "You won't lose any data. You just won't be able to add new transactions until the next month or until you upgrade. Your existing transactions and reports stay exactly as they are.",
  },
  {
    q: 'Is there a contract?',
    a: 'No contracts. Both Pro and Max are month-to-month (or yearly if you choose the discount). Cancel anytime — no questions asked.',
  },
  {
    q: 'How does the 3.5% payment processing work?',
    a: 'When a Max user enables online payments on an invoice, their client can pay with a credit card through a secure portal. The 3.5% fee is added to the invoice total so your client covers it, not you.',
  },
  {
    q: 'Do I need to download an app?',
    a: 'No. AddFi works in your browser on any device. You can add it to your home screen for a native app experience — no app store required.',
  },
];

export default function Pricing() {
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
          <Link to="/features" className={styles.navLogin}>Features</Link>
          <Link to="/login" className={styles.navLogin}>Log In</Link>
          <Link to="/register" className={styles.navSignup}>Sign Up</Link>
        </div>
        <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/features" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Features</Link>
          <Link to="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Log In</Link>
          <Link to="/register" className={styles.mobileSignup} onClick={() => setMenuOpen(false)}>Sign Up</Link>
        </div>
      )}

      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Simple, transparent pricing</h1>
        <p className={styles.heroSubtitle}>Start free. Upgrade when your business needs more.</p>
      </section>

      {/* Pricing Cards */}
      <section className={styles.cardsSection}>
        <div className={styles.cardsGrid}>
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.1}>
              <div className={`${styles.card} ${plan.popular ? styles.cardPopular : ''} ${plan.tier === 'max' ? styles.cardMax : ''}`}>
                {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}
                <div className={styles.cardName}>
                  {plan.icon && <plan.icon size={18} />} {plan.name}
                </div>
                <div className={styles.cardDesc}>{plan.desc}</div>
                <div className={styles.cardPrice}>
                  {plan.price}<span>{plan.period}</span>
                </div>
                {plan.yearly && <div className={styles.cardYearly}>{plan.yearly}</div>}
                {!plan.yearly && <div className={styles.cardYearly}>&nbsp;</div>}
                <Link to="/register" className={`${styles.cardCta} ${plan.tier ? styles.cardCtaPrimary : styles.cardCtaOutline}`}>
                  {plan.cta} <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className={styles.compareSection}>
        <Reveal>
          <h2 className={styles.sectionTitle}>Compare plans in detail</h2>
          <p className={styles.sectionSubtitle}>Everything included at every tier</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.featureCol}></th>
                  <th className={styles.planCol}>Free</th>
                  <th className={`${styles.planCol} ${styles.planColPro}`}>Pro</th>
                  <th className={`${styles.planCol} ${styles.planColMax}`}>Max</th>
                </tr>
              </thead>
              <tbody>
                {comparisonCategories.map((cat) => (
                  <>{/* Fragment with key on category row */}
                    <tr key={`cat-${cat.category}`} className={styles.categoryRow}>
                      <td colSpan={4}>{cat.category}</td>
                    </tr>
                    {cat.rows.map((row) => (
                      <tr key={row.feature}>
                        <td className={styles.featureCell}>{row.feature}</td>
                        <td className={styles.valueCell}>
                          {typeof row.free === 'boolean' ? (
                            row.free ? <Check size={18} className={styles.checkMark} /> : <X size={18} className={styles.xMark} />
                          ) : <span className={styles.textValue}>{row.free}</span>}
                        </td>
                        <td className={styles.valueCell}>
                          {typeof row.pro === 'boolean' ? (
                            row.pro ? <Check size={18} className={styles.checkMark} /> : <X size={18} className={styles.xMark} />
                          ) : <span className={styles.textValue}>{row.pro}</span>}
                        </td>
                        <td className={styles.valueCell}>
                          {typeof row.max === 'boolean' ? (
                            row.max ? <Check size={18} className={styles.checkMark} /> : <X size={18} className={styles.xMark} />
                          ) : <span className={styles.textValueMax}>{row.max}</span>}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <Reveal>
          <h2 className={styles.sectionTitle}>Frequently asked questions</h2>
        </Reveal>
        <div className={styles.faqGrid}>
          {faqs.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 0.06}>
              <div className={styles.faqCard}>
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaOrb}></div>
        <Reveal>
          <h2 className={styles.ctaTitle}>Ready to get started?</h2>
          <p className={styles.ctaSubtitle}>Free forever. No credit card required.</p>
          <Link to="/register" className={styles.ctaBtn}>
            Get Started Free <ArrowRight size={18} />
          </Link>
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
