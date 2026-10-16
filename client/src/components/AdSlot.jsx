import { useEffect, useRef } from 'react';
import { ADS, PLACEMENTS, adsEnabled, loadAdSense, slotIdFor } from '../ads';

// One ad position. Renders nothing while ads are off (the default), a labeled
// placeholder in preview mode, or an AdSense unit when configured.
export default function AdSlot({ placement, className = '' }) {
  const ref = useRef(null);
  const meta = PLACEMENTS[placement];
  const slotId = slotIdFor(placement);
  const live = ADS.provider === 'adsense' && !!ADS.adsenseClient && !!slotId;

  useEffect(() => {
    if (!live) return;
    loadAdSense();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* blocked by an extension, or not ready — leave the space empty */
    }
  }, [live]);

  if (!meta || !adsEnabled()) return null;
  if (ADS.provider !== 'preview' && !live) return null;

  return (
    <aside className={`ad ${className}`} aria-label="Advertisement" style={{ minHeight: meta.minHeight + 24 }}>
      <span className="ad-label">Advertisement</span>
      {live ? (
        <ins
          ref={ref}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: meta.minHeight }}
          data-ad-client={ADS.adsenseClient}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad-preview" style={{ minHeight: meta.minHeight }}>{placement}</div>
      )}
    </aside>
  );
}
