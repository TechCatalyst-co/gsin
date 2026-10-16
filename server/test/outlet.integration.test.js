const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { startDb, stopDb, buildApp, makeUser } = require('./helpers');
const NewsItem = require('../models/NewsItem');
const sample = require('../../samples/news-sample.json');
const brief = require('../../samples/daily-brief-sample.json');

const app = buildApp();
const KEY = { 'x-api-key': process.env.API_KEY };
let free;
let premium;
let editor;

test.before(async () => {
  await startDb();
  await NewsItem.init();
  free = await makeUser({ name: 'Free Reader' });
  premium = await makeUser({ name: 'Premium Reader', subscriptionStatus: 'active' });
  editor = await makeUser({ name: 'Editor', role: 'editor' });
});
test.after(stopDb);

test('ingest: rejects bad key, empty and invalid batches', async () => {
  await request(app).post('/api/news').send(sample).expect(401);
  await request(app).post('/api/news').set(KEY).send([]).expect(400);
  const bad = await request(app).post('/api/news').set(KEY)
    .send([{ title: 'ok', url: 'https://example.com/a' }, { title: 'x', url: 'javascript:alert(1)' }])
    .expect(400);
  assert.equal(bad.body.invalidCount, 1);
});

test('ingest: upserts sample stories and is idempotent', async () => {
  const first = await request(app).post('/api/news').set(KEY).send(sample).expect(200);
  assert.equal(first.body.inserted, sample.length);
  const again = await request(app).post('/api/news').set(KEY).send(sample).expect(200);
  assert.equal(again.body.inserted, 0);
  const one = await NewsItem.findOne({ url: sample[0].url }).lean();
  assert.match(one.slug, /^example-labs-unveils-aurora-5/);
  assert.deepEqual(one.tags, sample[0].tags);
});

test('ingest: accepts RSS-style aliases (link, pubDate, description)', async () => {
  await request(app).post('/api/news').set(KEY).send({
    title: 'Alias story', link: 'https://example.com/alias', pubDate: 'Wed, 14 Oct 2026 10:00:00 GMT',
    description: 'From an RSS node', tags: 'agents, Evals',
  }).expect(200);
  const doc = await NewsItem.findOne({ url: 'https://example.com/alias' }).lean();
  assert.equal(doc.summary, 'From an RSS node');
  assert.deepEqual(doc.tags, ['agents', 'evals']);
  assert.equal(doc.published.toISOString(), '2026-10-14T10:00:00.000Z');
});

test('relevance is not required and is ignored if sent', async () => {
  await request(app).post('/api/news').set(KEY)
    .send({ title: 'Legacy payload', url: 'https://example.com/legacy', relevance: 95 }).expect(200);
  const doc = await NewsItem.findOne({ url: 'https://example.com/legacy' }).lean();
  assert.equal(doc.relevance, undefined);
  const res = await request(app).get('/api/news/' + doc.slug).expect(200);
  assert.equal(res.body.item.relevance, undefined);
});

test('partial re-ingest does not blank fields or reset curation', async () => {
  const doc = await NewsItem.findOne({ url: sample[1].url });
  doc.featured = true;
  doc.commentCount = 3;
  await doc.save();
  await request(app).post('/api/news').set(KEY).send({ title: sample[1].title, url: sample[1].url, urgent: true }).expect(200);
  const after = await NewsItem.findById(doc._id).lean();
  assert.equal(after.featured, true);
  assert.equal(after.commentCount, 3);
  assert.equal(after.summary, sample[1].summary);
  assert.equal(after.urgent, true);
});

test('feed is public; analysis is Premium-only', async () => {
  const anon = await request(app).get('/api/news?limit=50').expect(200);
  assert.ok(anon.body.items.length >= sample.length);
  const withAnalysis = anon.body.items.find((i) => i.url === sample[0].url);
  assert.equal(withAnalysis.hasAnalysis, true);
  assert.equal(withAnalysis.analysis, undefined);

  const prem = await request(app).get('/api/news?limit=50').set('Authorization', premium.auth).expect(200);
  assert.ok(prem.body.items.find((i) => i.url === sample[0].url).analysis);

  const freeRes = await request(app).get(`/api/news/${withAnalysis.slug}`).set('Authorization', free.auth).expect(200);
  assert.equal(freeRes.body.item.analysis, undefined);
});

