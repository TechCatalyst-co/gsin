import { Link } from 'react-router-dom';
import { BRAND, TIER_MEANING, TIER_NAME } from '../brand';
import { LabelChip } from '../components/Chips';
import { useDocumentTitle } from './Home';

export default function About() {
  useDocumentTitle(`How it works — ${BRAND.name}`);
  return (
    <div className="shell intel">
      <h1>How {BRAND.name} works</h1>
      <p className="muted" style={{ marginTop: 6 }}>{BRAND.description}</p>
      <section className="intel-section">
        <h2>The radar</h2>
        <p>Every 30 minutes, around the clock, the radar sweeps {BRAND.sourceCount} sources: the labs, the agencies, the journals, the defense and policy desks. Every new item is graded by a strict rubric, one call per item, and the code enforces the rubric: a Tier 1 needs a primary source and must be under 24 hours old; nothing older than seven days is kept; repeat coverage is demoted; hype is capped.</p>
      </section>
      <section className="intel-section">
        <h2>The four tiers</h2>
        <dl className="grading" style={{ margin: 0 }}>
          {[1, 2, 3, 4].map((t) => <div key={t} style={{ display: 'contents' }}><dt><span className={`chip t${t}`}>T{t} {TIER_NAME[t]}</span></dt><dd>{TIER_MEANING[t]}</dd></div>)}
        </dl>
      </section>
      <section className="intel-section">
        <h2>The labels</h2>
        <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><LabelChip kind="reporting" /> the publisher’s own words, linked. <LabelChip kind="analysis" /> headline, impact and plain-English lines written by the pipeline from the verified source. <LabelChip kind="forecast" /> the evening analyst’s 24 to 72 hour calls, graded the next day.</p>
      </section>
      <section className="intel-section">
        <h2>Two briefs a day</h2>
        <p>The Morning Briefing at 6:50 AM Pacific consolidates the last 24 hours. The Evening Daily Brief at 5:25 PM is written by an analyst agent in three stages, grades its own forecasts, and is audited for unsupported claims before it goes out. Both are free, here and by email. <Link to="/intelligence">Read today’s</Link>.</p>
      </section>
    </div>
  );
}
