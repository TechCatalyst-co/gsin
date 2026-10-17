import { Link } from 'react-router-dom';
import { BRAND, OPERATOR, LEGAL_UPDATED } from '../brand';

export default function Privacy() {
  return (
    <div className="shell legal">
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: {LEGAL_UPDATED}</p>

      <p>
        {BRAND.name} ({BRAND.short}) is operated by {OPERATOR.name} ("{OPERATOR.dba}," "we,"
        "our," or "us"). This Privacy Policy explains how we collect, use, share, and protect your
        information when you use the {BRAND.short} website and mobile apps (the "Service"). By
        using the Service, you agree to this policy.
      </p>

      <h2>1. Information we collect</h2>
      <p><strong>Information you provide</strong></p>
      <ul>
        <li><strong>Account data</strong> — your name, email address, and password (stored only as a secure hash).</li>
        <li><strong>Content you submit</strong> — comments and other content you post.</li>
        <li><strong>Preferences</strong> — topics you follow, saved stories, and whether you want the Daily Brief email.</li>
        <li><strong>Messages to us</strong> — what you send when you email us or request account deletion.</li>
      </ul>
      <p><strong>Information collected automatically</strong></p>
      <ul>
        <li>
          <strong>Technical and log data</strong> — IP address, browser or device type, operating
          system, pages requested, and referring URLs, used to operate, secure, and improve the
          Service.
        </li>
        <li>
          <strong>Push notifications</strong> — if you turn on breaking-news alerts in the app,
          your device is registered with Google Firebase Cloud Messaging to receive them. We do not
          store your device token or link alerts to your account, and you can turn alerts off at
          any time in the app or your device settings.
        </li>
      </ul>

      <h2>2. How we use your information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>provide, maintain, and improve the Service;</li>
        <li>deliver the Daily Brief email and breaking-news alerts you opt into;</li>
        <li>display and moderate comments;</li>
        <li>respond to questions and support requests;</li>
        <li>secure the Service and prevent abuse; and</li>
        <li>comply with legal obligations.</li>
      </ul>

      <h2>3. How we share information</h2>
      <p>
        We do not sell or rent your personal information, and we do not share it with third parties
        for their own promotional or marketing purposes. We share it only with:
      </p>
      <ul>
        <li>
          <strong>Service providers</strong> who operate parts of the Service on our behalf, such as
          hosting, database, email delivery, and push notification providers;
        </li>
        <li><strong>Advertising partners</strong>, when ads are enabled, as described below; and</li>
        <li><strong>Legal authorities</strong>, when required by law or to protect our rights, users, or the Service.</li>
      </ul>
      <p>
        Comments you post are public and can be seen by anyone who visits the Service, along with
        the display name on your account.
      </p>

      <h2>4. Cookies, authentication, and advertising</h2>
      <p>
        We use a secure, HttpOnly authentication cookie to keep you signed in, and the app stores
        small preferences on your device, such as whether alerts are on. We do not use these to track you
        across other websites. You can block cookies in your browser settings, but signing in will
        not work without them.
      </p>
      <p>
        {BRAND.name} is free and is supported by advertising. When ads are shown, advertising
        partners (for example Google AdSense on the web and Google AdMob in the app) may use
        cookies or device identifiers to serve and measure ads, and, where you consent, to
        personalize them. Where required by law we ask for your consent first, and you can change
        your choice at any time.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We keep your information for as long as your account is active or as needed to provide the
        Service, and as required to meet legal, tax, or accounting obligations. When it is no longer
        needed, we delete or anonymize it.
      </p>

      <h2>6. Your rights and choices</h2>
      <p>Depending on where you live, you may have the right to:</p>
      <ul>
        <li>access, correct, or delete your personal information;</li>
        <li>withdraw consent, including unsubscribing from the Daily Brief or turning off alerts; and</li>
        <li>request a portable copy of your data.</li>
      </ul>
      <p>
        You can update your details on your account page and request deletion of your account and
        associated data on our <Link to="/delete-account">account deletion request</Link> page. For
        any other request, email{' '}
        <a href={`mailto:${BRAND.privacyEmail}`}>{BRAND.privacyEmail}</a>. We will verify the
        request and respond in accordance with applicable law.
      </p>

      <h2>7. Security</h2>
      <p>
        We use industry-standard measures to protect your information, including encryption in
        transit, hashed passwords, access controls, and secure hosting. No online system is
        completely secure, however, and we cannot guarantee absolute protection.
      </p>

      <h2>8. Third-party links</h2>
      <p>
        Stories link to original sources on third-party websites, and ads may link to advertisers.
        We are not responsible for the privacy practices or content of those sites; please review
        their policies before giving them personal information.
      </p>

      <h2>9. International data transfers</h2>
      <p>
        We are based in the United States. If you use the Service from outside the U.S., your
        information may be transferred to and processed in the U.S., where data protection laws may
        differ from those in your country.
      </p>

      <h2>10. Children's privacy</h2>
      <p>
        The Service is not directed to children under 13, and accounts are limited to people 18 and
        older (see our <Link to="/terms">Terms of Service</Link>). We do not knowingly collect
        personal information from children. If you believe a child has given us personal
        information, contact us and we will delete it.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The latest version will always be on this
        page, with the "Last updated" date above.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy questions or requests, email{' '}
        <a href={`mailto:${BRAND.privacyEmail}`}>{BRAND.privacyEmail}</a>, or visit{' '}
        <a href={OPERATOR.website}>{OPERATOR.website.replace('https://', '')}</a>.
      </p>
      <p>
        {OPERATOR.name} d/b/a {OPERATOR.dba}
      </p>
    </div>
  );
}
