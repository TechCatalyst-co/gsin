import { useEffect, useRef, useState } from 'react';

// Dates are YYYY-MM-DD strings throughout; noon UTC keeps the weekday stable in every timezone.
const parse = (ymd) => new Date(`${ymd}T12:00:00Z`);
const ymdOf = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// A button showing the chosen day that opens a month calendar. Only days in `available` can be
// picked; the rest are greyed out. Months step back and forth within the range that has briefs.
export default function BriefCalendar({ value, available, onChange }) {
  const [open, setOpen] = useState(false);
  const shown = value ? parse(value) : new Date();
  const [month, setMonth] = useState({ y: shown.getUTCFullYear(), m: shown.getUTCMonth() });
  const root = useRef(null);
  const has = new Set(available);
  const sorted = [...available].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  useEffect(() => {
    if (!open) return undefined;
    const d = value ? parse(value) : new Date();
    setMonth({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
    const away = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = (n) => setMonth(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));
  const monthKey = ymdOf(month.y, month.m, 1).slice(0, 7);
  const canBack = first && first.slice(0, 7) < monthKey;
  const canForward = last && last.slice(0, 7) > monthKey;

  const lead = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay();
  const days = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  const label = value
    ? parse(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : 'Pick a day';

  return (
    <div className="cal" ref={root}>
      <button type="button" className="cal-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {label}
      </button>
      {open && (
        <div className="cal-pop" role="dialog" aria-label="Choose a briefing day">
          <div className="cal-head">
            <button type="button" className="cal-nav" onClick={() => step(-1)} disabled={!canBack} aria-label="Previous month">‹</button>
            <span>{new Date(Date.UTC(month.y, month.m, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
            <button type="button" className="cal-nav" onClick={() => step(1)} disabled={!canForward} aria-label="Next month">›</button>
          </div>
          <div className="cal-grid">
            {WEEKDAYS.map((w) => <span key={w} className="cal-wd" aria-hidden="true">{w}</span>)}
            {cells.map((d, i) => {
              if (!d) return <span key={`b${i}`} />;
              const ymd = ymdOf(month.y, month.m, d);
              const ok = has.has(ymd);
              return (
                <button
                  key={ymd}
                  type="button"
                  className={`cal-day${ymd === value ? ' is-on' : ''}`}
                  disabled={!ok}
                  aria-pressed={ymd === value}
                  aria-label={parse(ymd).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }) + (ok ? '' : ', no brief')}
                  onClick={() => { onChange(ymd); setOpen(false); }}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <p className="cal-note">Days with a brief are selectable.</p>
        </div>
      )}
    </div>
  );
}
