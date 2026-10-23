// Label chips: they mark what kind of writing a section is.
export function LabelChip({ kind }) {
  const text = kind === 'analysis' ? 'AI-generated analysis' : kind === 'forecast' ? 'Speculative forecast' : 'Verified reporting';
  return <span className="chip label">{text}</span>;
}
