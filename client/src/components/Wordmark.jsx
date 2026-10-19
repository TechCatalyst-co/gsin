import { BRAND } from '../brand';

// The GSI mark with the gold wordmark beside it (navy on the light theme).
export default function Wordmark({ full = true }) {
  return (
    <span className="wordmark">
      <img src="/gsi-mark.png" alt="" width="62" height="34" />
      {full && <span className="wordmark-text"><span className="star" aria-hidden="true">✦</span>{BRAND.name.toUpperCase()}</span>}
    </span>
  );
}
