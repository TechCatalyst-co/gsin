import { useState } from 'react';

// Native share sheet when available (mobile web), else copy the permalink.
export default function ShareButton({ path, title, className = 'btn ghost sm' }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${path}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    copy();
  };

  return (
    <button type="button" className={className} onClick={share}>
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}
