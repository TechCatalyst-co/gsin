# Publishing Global SI News to the App Store & Play Store

App identity (both stores): **Global SI News**, bundle/application ID **`co.techcatalyst.gsin`**, version from `pubspec.yaml` (`version: 2.0.0+1` → version 2.0.0, build number 1). Bump the `+N` build number on every store upload.

Release builds default to the production API `https://gsin-api.onrender.com` (see `lib/config.dart`); debug builds use `http://localhost:4000`. Override either with `--dart-define=API_BASE_URL=...`.

## 0. Prerequisites (one-time, has lead times — start early)

- [ ] **Apple Developer Program** — enroll at <https://developer.apple.com/programs/enroll/> on the account that owns Team ID `WNKQ356W6U` (already wired into the Xcode project). $99/year, approval usually 1–2 days.
- [ ] **Google Play Console** — register at <https://play.google.com/console/signup>. $25 one-time; identity verification can take several days.
  - ⚠️ New **personal** Play accounts must run a closed test with **at least 12 testers for 14 continuous days** before they can publish to production. Registering as an **organization** avoids this requirement.
- [ ] **Privacy policy URL** — required by both stores (the app collects email/password and stores an auth token). Host a page on the Netlify site, e.g. `https://<your-site>.netlify.app/privacy`.

## 1. Android (Play Store)

### Signing

Release signing is wired in `android/app/build.gradle.kts` and reads `android/key.properties` (gitignored):

Create the upload key once (you choose and type the password):

```bash
keytool -genkey -v -keystore android/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Then create `android/key.properties`:

```
storePassword=<password>
keyPassword=<password>
keyAlias=upload
storeFile=upload-keystore.jks
```

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
1. Create app → name "Global SI News", default language, app/game, free/paid.
2. Complete **Data safety** form: declare collection of email address + authentication credentials (account management), encrypted in transit, not shared with third parties.
3. Complete the **content rating** questionnaire.
4. Set the **privacy policy URL** (`https://globalsinews.com/privacy`) and the **account deletion URL** (`https://globalsinews.com/delete-account`). Ads: declare **No** (ads are off unless built with `ADS_PROVIDER=admob`).
5. Upload the AAB to a **closed testing** track, add testers, and (personal account) run the 14-day/12-tester test.
6. Apply for production access, then promote the release.

Store assets needed: app icon 512×512, feature graphic 1024×500, at least 2 phone screenshots, short (80 chars) + full (4000 chars) descriptions.

## 2. iOS (App Store)

### Signing

The Xcode project is configured with `DEVELOPMENT_TEAM = WNKQ356W6U` and automatic signing. The app is iPhone-only (`TARGETED_DEVICE_FAMILY = 1`), category News, and declares `ITSAppUsesNonExemptEncryption = false` (HTTPS only), so uploads skip the export-compliance prompt. Once enrollment is active:

1. Xcode → Settings → Accounts → sign in with the Apple ID on team `WNKQ356W6U`.
2. Open `mobile/ios/Runner.xcworkspace`; Xcode provisions certificates/profiles automatically.

### Build & upload

```bash
cd mobile
flutter build ipa --release
# output: build/ios/ipa/*.ipa
```

Upload with Xcode Organizer (Product → Archive → Distribute App) or drag the .ipa into the **Transporter** app.

In App Store Connect (<https://appstoreconnect.apple.com>):
1. Create the app record: platform iOS, bundle ID `co.techcatalyst.gsin`, SKU e.g. `gsin-001`.
2. Fill **App Privacy** (nutrition labels): collects email + user ID for app functionality/account, linked to identity, not used for tracking.
3. Set the **privacy policy URL**.
4. Add screenshots: 6.9" iPhone required (6.7" also accepted). The app is iPhone-only, so no iPad screenshots.
5. Attach the uploaded build, fill description/keywords/support URL, submit for review (typically 1–3 days).
6. Provide a **demo account** (email + password of a seeded active user) in the review notes — reviewers must be able to log in.

## 3. Breaking-news push (Firebase Cloud Messaging)

The app subscribes each device to the FCM topic `breaking` (Account → "Breaking news alerts", on by default after the permission prompt). The API sends one alert per story when it becomes urgent: n8n posts it with `urgent: true`, or an editor flags it in the Newsroom. Stories older than 6 hours or hidden never alert. Tapping an alert opens the story.

Until the Firebase files below exist, the app builds and runs with push off and the toggle hidden.

1. **Firebase project:** <https://console.firebase.google.com> → add project (Analytics not needed).
2. **Android:** add an Android app with package `co.techcatalyst.gsin`, download `google-services.json` into `mobile/android/app/`. The Gradle build applies the Google Services plugin only when that file exists.
3. **iOS:** add an iOS app with bundle ID `co.techcatalyst.gsin`, download `GoogleService-Info.plist`, then in Xcode drag it into the **Runner** group (check "Copy items if needed" and the Runner target).
4. **APNs:** Apple Developer → Keys → create a key with Apple Push Notifications service, download the `.p8`. Firebase → Project settings → Cloud Messaging → Apple app configuration → upload it with the Key ID and Team ID. The Runner target already carries the `aps-environment` entitlement and the remote-notification background mode; push only works on a real device, not the simulator.
5. **API:** Firebase → Project settings → Service accounts → Generate new private key. Put the JSON (raw, or `base64 -i key.json`) in the API's `FIREBASE_SERVICE_ACCOUNT` environment variable on Render. Keep it secret; it can send to every device.
6. **Dev vs prod:** point a dev API at a different topic (`PUSH_TOPIC=breaking-dev`) and run the app with `--dart-define=PUSH_TOPIC=breaking-dev`, so testing never reaches real readers.

Test: with the app installed on a phone and alerts on, flag a fresh story as breaking in the Newsroom; the notification should arrive within seconds. The API logs `push: send failed …` if FCM rejects the send.

Store forms: push needs no extra Data safety / App Privacy declarations beyond "device or other IDs" being collected by Firebase for messaging (not linked to identity, not used for tracking).

## 4. Every subsequent release

1. Bump `version:` in `pubspec.yaml` (e.g. `2.0.1+2` — the `+build` must increase every upload).
2. `flutter build appbundle --release` → Play Console.
3. `flutter build ipa --release` → App Store Connect.
