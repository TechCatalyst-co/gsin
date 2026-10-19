const NewsItem = require('../models/NewsItem');
const DailyBrief = require('../models/DailyBrief');

// Breaking-news push alerts via Firebase Cloud Messaging.
//
// The app subscribes each device to one FCM topic (PUSH_TOPIC, default
// "breaking"), so the server never stores device tokens and readers don't
// need an account. A story is alerted at most once: `alertedAt` is claimed
// atomically before sending.
//
// Push is off until FIREBASE_SERVICE_ACCOUNT is set (the service-account JSON,
// raw or base64). Without it every call is a no-op.

const MAX_AGE_MS = 6 * 60 * 60 * 1000; // never alert stories older than this
const MAX_PER_CALL = 3; // a burst of urgent items sends at most this many

let sender; // (message) => Promise; undefined = not resolved yet, null = off

function topic() {
  return process.env.PUSH_TOPIC || 'breaking';
}

// Briefs go to their own topic so readers can take breaking alerts without the
// twice-daily brief, or the other way round (the app exposes both toggles).
function briefTopic() {
  return process.env.PUSH_BRIEF_TOPIC || 'brief';
}

function loadSender() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const { initializeApp, cert, getApps } = require('firebase-admin/app');
    const { getMessaging } = require('firebase-admin/messaging');
    const app = getApps()[0] || initializeApp({ credential: cert(JSON.parse(json)) });
    const messaging = getMessaging(app);
    return (message) => messaging.send(message);
  } catch (err) {
    console.error('push: FIREBASE_SERVICE_ACCOUNT is invalid, alerts are off:', err.message);
    return null;
  }
}

function getSender() {
  if (sender === undefined) sender = loadSender();
  return sender;
}

// Tests swap in a fake sender; pass undefined to go back to env config.
function setSender(fn) {
  sender = fn;
}

function buildMessage(item) {
  const body = (item.headline || item.summary || '').slice(0, 180);
  const id = String(item._id);
  return {
    topic: topic(),
    notification: { title: item.title.slice(0, 120), ...(body && { body }) },
    data: { type: 'breaking', slug: item.slug || id, id },
    android: { priority: 'high', collapseKey: id },
    apns: {
      headers: { 'apns-collapse-id': id.slice(0, 64) },
      payload: { aps: { sound: 'default' } },
    },
  };
}

// Send an alert for every story matching `filter` that is urgent, visible,
// recent and not yet alerted. Never throws: ingest and curation must not fail
// because FCM did. Returns the number of alerts sent.
async function alertBreaking(filter = {}) {
  const send = getSender();
  if (!send) return 0;
  let sent = 0;
  try {
    const candidates = await NewsItem.find({
      ...filter,
      urgent: true,
      hidden: { $ne: true },
      alertedAt: null,
      published: { $gte: new Date(Date.now() - MAX_AGE_MS) },
    })
      .sort({ published: -1 })
      .limit(MAX_PER_CALL)
      .select('title headline summary slug')
      .lean();

    for (const item of candidates) {
      const claimed = await NewsItem.updateOne({ _id: item._id, alertedAt: null }, { $set: { alertedAt: new Date() } });
      if (!claimed.modifiedCount) continue; // another request got it first
      try {
        await send(buildMessage(item));
        sent += 1;
      } catch (err) {
        // Release the claim so the next ingest or edit can retry.
        await NewsItem.updateOne({ _id: item._id }, { $unset: { alertedAt: 1 } });
        console.error('push: send failed for', String(item._id), err.message);
      }
    }
  } catch (err) {
    console.error('push: alertBreaking error:', err);
  }
  return sent;
}

// "Morning Briefing is out" / "Evening Daily Brief is out": one push per brief
// per day, claimed atomically on the brief document. n8n's payload may carry a
// `push` object ({ heading, body }); otherwise a sensible default is used.
function buildBriefMessage({ briefingDate, briefType, push = {} }) {
  const date = briefingDate.toISOString().slice(0, 10);
  const isEvening = briefType === 'evening';
  const title = String(push.heading || (isEvening ? 'Evening Daily Brief is out' : 'Morning Briefing is out')).slice(0, 120);
  const body = String(push.body || (isEvening ? 'The analyst brief: critical intelligence, graded forecasts and the next 72 hours.' : 'The last 24 hours of AI, consolidated and graded.')).slice(0, 180);
  const id = `brief-${date}-${briefType}`;
  return {
    topic: briefTopic(),
    notification: { title, body },
    data: { type: 'brief', date, briefType, url: String(push.url || '') },
    android: { priority: 'high', collapseKey: id },
    apns: { headers: { 'apns-collapse-id': id.slice(0, 64) }, payload: { aps: { sound: 'default' } } },
  };
}

async function alertBrief({ briefingDate, briefType, push }) {
  const send = getSender();
  if (!send || !briefingDate) return 0;
  try {
    const claimed = await DailyBrief.updateOne(
      { briefingDate, briefType, alertedAt: null },
      { $set: { alertedAt: new Date() } }
    );
    if (!claimed.modifiedCount) return 0;
    try {
      await send(buildBriefMessage({ briefingDate, briefType, push: push && typeof push === 'object' ? push : {} }));
      return 1;
    } catch (err) {
      await DailyBrief.updateOne({ briefingDate, briefType }, { $unset: { alertedAt: 1 } });
      console.error('push: brief send failed', err.message);
      return 0;
    }
  } catch (err) {
    console.error('push: alertBrief error:', err);
    return 0;
  }
}

module.exports = { alertBreaking, alertBrief, buildMessage, buildBriefMessage, setSender, topic, briefTopic };
