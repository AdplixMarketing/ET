export default function PrivacyPolicy() {
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 32 }}>
          Last updated: March 19, 2026
        </p>

        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text)' }}>
          <p>
            This Privacy Policy explains how AddFi, operated by Milos Kasapovic ("we," "us," or "our"),
            collects, uses, and protects your information when you use our application at addfi.co.
          </p>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>1. Information We Collect</h2>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Information you provide:</h3>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Account information:</strong> Email address and password when you create an account</li>
            <li><strong>Business information:</strong> Business name, address, phone number, and logo</li>
            <li><strong>Financial data:</strong> Transactions (income and expenses), amounts, dates, categories, vendors, clients, payment methods, and descriptions</li>
            <li><strong>Invoice data:</strong> Client names, email addresses, line items, amounts, and payment status</li>
            <li><strong>Client data:</strong> Names, email addresses, phone numbers, companies, and addresses of your clients</li>
            <li><strong>Receipts:</strong> Images of receipts you upload or scan</li>
            <li><strong>Job data:</strong> Job titles, dates, locations, and notes</li>
          </ul>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Information collected automatically:</h3>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Usage analytics:</strong> We use Vercel Analytics to collect anonymized page view and performance data. This does not include personal information or financial data.</li>
            <li><strong>Log data:</strong> IP address, browser type, and access times for security and troubleshooting purposes</li>
          </ul>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Provide and maintain the AddFi service</li>
            <li>Process your transactions, invoices, and reports</li>
            <li>Send invoices to your clients on your behalf</li>
            <li>Process subscription payments through Stripe</li>
            <li>Process invoice payments from your clients through Stripe</li>
            <li>Scan and extract data from receipt images</li>
            <li>Send you service-related communications (account verification, password resets, payment receipts)</li>
            <li>Improve the application and fix issues</li>
            <li>Protect against fraud and unauthorized access</li>
          </ul>
          <p style={{ marginTop: 8 }}>
            <strong>We do not sell, rent, or share your personal or financial data with third parties for
            marketing purposes. Ever.</strong>
          </p>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>3. Third-Party Services</h2>
          <p>We use the following third-party services that may process your data:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><strong>Stripe:</strong> Payment processing for subscriptions and invoice payments. Stripe handles all payment card data directly — we never store your card numbers. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Stripe's Privacy Policy</a>.</li>
            <li><strong>Vercel:</strong> Application hosting and anonymized analytics. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Vercel's Privacy Policy</a>.</li>
            <li><strong>Railway:</strong> Backend server hosting. See <a href="https://railway.app/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Railway's Privacy Policy</a>.</li>
            <li><strong>Cloudflare R2:</strong> Secure storage for uploaded receipt images.</li>
            <li><strong>SendGrid:</strong> Email delivery for invoices, verification, and notifications. See <a href="https://www.twilio.com/en-us/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Twilio/SendGrid's Privacy Policy</a>.</li>
          </ul>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>4. Data Security</h2>
          <p>We take reasonable measures to protect your data, including:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Encrypted connections (HTTPS/TLS) for all data in transit</li>
            <li>Hashed passwords — we cannot see or access your password</li>
            <li>User-scoped data access — your data is isolated and only accessible to your account</li>
            <li>Secure cloud infrastructure with our hosting providers</li>
          </ul>
          <p style={{ marginTop: 8 }}>
            However, no method of electronic storage or transmission is 100% secure. We cannot guarantee
            absolute security of your data.
          </p>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>5. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. If you delete your account, we will
            delete your personal and financial data within 30 days, except where we are required to retain
            it by law. You can request a full export of your data at any time through the app's settings.
          </p>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><strong>Access:</strong> Request a copy of all data we hold about you</li>
            <li><strong>Export:</strong> Download your data at any time through the app</li>
            <li><strong>Correction:</strong> Update or correct your personal information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Portability:</strong> Receive your data in a standard format</li>
          </ul>
          <p style={{ marginTop: 8 }}>
            To exercise any of these rights, contact us at support@addfi.co.
          </p>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>7. Cookies and Local Storage</h2>
          <p>
            AddFi uses browser local storage to maintain your login session and preferences (such as
            dark/light theme). We do not use third-party tracking cookies. Vercel Analytics uses
            anonymized, cookie-free analytics that do not track individual users.
          </p>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>8. Children's Privacy</h2>
          <p>
            AddFi is not intended for use by anyone under the age of 18. We do not knowingly collect
            personal information from children. If we learn that we have collected data from a child
            under 18, we will delete it promptly.
          </p>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>9. California Residents</h2>
          <p>
            If you are a California resident, you have additional rights under the California Consumer
            Privacy Act (CCPA), including the right to know what personal information we collect, request
            its deletion, and opt out of any sale of personal information. We do not sell personal
            information. To exercise your rights, contact support@addfi.co.
          </p>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes
            by posting the updated policy on the app and updating the "Last updated" date. Your continued
            use of AddFi after changes are posted constitutes acceptance of the revised policy.
          </p>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 28, marginBottom: 12 }}>11. Contact</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or how your data is handled,
            contact us at:<br />
            <strong>Email:</strong> support@addfi.co
          </p>
        </div>
      </div>
    </div>
  );
}