test('feed filters by category, tag and search; latest sort is newest first', async () => {
  const cat = await request(app).get('/api/news').query({ category: 'Safety & Alignment' }).expect(200);
  assert.ok(cat.body.items.length >= 2);
  assert.ok(cat.body.items.every((i) => i.category === 'Safety & Alignment'));
  const tag = await request(app).get('/api/news').query({ tag: 'robotics' }).expect(200);
  assert.equal(tag.body.items.length, 1);
  const search = await request(app).get('/api/news').query({ search: 'takeoff' }).expect(200);
  assert.equal(search.body.items.length, 1);
  const latest = await request(app).get('/api/news').expect(200);
  const dates = latest.body.items.map((i) => new Date(i.published).getTime());
  assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
});

test('front page, categories, tags, story-by-slug with related', async () => {
  const fp = await request(app).get('/api/news/front-page').expect(200);
  assert.ok(fp.body.lead);
  assert.ok(Array.isArray(fp.body.latest));
  assert.ok(!fp.body.latest.some((i) => i._id === fp.body.lead._id));
  const cats = await request(app).get('/api/news/categories').expect(200);
  assert.ok(cats.body.categories.some((c) => c.category === 'Frontier Models'));
  await request(app).get('/api/news/tags').expect(200);
  const story = await request(app).get(`/api/news/${fp.body.lead.slug}`).expect(200);
  assert.equal(story.body.item._id, fp.body.lead._id);
  assert.ok(Array.isArray(story.body.related));
  await request(app).get('/api/news/no-such-story').expect(404);
});

test('editors curate: hidden stories disappear from public views', async () => {
  const target = await NewsItem.findOne({ url: sample[3].url }).lean();
  await request(app).patch(`/api/admin/news/${target._id}`).set('Authorization', free.auth).send({ hidden: true }).expect(403);
  await request(app).patch(`/api/admin/news/${target._id}`).set('Authorization', editor.auth).send({ hidden: true }).expect(200);
  const feed = await request(app).get('/api/news?limit=100').expect(200);
  assert.ok(!feed.body.items.some((i) => i._id === String(target._id)));
  await request(app).get(`/api/news/${target.slug}`).expect(404);
  await request(app).get(`/api/news/${target.slug}`).set('Authorization', editor.auth).expect(200);
  // editors cannot manage members
  await request(app).get('/api/admin/users').set('Authorization', editor.auth).expect(403);
  await request(app).get('/api/admin/metrics').set('Authorization', editor.auth).expect(200);
});

test('comments: public read, Premium post, free blocked', async () => {
  const story = await NewsItem.findOne({ url: sample[2].url }).lean();
  await request(app).post('/api/comments').send({ newsItem: story._id, body: 'hi' }).expect(401);
  const blocked = await request(app).post('/api/comments').set('Authorization', free.auth)
    .send({ newsItem: story._id, body: 'hi' }).expect(403);
  assert.equal(blocked.body.code, 'upgrade_required');

  const posted = await request(app).post('/api/comments').set('Authorization', premium.auth)
    .send({ newsItem: story._id, body: 'Compute thresholds will age badly.' }).expect(201);
  assert.equal(posted.body.comment.authorBadge, 'premium');
  await request(app).post('/api/comments').set('Authorization', editor.auth)
    .send({ newsItem: story._id, body: 'Thanks for reading.', parent: posted.body.comment._id }).expect(201);

  const list = await request(app).get('/api/comments').query({ newsItem: String(story._id) }).expect(200);
  assert.equal(list.body.total, 2);
  assert.equal(list.body.canPost, false);
  assert.equal((await NewsItem.findById(story._id).lean()).commentCount, 2);

  await request(app).post(`/api/comments/${posted.body.comment._id}/report`).set('Authorization', free.auth).send({ reason: 'test' }).expect(200);
  const reported = await request(app).get('/api/admin/comments/reported').set('Authorization', editor.auth).expect(200);
  assert.equal(reported.body.comments.length, 1);
  await request(app).delete(`/api/comments/${posted.body.comment._id}`).set('Authorization', editor.auth).expect(200);
  assert.equal((await NewsItem.findById(story._id).lean()).commentCount, 1);
});

