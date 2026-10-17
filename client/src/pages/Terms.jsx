import { Link } from 'react-router-dom';
import { BRAND, OPERATOR, LEGAL_UPDATED } from '../brand';

export default function Terms() {
  return (
    <div className="shell legal">
      <h1>Terms of Service</h1>
      <p className="muted">Last updated: {LEGAL_UPDATED}</p>

      <p>
        {BRAND.name} ({BRAND.short}) is operated by {OPERATOR.name} ("{OPERATOR.dba}," "we,"
        "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the{' '}
        {BRAND.short} website and mobile apps (the "Service"). By using the Service or creating an
        account, you agree to these Terms and our <Link to="/privacy">Privacy Policy</Link>. If you
        do not agree, do not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old and able to enter into a legally binding agreement to
        create an account. If you use the Service on behalf of an organization, you represent that
        you have the authority to bind that organization to these Terms.
      </p>

      <h2>2. The Service</h2>
      <p>
        {BRAND.name} is a news service covering artificial intelligence and superintelligence.
        Stories are gathered from public sources, summarized by an automated pipeline, and curated
        by editors. The Service is free to use and is supported by advertising. A free account lets
        you post in discussions, save stories, and receive the Daily Brief by email; the app can
        also send breaking-news alerts. The Service is provided for informational purposes only.
      </p>

      <h2>3. Accounts</h2>
      <p>
        You must provide accurate information and keep your login credentials confidential. You are
        responsible for all activity under your account and should notify us promptly of any
        unauthorized use. We are not liable for loss or damage arising from unauthorized access to
        your account.
      </p>

      <h2>4. Intellectual property</h2>
      <p>
        The Service, including its software, design, summaries, and the {BRAND.short} name and
        logo, belongs to {OPERATOR.dba} or its licensors. Articles linked from the Service belong to
        their original publishers. Content is licensed to you for personal, non-commercial use; you
        may not copy, resell, republish, or create derivative works from it without our written
        consent.
      </p>

      <h2>5. User content</h2>
      <p>
        You keep ownership of the comments and other content you submit ("User Content"). By
        posting it, you grant us a non-exclusive, worldwide, royalty-free license to host,
        reproduce, display, and adapt it as needed to operate and improve the Service. You are
        solely responsible for your User Content and represent that you have the rights to grant
        this license. We may remove content that violates these Terms.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the Service for unlawful, abusive, harassing, or fraudulent activity;</li>
        <li>post spam, or content that infringes others' rights;</li>
        <li>interfere with or disrupt the Service, or attempt to gain unauthorized access to any system or network;</li>
        <li>scrape or redistribute content beyond your permitted use; or</li>
        <li>reverse engineer, decompile, or attempt to extract the source code of our software.</li>
      </ul>
      <p>Violations may lead to removal of content or suspension or termination of your account.</p>

      <h2>7. Automated summaries and no advice</h2>
      <p>
        Summaries and analysis may be generated with the help of AI systems and can contain errors.
        Always check the original source linked from each story. Nothing on the Service is legal,
        financial, or investment advice.
      </p>

      <h2>8. Advertising and third parties</h2>
      <p>
        The Service displays labeled advertisements and relies on third-party providers such as
        hosting, email, push notification, and advertising services. We are not responsible for
        third-party ads, the products they promote, linked third-party websites, or the operation
        and policies of those providers.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The Service is provided "as is" and "as available," without warranties of any kind, express
        or implied, including accuracy, completeness, timeliness, merchantability, fitness for a
        particular purpose, and non-infringement. We do not guarantee that the Service will be
        uninterrupted, secure, or error-free.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {OPERATOR.dba} and its affiliates will not be liable
        for any indirect, incidental, special, consequential, or punitive damages, or for any loss
        of profits, data, or goodwill, arising from your use of or reliance on the Service. Our total
        liability for any claim will not exceed the amount you paid us for the Service in the twelve
        (12) months before the claim.
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless {OPERATOR.dba}, its affiliates, and employees from
        any claims, damages, losses, liabilities, or expenses (including attorney fees) arising from
        your use of the Service, your User Content, or your violation of these Terms.
      </p>

      <h2>12. Termination</h2>
      <p>
        You may stop using the Service at any time and may request deletion of your account and data
        on our <Link to="/delete-account">account deletion request</Link> page. We may suspend or
        terminate your access at any time, without prior notice, if you breach these Terms or misuse
        the Service. Your right to use the Service then ends immediately.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of California, without regard to its
        conflict-of-law principles. Any dispute will be resolved exclusively in the state or federal
        courts located in San Bernardino County, California.
      </p>

      <h2>14. Changes to these Terms</h2>
      <p>
        We may update these Terms at any time. The latest version will always be on this page, with
        the "Last updated" date above, and your continued use of the Service means you accept the
        revised Terms.
      </p>

      <h2>15. Contact</h2>
      <p>
        For questions, support, or legal inquiries, email{' '}
        <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>, or visit{' '}
        <a href={OPERATOR.website}>{OPERATOR.website.replace('https://', '')}</a>.
      </p>
      <p>
        {OPERATOR.name} d/b/a {OPERATOR.dba}
      </p>
    </div>
  );
}
