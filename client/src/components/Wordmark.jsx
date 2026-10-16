import { BRAND } from '../brand';

// The mark: an exponential curve leaving its axis — progress going vertical.
export function CurveGlyph({ size = 28 }) {
  return (
    <svg className="glyph" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M4 28 H28" className="glyph-axis" />
      <path d="M4 27 C14 27 20 25 24 16 C26 11 27 7 27.5 3" className="glyph-curve" />
      <circle cx="27.5" cy="3.5" r="2.4" className="glyph-dot" />
    </svg>
  );
}

// "GSIN" set heavy, with the full name beside it as a two-line lockup.
export default function Wordmark({ full = true }) {
  return (
    <span className="wordmark">
      <CurveGlyph />
      <span className="wordmark-short">{BRAND.short}</span>
      {full && (
        <span className="wordmark-full">
          {/* Two balanced lines: "Global Super" / "Intelligence News" */}
          <span>{BRAND.name.split(' ').slice(0, 2).join(' ')}</span>
          <span>{BRAND.name.split(' ').slice(2).join(' ')}</span>
        </span>
      )}
    </span>
  );
}
