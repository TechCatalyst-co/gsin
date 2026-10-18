// The Global SI contract on top of the baseline: two briefs a day, the evening
// analyst sections, grading fields on stories, the radar status strip, story
// groups by story_key, and the reader-comment feed the evening workflow reads.
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { startDb, stopDb, buildApp, makeUser } = require('./helpers');
const NewsItem = require('../models/NewsItem');
const DailyBrief = require('../models/DailyBrief');
const morning = require('../../samples/globalsi-morning-brief.json');
const evening = require('../../samples/globalsi-evening-brief.json');
const breaking = require('../../samples/globalsi-breaking.json');

const app = buildApp();
const KEY = { 'x-api-key': process.env.API_KEY };
let reader;

test.before(async () => {
  await startDb();
  await NewsItem.init();
  await DailyBrief.init();
  reader = await makeUser({ name: 'Reader' });
});
test.after(stopDb);

test('breaking payload: T1 items land as urgent with their grading', async () => {
  // The Radar posts its whole envelope; the server stores only the items.
  const res = await request(app).post('/api/news').set(KEY).send(breaking).expect(200);
  assert.equal(res.body.received, breaking['app-items'].length);
  // A bare array works too.
  const again = await request(app).post('/api/news').set(KEY).send(breaking['app-items']).expect(200);
  assert.equal(again.body.received, breaking['app-items'].length);
  const first = breaking['app-items'][0];
  const doc = await NewsItem.findOne({ url: first.url }).lean();
  assert.equal(doc.urgent, true);
  assert.equal(doc.urgencyTier, 1);
  assert.equal(doc.category, first.domain); // the desk
  assert.equal(doc.kind, first.category); // the event type
  assert.equal(doc.signalScore, first.signal_score);
  assert.equal(doc.primarySource, !!first.primary_source);
  assert.equal(doc.storyKey, first.story_key);
  assert.ok(doc.capturedAt instanceof Date);
});

test('morning and evening briefs on the same day do not collide', async () => {
  const m = await request(app).post('/api/daily-brief').set(KEY).send(morning).expect(200);
  assert.equal(m.body.brief_type, 'morning');
  assert.match(m.body.date_slug, /^\d{4}-\d{2}-\d{2}$/);
  const e = await request(app).post('/api/daily-brief').set(KEY).send(evening).expect(200);
  assert.equal(e.body.brief_type, 'evening');
  assert.equal(await DailyBrief.countDocuments({}), 2);

  // Re-sending replaces, never duplicates.
  await request(app).post('/api/daily-brief').set(KEY).send(evening).expect(200);
  assert.equal(await DailyBrief.countDocuments({}), 2);

  const ev = await DailyBrief.findOne({ briefType: 'evening' }).lean();
  assert.equal(ev.confidence, evening.confidence);
  assert.equal(ev.criticalIntelligence.length, evening.critical_intelligence.length);
  assert.equal(ev.criticalIntelligence[0].whyItMatters, evening.critical_intelligence[0].why_it_matters);
  assert.equal(ev.forwardWatchlist.length, evening.forward_watchlist.length);
  assert.equal(ev.watchlistFollowup[0].status, evening.watchlist_followup[0].status);
  assert.deepEqual(ev.crossDomainInsights, evening.cross_domain_insights);
  assert.equal(ev.plainSummary, evening.plain_summary);
  assert.equal(ev.items[0].urgencyTier, evening.app_items[0].urgency_tier);
});

