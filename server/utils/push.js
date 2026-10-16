const NewsItem = require('../models/NewsItem');

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

module.exports = { alertBreaking, buildMessage, setSender, topic };
