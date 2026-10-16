const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { startDb, stopDb, buildApp, makeUser } = require('./helpers');
const NewsItem = require('../models/NewsItem');
const push = require('../utils/push');

const app = buildApp();
const KEY = { 'x-api-key': process.env.API_KEY };
const now = () => new Date().toISOString();
let sent = [];
let editor;

test.before(async () => {
  await startDb();
  await NewsItem.init();
  editor = await makeUser({ name: 'Editor', role: 'editor' });
});
test.beforeEach(() => {
  sent = [];
  push.setSender(async (msg) => { sent.push(msg); });
});
test.after(async () => {
  push.setSender(undefined);
  await stopDb();
});

test('push: off without a sender, ingest still works', async () => {
  push.setSender(null);
  const res = await request(app).post('/api/news').set(KEY)
    .send({ title: 'Quiet', url: 'https://example.com/p-off', urgent: true, published: now() }).expect(200);
  assert.equal(res.body.alerted, 0);
  const doc = await NewsItem.findOne({ url: 'https://example.com/p-off' }).lean();
  assert.equal(doc.alertedAt, undefined);
});

test('push: urgent ingest alerts once to the topic, with slug for deep links', async () => {
  const story = { title: 'Lab ships AGI claim', headline: 'What it means', url: 'https://example.com/p-1', urgent: true, published: now() };
  const first = await request(app).post('/api/news').set(KEY).send(story).expect(200);
  assert.equal(first.body.alerted, 1);
  assert.equal(sent.length, 1);
  const doc = await NewsItem.findOne({ url: story.url }).lean();
  assert.equal(sent[0].topic, 'breaking');
  assert.equal(sent[0].notification.title, story.title);
  assert.equal(sent[0].notification.body, story.headline);
  assert.deepEqual(sent[0].data, { type: 'breaking', slug: doc.slug, id: String(doc._id) });
  assert.ok(doc.alertedAt);

  await request(app).post('/api/news').set(KEY).send(story).expect(200);
  assert.equal(sent.length, 1, 're-ingest must not alert again');
});

test('push: skips non-urgent and old stories', async () => {
  await request(app).post('/api/news').set(KEY).send([
    { title: 'Normal', url: 'https://example.com/p-2', published: now() },
    { title: 'Old urgent', url: 'https://example.com/p-3', urgent: true, published: '2020-01-01T00:00:00Z' },
  ]).expect(200);
  assert.equal(sent.length, 0);
});

test('push: editor flagging breaking sends the alert; hidden stories never do', async () => {
  await request(app).post('/api/news').set(KEY).send({ title: 'Flag me', url: 'https://example.com/p-4', published: now() }).expect(200);
  const doc = await NewsItem.findOne({ url: 'https://example.com/p-4' }).lean();

  await request(app).patch(`/api/admin/news/${doc._id}`).set('Authorization', editor.auth)
    .send({ urgent: true, hidden: true }).expect(200);
  assert.equal(sent.length, 0);

  await request(app).patch(`/api/admin/news/${doc._id}`).set('Authorization', editor.auth)
    .send({ hidden: false }).expect(200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].data.id, String(doc._id));
});

test('push: a failed send releases the claim so it can retry', async () => {
  push.setSender(async () => { throw new Error('fcm down'); });
  const story = { title: 'Retry', url: 'https://example.com/p-5', urgent: true, published: now() };
  const res = await request(app).post('/api/news').set(KEY).send(story).expect(200);
  assert.equal(res.body.alerted, 0);
  assert.equal((await NewsItem.findOne({ url: story.url }).lean()).alertedAt, undefined);

  push.setSender(async (msg) => { sent.push(msg); });
  await request(app).post('/api/news').set(KEY).send(story).expect(200);
  assert.equal(sent.length, 1);
});
