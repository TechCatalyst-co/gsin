const mongoose = require('mongoose');

// `opts` is passed straight through to mongoose.connect, so a caller can force
// a database with { dbName } without editing MONGODB_URI (used by
// scripts/migrate-rehome-database.js). Every app-level caller passes nothing.
module.exports = async function connectDB(opts = {}) {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }
  await mongoose.connect(process.env.MONGODB_URI, opts);
  // Name the database, not just the fact of a connection — an unnamed URI
  // silently resolves to Mongoose's default `test` DB, and stating it here is
  // what makes that visible on every boot instead of months later.
  console.log(`MongoDB connected -> ${mongoose.connection.name}`);
};
