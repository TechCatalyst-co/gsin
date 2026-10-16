# Publishing Singularity Wire to the App Store & Play Store

App identity (both stores): **Singularity Wire**, bundle/application ID **`co.techcatalyst.singularitywire`**, version from `pubspec.yaml` (`version: 0.1.0+1` → versionName 1.0.0, build number 1). Bump the `+N` build number on every store upload.

Release builds default to the production API `https://singularity-wire-api.onrender.com` (see `lib/config.dart`); debug builds use `http://localhost:4000`. Override either with `--dart-define=API_BASE_URL=...`.

## 0. Prerequisites (one-time, has lead times — start early)

- [ ] **Apple Developer Program** — enroll at <https://developer.apple.com/programs/enroll/> under the TechCatalyst account (Team ID `9MDMFKS59Y`, already wired into the Xcode project). $99/year, approval usually 1–2 days.
- [ ] **Google Play Console** — register at <https://play.google.com/console/signup>. $25 one-time; identity verification can take several days.
  - ⚠️ New **personal** Play accounts must run a closed test with **at least 12 testers for 14 continuous days** before they can publish to production. Registering as an **organization** avoids this requirement.
- [ ] **Privacy policy URL** — required by both stores (the app collects email/password and stores an auth token). Host a page on the Netlify site, e.g. `https://<your-site>.netlify.app/privacy`.

## 1. Android (Play Store)

### Signing

Release signing is wired in `android/app/build.gradle.kts` and reads `android/key.properties` (gitignored):

- Keystore: `android/upload-keystore.jks` (alias `upload`), generated 2026-07-06.
- Credentials: in `android/key.properties`.
- **Back both files up now** (password manager + secure storage). Losing them before first upload means regenerating; after enrolling in Play App Signing, Google can reset a lost upload key, but don't rely on it.
- Never commit them (already covered by `android/.gitignore`).

On a machine without `key.properties`, release builds fall back to debug signing so `flutter run --release` still works — those builds cannot be uploaded to Play.

### Build & upload

```bash
cd mobile
flutter build appbundle --release
# output: build/app/outputs/bundle/release/app-release.aab
```

Verify it's signed with the upload key (must NOT say `androiddebugkey`):

```bash
keytool -printcert -jarfile build/app/outputs/bundle/release/app-release.aab | head -3
```

In Play Console:
1. Create app → name "Singularity Wire", default language, app/game, free/paid.
2. Complete **Data safety** form: declare collection of email address + authentication credentials (account management), encrypted in transit, not shared with third parties.
3. Complete the **content rating** questionnaire.
4. Set the **privacy policy URL**.
5. Upload the AAB to a **closed testing** track, add testers, and (personal account) run the 14-day/12-tester test.
6. Apply for production access, then promote the release.

Store assets needed: app icon 512×512, feature graphic 1024×500, at least 2 phone screenshots, short (80 chars) + full (4000 chars) descriptions.

## 2. iOS (App Store)

### Signing

The Xcode project is configured with `DEVELOPMENT_TEAM = 9MDMFKS59Y` (TechCatalyst) and automatic signing. Once enrollment is active:

1. Xcode → Settings → Accounts → sign in with the TechCatalyst Apple ID.
2. Open `mobile/ios/Runner.xcworkspace`; Xcode provisions certificates/profiles automatically.

### Build & upload

```bash
cd mobile
flutter build ipa --release
# output: build/ios/ipa/*.ipa
```

Upload with Xcode Organizer (Product → Archive → Distribute App) or drag the .ipa into the **Transporter** app.

In App Store Connect (<https://appstoreconnect.apple.com>):
1. Create the app record: platform iOS, bundle ID `co.techcatalyst.singularitywire`, SKU e.g. `singularity-wire-001`.
2. Fill **App Privacy** (nutrition labels): collects email + user ID for app functionality/account, linked to identity, not used for tracking.
3. Set the **privacy policy URL**.
4. Add screenshots: 6.9" iPhone required (6.7" also accepted). The app targets iPhone; skip iPad screenshots if you set the app to iPhone-only.
5. Attach the uploaded build, fill description/keywords/support URL, submit for review (typically 1–3 days).
6. Provide a **demo account** (email + password of a seeded active user) in the review notes — reviewers must be able to log in.

## 3. Every subsequent release

1. Bump `version:` in `pubspec.yaml` (e.g. `1.0.1+2` — the `+build` must increase every upload).
2. `flutter build appbundle --release` → Play Console.
3. `flutter build ipa --release` → App Store Connect.
