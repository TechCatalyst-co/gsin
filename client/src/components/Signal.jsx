// Instrument readings for the signal score: a five-segment meter in rows, an arc gauge on the story page.
export function SignalMeter({ score, tier = 3 }) {
  if (score == null) return null;
  const s = Math.max(0, Math.min(100, score));
  const filled = Math.ceil(s / 20);
  return (
    <span className={`sigmeter ${tier <= 2 ? 'hot' : ''}`} role="img" aria-label={`Signal ${s} of 100`}>
      <span className="segs" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < filled ? 'on' : ''} />)}</span>
      <span className="num">{s}</span>
    </span>
  );
}

export function SignalGauge({ score, size = 92 }) {
  const s = Math.max(0, Math.min(100, score ?? 0));
  const r = 40, c = 2 * Math.PI * r, arc = c * 0.75;
  const dash = `${(arc * s) / 100} ${c}`;
  return (
    <svg className="siggauge" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Signal ${s} of 100`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${arc} ${c}`} transform="rotate(135 50 50)" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--blue)" strokeWidth="5" strokeLinecap="round" strokeDasharray={dash} transform="rotate(135 50 50)" className="siggauge-fill" style={{ '--dash': dash }} />
      <text x="50" y="52" textAnchor="middle" className="siggauge-num">{s}</text>
      <text x="50" y="66" textAnchor="middle" className="siggauge-lab">signal</text>
    </svg>
  );
}

export function ConfidenceRing({ value, size = 62 }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  const r = 42, c = 2 * Math.PI * r;
  return (
    <svg className="confring" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`QA confidence ${v} of 100`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#22385C" strokeWidth="6" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--blue)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(c * v) / 100} ${c}`} transform="rotate(-90 50 50)" />
      <text x="50" y="55" textAnchor="middle" className="confring-num">{v}</text>
      <text x="50" y="70" textAnchor="middle" className="confring-lab">QA</text>
    </svg>
  );
}

const hoursSince = (d) => { const t = new Date(d); return Number.isNaN(t.getTime()) ? null : Math.max(0, Math.round((Date.now() - t) / 3600000)); };
export const freshLabel = (d) => { const h = hoursSince(d); return h == null ? '—' : h < 1 ? '<1h' : h < 48 ? `${h}h` : `${Math.round(h / 24)}d`; };

// Four readings: signal gauge, freshness, corroboration, source verification.
export function InstrumentStrip({ item }) {
  return (
    <div className="instrument">
      <div><SignalGauge score={item.signalScore ?? item.relevance ?? 0} size={52} /></div>
      <div><b>{freshLabel(item.published)}</b><span>fresh</span></div>
      <div><b>{Math.max(1, item.sourceCount || 1)}</b><span>sources</span></div>
      <div>
        <svg className="seal" width="24" height="24" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" style={{ color: item.primarySource ? 'var(--blue)' : 'var(--slate)' }}>
          <path d="M11 2.5l7 2.6v5.4c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V5.1z" />
          {item.primarySource && <path d="M7.8 11l2.2 2.2 4.2-4.4" />}
        </svg>
        <span>{item.primarySource ? 'verified' : 'reported'}</span>
      </div>
    </div>
  );
}