test('brief reads: latest by type, list, dates with editions, day + type', async () => {
  const latest = await request(app).get('/api/daily-brief/latest').expect(200);
  assert.ok(latest.body.brief);
  const ev = await request(app).get('/api/daily-brief/latest?type=evening').expect(200);
  assert.equal(ev.body.brief.briefType, 'evening');
  const mo = await request(app).get('/api/daily-brief/latest?type=morning').expect(200);
  assert.equal(mo.body.brief.briefType, 'morning');

  const list = await request(app).get('/api/daily-brief/list').expect(200);
  assert.equal(list.body.count, 2);
  assert.ok(list.body.briefs.every((b) => b.dateSlug && b.items === undefined));

  const dates = await request(app).get('/api/daily-brief/dates').expect(200);
  assert.equal(dates.body.dates.length, 1);
  assert.equal(dates.body.editions.length, 2);

  const day = dates.body.dates[0];
  const byType = await request(app).get(`/api/daily-brief/${day}/evening`).expect(200);
  assert.equal(byType.body.brief.briefType, 'evening');
  await request(app).get(`/api/daily-brief/${day}/midday`).expect(400);
  const anyEdition = await request(app).get(`/api/daily-brief/${day}`).expect(200);
  assert.ok(anyEdition.body.brief);
});

test('brief items are mirrored into the feed with their grading', async () => {
  const item = morning.app_items[0];
  const doc = await NewsItem.findOne({ url: item.url }).lean();
  assert.ok(doc, 'brief item mirrored');
  assert.equal(doc.urgencyTier, item.urgency_tier);
  assert.equal(doc.category, item.domain);
});

test('feed filters: tier, domain, horizon, hours; signal sort', async () => {
  const t1 = await request(app).get('/api/news').query({ tier: 1, limit: 100 }).expect(200);
  assert.ok(t1.body.items.length >= 1);
  assert.ok(t1.body.items.every((i) => i.urgencyTier === 1));
  const t3 = await request(app).get('/api/news').query({ tier: 3, limit: 100 }).expect(200);
  assert.ok(t3.body.items.length >= t1.body.items.length);
  const dom = await request(app).get('/api/news').query({ domain: morning.app_items[0].domain, limit: 100 }).expect(200);
  assert.ok(dom.body.items.every((i) => i.category === morning.app_items[0].domain));
  const sig = await request(app).get('/api/news').query({ sort: 'signal', tier: 3, limit: 100 }).expect(200);
  const tiers = sig.body.items.map((i) => i.urgencyTier);
  assert.deepEqual(tiers, [...tiers].sort((a, b) => a - b));
  await request(app).get('/api/news').query({ horizon: 'upcoming', hours: 24 * 14 }).expect(200);
});

test('radar status and story groups', async () => {
  const st = await request(app).get('/api/news/status').expect(200);
  assert.equal(typeof st.body.source_count, 'number');
  assert.ok(st.body.last_capture_at);
  assert.ok(st.body.stories_24h >= 0);
  assert.ok(st.body.latest_brief_at);

  const key = breaking['app-items'][0].story_key;
  const grp = await request(app).get(`/api/news/story/${encodeURIComponent(key)}`).expect(200);
  assert.equal(grp.body.lead.storyKey, key);
  assert.ok(grp.body.captures.length >= 1);
  await request(app).get('/api/news/story/no-such-key').expect(404);
});

test('reader comments feed for the evening workflow (x-api-key)', async () => {
  const story = await NewsItem.findOne({ url: breaking['app-items'][0].url }).lean();
  await request(app).post('/api/comments').set('Authorization', reader.auth)
    .send({ newsItem: story._id, body: 'Posted from the phone.', platform: 'ios' }).expect(201);

  await request(app).get('/api/comments/recent?hours=24').expect(401);
  const recent = await request(app).get('/api/comments/recent?hours=24').set(KEY).expect(200);
  assert.ok(Array.isArray(recent.body));
  assert.equal(recent.body[0].article_url, story.url);
  assert.equal(recent.body[0].comment_text, 'Posted from the phone.');
  assert.equal(recent.body[0].platform, 'ios');
  assert.equal(recent.body[0].user_tier, 'free');
  // The n8n node calls the bare path with ?hours=
  const alias = await request(app).get('/api/comments?hours=24').set(KEY).expect(200);
  assert.equal(alias.body.length, recent.body.length);
  await request(app).get('/api/comments?hours=24').expect(401);
});
