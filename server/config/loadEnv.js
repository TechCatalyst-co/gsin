// Layered environment loader.
//
// Loads a base `.env` (local defaults), then optionally overlays a second file
// named by the ENV_FILE var (with override). This is how the local server
// toggles which database it talks to without any code change:
//
//   npm run dev           -> base .env only          (default DB)
//   npm run dev:staging   -> .env + .env.staging     (staging DB)
//
// The overlay only needs the keys that differ from the base (typically just
// MONGODB_URI); everything else is inherited from `.env`.
const path = require('path');
const dotenv = require('dotenv');

// Base local config — always loaded.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Optional overlay (e.g. .env.staging) selected via ENV_FILE; overrides base.
const overlay = process.env.ENV_FILE;
if (overlay && overlay !== '.env') {
  dotenv.config({ path: path.resolve(__dirname, '..', overlay), override: true });
}

// Resolve the DB name from the connection string (best-effort) so we can both
// log it and guard against a mistoggle. An empty path (…mongodb.net/?… or
// …mongodb.net) means no database was named, so Mongoose would fall back to the
// default `test` DB — we track that case separately for a clearer error.
let dbName = '(unknown)';
let hasDbName = false;
try {
  const pathDb = new URL(process.env.MONGODB_URI).pathname.replace(/^\//, '');
  hasDbName = pathDb.length > 0;
  dbName = hasDbName ? pathDb : '(default)';
} catch {
  /* URI may be a bare mongodb:// form without a parseable path; leave unknown */
}

// Visible at startup so you always know which DB you're on.
console.log(`[env] loaded ${overlay || '.env'} -> MongoDB "${dbName}"`);

// Safety guard 1 (EVERY environment): the URI must name a database. With no
// path segment Mongoose silently falls back to its default `test` DB — which is
// exactly how production spent months writing into a database literally called
// "test". Refusing here is what stops that recurring, locally or deployed.
if (process.env.MONGODB_URI && !hasDbName) {
  throw new Error(
    'Refusing to start: MONGODB_URI has no database name in its path, so ' +
      'Mongoose would silently use the default "test" DB. Add the name, e.g. ' +
      '"…mongodb.net/singularity-wire?…".'
  );
}

// Safety guard 2 (EVERY environment): `test` is never a deliberate choice for
// this app — it is only ever the name Mongoose falls back to. Seeing it now
// means the fallback happened again somewhere upstream (typically a URI copied
// without its path segment).
if (/^test$/i.test(dbName)) {
  throw new Error(
    'Refusing to start: MONGODB_URI names the "test" database. That is ' +
      "Mongoose's default fallback, not a real database for this app. Point it " +
      'at "singularity-wire" (or "singularity-wire-staging").'
  );
}

// Safety guard 3 (staging only): if the overlay is a staging file, the resolved
// DB name must look like staging. This mirrors scripts/seed-staging.js (which
// keys off the same connection name) and stops a `dev:staging` run from
// silently hitting the wrong database if .env.staging is missing or misfilled.
if (overlay && /staging/i.test(overlay)) {
  if (!/staging/i.test(dbName) || /prod/i.test(dbName)) {
    throw new Error(
      `Refusing to start: ENV_FILE="${overlay}" but MongoDB "${dbName}" does not ` +
        'look like staging. Point MONGODB_URI at the staging cluster ' +
        '(DB name must contain "staging").'
    );
  }
}
