import { Link } from 'react-router-dom';
import { BRAND } from '../brand';

export default function Terms() {
  return (
    <div className="shell legal">
      <h1>Terms of Service</h1>
      <p className="muted">Template — review with counsel before launch.</p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of {BRAND.name} (the
        "Service"). By creating an account, subscribing, or otherwise using the Service, you
        agree to these Terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. The service</h2>
      <p>
        {BRAND.name} is a news service covering artificial intelligence and superintelligence.
        Stories are gathered from public sources, summarized by an automated pipeline, and curated
        by editors. Reading is free; Premium membership adds the Daily Brief, extended analysis,
        and posting in discussions. The Service is provided for informational purposes only.
      </p>

      <h2>2. Subscriptions and payment</h2>
      <p>
        Premium is offered as a recurring monthly subscription.
        Payments are processed by our third‑party payment provider, Stripe; we do not store
        your full card details. Subscriptions renew automatically until cancelled. You may
        cancel at any time, and cancellation takes effect at the end of the current billing
        period. Except where required by law, fees already paid are non‑refundable.
      </p>

      <h2>3. Accounts and eligibility</h2>
      <p>
        You must provide accurate information, be at least 18 years old, and keep your
        credentials secure. You are responsible for all activity under your account. Notify
        us promptly of any unauthorized use.
      </p>

      <h2>4. Acceptable use</h2>
      <p>
        You agree not to misuse the Service, including by attempting to access it without
        authorization, scraping or redistributing content beyond your permitted use,
        interfering with its operation, or using it to violate any law. Subscription content
        is licensed to you for your own internal use and may not be resold or republished.
      </p>

      <h2>5. User content</h2>
      <p>
        The Service may let you post comments or other content. You retain ownership of what
        you submit but grant us a license to host and display it in connection with the
        Service. You are responsible for your content, and we may remove content that
        violates these Terms.
      </p>

      <h2>6. Automated summaries and no advice</h2>
      <p>
        Summaries and analysis may be generated with the help of AI systems and can contain errors.
        Always check the original source linked from each story. Nothing on the Service is legal, financial, or investment advice.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        The Service is provided "as is" and "as available" without warranties of any kind,
        express or implied, including accuracy, completeness, timeliness, merchantability, or
        fitness for a particular purpose.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {BRAND.name} and its operators will not be liable
        for any indirect, incidental, special, consequential, or punitive damages, or for any
        loss arising from your use of or reliance on the Service. Our total liability will not
        exceed the amount you paid us in the twelve months before the claim.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate access if you
        breach these Terms or to protect the Service. You may request deletion of your account
        and data at any time via our <Link to="/delete-account">account deletion request</Link> page.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these Terms from time to time. Material changes will be reflected by the
        date of the change, and continued use after changes constitutes acceptance.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms? Email{' '}
        <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.
      </p>
    </div>
  );
}
