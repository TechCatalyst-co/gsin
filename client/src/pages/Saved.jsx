import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { BRAND } from '../brand';
import { StoryList } from '../components/Story';
import { useDocumentTitle } from './Home';

export default function Saved() {
  const [saved, setSaved] = useState(null);
  const [forYou, setForYou] = useState(null);
  const [error, setError] = useState('');
  useDocumentTitle(`Saved — ${BRAND.name}`);

  useEffect(() => {
    api('/me/bookmarks').then((d) => setSaved(d.items)).catch((e) => setError(e.message));
    api('/me/feed').then(setForYou).catch(() => setForYou({ items: [], followedCategories: [] }));
  }, []);

  return (
    <div className="shell feed">
      <header className="feed-head"><h1>Your reading</h1></header>
      {error && <div className="alert">{error}</div>}
      <section aria-labelledby="saved-h">
        <h2 id="saved-h" className="section-h">Saved stories</h2>
        {saved === null ? <p className="muted">Loading…</p> : <StoryList items={saved} empty="Nothing saved yet. Use Save on any story to keep it here." />}
      </section>
      <section aria-labelledby="fy-h" className="for-you">
        <h2 id="fy-h" className="section-h">From topics you follow</h2>
        {forYou === null ? <p className="muted">Loading…</p> : forYou.followedCategories.length === 0
          ? <p className="muted empty-line">You aren’t following any topics. <Link to="/account">Choose topics</Link></p>
          : <StoryList items={forYou.items} />}
      </section>
    </div>
  );
}
