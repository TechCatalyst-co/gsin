// Relevance (0–100, scored by the n8n pipeline) drawn as five rising bars —
// the outlet's signature mark. Filled bars = how strong the signal is.
export default function SignalMeter({ value = 0, size = 'sm' }) {
  const filled = Math.max(0, Math.min(5, Math.round((Number(value) || 0) / 20)));
  const label = ['Background', 'Low signal', 'Notable', 'Significant', 'Major', 'Landmark'][filled];
  return (
    <span className={`signal signal--${size}`} title={`${label} (relevance ${value || 0})`} role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= filled ? 'on' : ''} style={{ height: `${20 + i * 16}%` }} />
      ))}
    </span>
  );
}