test('daily brief: n8n ingest, Premium-only read, items link to stories', async () => {
  await request(app).post('/api/daily-brief').set(KEY).send(brief).expect(200);
  await request(app).get('/api/daily-brief/latest').expect(401);
  const denied = await request(app).get('/api/daily-brief/latest').set('Authorization', free.auth).expect(403);
  assert.equal(denied.body.code, 'upgrade_required');
  const ok = await request(app).get('/api/daily-brief/latest').set('Authorization', premium.auth).expect(200);
  assert.equal(ok.body.brief.items.length, brief.app_items.length);
  assert.ok(ok.body.brief.items.every((i) => i.newsItemId && i.slug));
  const dates = await request(app).get('/api/daily-brief/dates').set('Authorization', premium.auth).expect(200);
  assert.deepEqual(dates.body.dates, ['2026-10-15']);
});

test('reader: bookmarks and followed topics', async () => {
  const story = await NewsItem.findOne({ url: sample[5].url }).lean();
  await request(app).post('/api/me/bookmarks').set('Authorization', free.auth).send({ newsItem: story._id }).expect(200);
  const saved = await request(app).get('/api/me/bookmarks').set('Authorization', free.auth).expect(200);
  assert.equal(saved.body.items[0]._id, String(story._id));
  const detail = await request(app).get(`/api/news/${story.slug}`).set('Authorization', free.auth).expect(200);
  assert.equal(detail.body.item.bookmarked, true);
  await request(app).post('/api/me/bookmarks').set('Authorization', free.auth).send({ newsItem: story._id, saved: false }).expect(200);
  assert.equal((await request(app).get('/api/me/bookmarks').set('Authorization', free.auth)).body.items.length, 0);

  await request(app).put('/api/me/categories').set('Authorization', free.auth).send({ categories: ['Open Source', 'Robotics'] }).expect(200);
  const feed = await request(app).get('/api/me/feed').set('Authorization', free.auth).expect(200);
  assert.ok(feed.body.items.length >= 1);
  assert.ok(feed.body.items.every((i) => ['Open Source', 'Robotics'].includes(i.category)));
});

test('auth/me exposes capabilities; register works', async () => {
  const reg = await request(app).post('/api/auth/register')
    .send({ name: 'New', email: `n-${Date.now()}@example.com`, password: 'password123', client: 'mobile' }).expect(201);
  assert.equal(reg.body.user.capabilities.readNews, true);
  assert.equal(reg.body.user.capabilities.accessDailyBrief, false);
  const me = await request(app).get('/api/auth/me').set('Authorization', premium.auth).expect(200);
  assert.equal(me.body.user.isPremium, true);
  assert.equal(me.body.user.capabilities.participateInThreads, true);
});

test('public: RSS, sitemap, share preview; subscribers for n8n', async () => {
  const rss = await request(app).get('/api/public/rss').expect(200);
  assert.match(rss.headers['content-type'], /rss\+xml/);
  assert.match(rss.text, /<title>Global Super Intelligence News<\/title>/);
  assert.match(rss.text, /news\.example\.com\/story\//);
  const map = await request(app).get('/api/public/sitemap.xml').expect(200);
  assert.match(map.text, /<urlset/);
  const story = await NewsItem.findOne({ url: sample[0].url }).lean();
  const prev = await request(app).get(`/api/public/news/${story.slug}/preview`).expect(200);
  assert.equal(prev.body.slug, story.slug);
  assert.equal(prev.body.analysis, undefined);

  const subs = await request(app).get('/api/subscribers').set(KEY).expect(200);
  const emails = subs.body.subscribers.map((s) => s.email);
  assert.ok(emails.includes(premium.user.email));
  assert.ok(emails.includes(editor.user.email));
  assert.ok(!emails.includes(free.user.email));
  const all = await request(app).get('/api/subscribers?audience=all').set(KEY).expect(200);
  assert.ok(all.body.subscribers.some((s) => s.email === free.user.email));
});
