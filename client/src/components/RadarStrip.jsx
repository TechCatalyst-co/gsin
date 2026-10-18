import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { BRAND } from '../brand';
import { timeAgo } from '../format';

// The one live element on every page: what the radar is doing right now.
export default function RadarStrip() {
  const [s, setS] = useState(null);
  useEffect(() => {
    let alive = true;
    const pull = () => api('/news/status').then((d) => alive && setS(d)).catch(() => {});
    pull();
    const id = setInterval(pull, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  const sources = s?.source_count ?? BRAND.sourceCount;
  return (
    <div className="radar" role="status" aria-live="polite">
      <div className="shell">
        <span className="dot" aria-hidden="true" />
        <span>Radar <b>{sources}</b> sources</span>
        <span className="sep optional">/</span>
        <span>swept <b>{s?.last_capture_at ? timeAgo(s.last_capture_at) : s ? 'not yet' : '…'}</b></span>
        <span className="sep optional">/</span>
        <span className="optional"><b>{s?.stories_24h ?? 0}</b> cleared in 24h</span>
        <span className="sep">/</span>
        {s?.breaking_24h > 0 ? <span className="breaking-pill">{s.breaking_24h} breaking</span> : <span><b>0</b> breaking</span>}
        <span className="spacer optional" />
        {s?.latest_brief_at && <Link className="optional" to="/intelligence">latest brief {timeAgo(s.latest_brief_at)}</Link>}
      </div>
    </div>
  );
}
