import { Link } from 'react-router-dom';
import { BRAND } from '../brand';

export default function Privacy() {
  return (
    <div className="shell legal">
      <h1>Privacy Policy</h1>
      <p className="muted">Template — review with counsel before launch.</p>

      <p>
        This Privacy Policy explains how {BRAND.name} (the "Service") collects, uses, and protects
        your information when you use the Service. By using {BRAND.name}, you agree to this policy.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account data</strong> — your name and email address.</li>
        <li><strong>Subscription data</strong> — your plan, status, and billing history.</li>
        <li><strong>Content you submit</strong> — comments and other content you post.</li>
        <li>
          <strong>Payment data</strong> — handled by our payment processor, Stripe. We do not
          store your full card details.
        </li>
        <li>
          <strong>Usage and technical data</strong> — basic logs needed to operate and secure
          the Service.
        </li>
      </ul>

      <h2>2. How we use your information</h2>
      <p>
        We use your information to provide and maintain the Service, process subscriptions,
        deliver the daily briefing and alerts, respond to support requests, secure the Service,
        and comply with legal obligations.
      </p>

      <h2>3. How we share information</h2>
      <p>
        We do not sell your personal information. We share it only with service providers who
        help us operate the Service — such as Stripe for payments and our email delivery
        provider — and when required by law or to protect our rights.
      </p>

      <h2>4. Cookies and authentication</h2>
      <p>
        We use a secure, HttpOnly authentication cookie to keep you signed in. We do not use it
        to track you across other websites.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We keep your information for as long as your account is active or as needed to provide
        the Service and meet legal, tax, or accounting requirements. When no longer needed, we
        delete or anonymize it.
      </p>

      <h2>6. Your rights and choices</h2>
      <p>
        You may access or update your account information, and you may request deletion of your
        account and associated data at any time. To do so, use our{' '}
        <Link to="/delete-account">account deletion request</Link> page. We will verify the
        request and process it in accordance with applicable law.
      </p>

      <h2>7. Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect your information. No
        method of transmission or storage is completely secure, however, and we cannot
        guarantee absolute security.
      </p>

      <h2>8. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be reflected by the
        "Last updated" date above.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about your privacy? Email{' '}
        <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.
      </p>
    </div>
  );
}
