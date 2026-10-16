// Ad configuration for the web. Everything is OFF until configured, and the
// app renders no empty boxes while off. See docs/ADS.md.
//
//   VITE_ADS_PROVIDER   none | adsense | preview
//                       preview = labeled placeholder boxes, for layout review
//   VITE_ADSENSE_CLIENT ca-pub-XXXXXXXXXXXXXXXX
//   VITE_AD_SLOT_<PLACEMENT>  AdSense ad-unit id per placement, e.g.
//                       VITE_AD_SLOT_HOME_FEED=1234567890
const env = import.meta.env;

export const ADS = {
  provider: env.VITE_ADS_PROVIDER || 'none',
  adsenseClient: env.VITE_ADSENSE_CLIENT || '',
};

// Every place an ad can appear. Sizes are the reserved minimum height, so a
// loading ad never shifts the page.
export const PLACEMENTS = {
  'home-feed': { minHeight: 250, env: 'VITE_AD_SLOT_HOME_FEED' },
  'home-sidebar': { minHeight: 250, env: 'VITE_AD_SLOT_HOME_SIDEBAR' },
  'story-inline': { minHeight: 250, env: 'VITE_AD_SLOT_STORY_INLINE' },
  'story-end': { minHeight: 250, env: 'VITE_AD_SLOT_STORY_END' },
  'feed-inline': { minHeight: 250, env: 'VITE_AD_SLOT_FEED_INLINE' },
  'brief-inline': { minHeight: 250, env: 'VITE_AD_SLOT_BRIEF_INLINE' },
};

export function slotIdFor(placement) {
  const p = PLACEMENTS[placement];
  return p ? env[p.env] || '' : '';
}

export function adsEnabled() {
  if (ADS.provider === 'preview') return true;
  return ADS.provider === 'adsense' && !!ADS.adsenseClient;
}

let scriptRequested = false;
export function loadAdSense() {
  if (scriptRequested || ADS.provider !== 'adsense' || !ADS.adsenseClient) return;
  scriptRequested = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADS.adsenseClient)}`;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
}
