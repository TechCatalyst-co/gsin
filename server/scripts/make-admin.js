// Promote an existing account to admin (or editor):
//   npm run make-admin -- you@example.com [admin|editor]
require('../config/loadEnv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  const [email, role = 'admin'] = process.argv.slice(2);
  if (!email || !['admin', 'editor'].includes(role)) {
    console.error('usage: npm run make-admin -- <email> [admin|editor]');
    process.exit(1);
  }
  await connectDB();
  await User.updateOne({ email: email.toLowerCase() }, { $set: { role } });
  const user = await User.findOne({ email: email.toLowerCase() });
  console.log(user ? `${user.email} is now ${user.role}` : `No account for ${email} — register first.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
