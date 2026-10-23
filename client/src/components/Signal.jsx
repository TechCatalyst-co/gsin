// The evening brief's QA confidence, as a ring.
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
