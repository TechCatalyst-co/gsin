// Shared test harness: real Express app + a throwaway MongoDB.
// Uses TEST_MONGODB_URI when set (e.g. a local mongod), otherwise boots
// mongodb-memory-server.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret';
process.env.API_KEY = process.env.API_KEY || 'test-api-key';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'https://news.example.com';

const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

let mongod;

async function startDb() {
  let uri = process.env.TEST_MONGODB_URI;
  if (uri) {
    uri = uri.replace(/\/[^/?]*(\?|$)/, `/sw-test-${process.pid}-${Date.now()}$1`);
  } else {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  await mongoose.connect(uri);
}

async function stopDb() {
  await mongoose.connection.db.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', require('../routes/api'));
  return app;
}

async function makeUser(fields = {}) {
  const u = new User({
    name: fields.name || 'Reader',
    email: `u-${Math.random().toString(36).slice(2)}@example.com`,
    ...fields,
  });
  u.password = 'password123';
  await u.save();
  const token = jwt.sign({ id: u._id, v: 0 }, process.env.JWT_SECRET);
  return { user: u, auth: `Bearer ${token}` };
}

module.exports = { startDb, stopDb, buildApp, makeUser };
