# Release 2.0.2 (3): store submission copy

Everything to paste into App Store Connect and Google Play Console for this release. Build steps are in [../RELEASE.md](../RELEASE.md). Anything not mentioned here is unchanged from [RELEASE-2.0.1.md](RELEASE-2.0.1.md).

| | |
|---|---|
| Version | **2.0.2** (iOS "Version", Android `versionName`) |
| Build | **3** (iOS "Build", Android `versionCode`) |
| Bundle / application ID | `co.techcatalyst.gsin` |
| Release name (Play) | **2.0.2 (3): Briefs first** |
| App Store status | Update to the live app (id6824711002) |
| Google Play status | Update to 2.0.1 if that went out; otherwise use the first-launch notes below |

### What changed since 2.0.1

| Change | Commit |
|---|---|
| Briefs is now the first tab and where the app opens. News is the second tab. | `f990437` |
| Signing in or creating an account lands on Briefs. Starting from a story returns you to that story. | `f990437` |
| Fixed sign-in and sign-up stalling with no message when the device keychain failed, which also made a retry say the account already existed. | `3faeeb4` |
| Fixed breaking-news and brief alerts not subscribing on iOS (the APNs token arrived after the topic subscription). | `67aeb0e` |
| The radar now sweeps 44 sources, up from 34, adding security research teams. | `6489705` |
| Server only: the push service accepts the Firebase service account as raw JSON, base64 or quoted. Needs no app update. | `4dd02d5` |

---

## 1. What's New / release notes

### App Store: "What's New in This Version" (max 4000)

```
Briefs first, and more reliable alerts.

• The app now opens on Briefs, the twice-daily summary of what matters. News is one tap away in the second tab.
• After you sign in or create an account, you land on Briefs, or back on the story you were reading.
• Fixed an issue where signing in or creating an account could stop without an error on some devices.
• Fixed breaking-news and brief alerts not arriving on some iPhones.
• The radar now sweeps 44 primary sources, including security research teams.
• Bug fixes and performance improvements.
```

### Google Play: release notes (max 500 per language)

```
<en-US>
Briefs first, and more reliable alerts.
• The app now opens on Briefs; News is the second tab
• Sign in lands on Briefs, or back on your story
• Fixed sign-in and sign-up stopping without an error
• The radar now sweeps 44 primary sources
• Bug fixes and performance improvements
</en-US>
```

If 2.0.1 never reached Play production and this is the first launch, use this instead:

```
<en-US>
Welcome to Global Super Intelligence News: a graded feed of AI and the path to superintelligence, swept from 44 primary sources every 30 minutes. Start the day with a morning and an evening brief, read the news by topic, check what to watch over the next 72 hours, and turn on breaking-news alerts. Free to read.
</en-US>
```

---

## 2. Store listing (both stores)

The name, subtitle, short description and keywords are unchanged from 2.0.1. Update the promotional text and the full description, which now lead with Briefs and say 44 sources.

### App name / title (max 30)

```
Global Super Intelligence News
```

### App Store subtitle (max 30)

```
AI news, graded twice a day
```

### App Store promotional text (max 170; you can change this without a new review)

```
New in 2.0.2: the app opens on your brief, alerts are more reliable, and the radar now sweeps 44 primary sources. Free to read, no account needed.
```

### Google Play short description (max 80)

```
AI and superintelligence news, graded from primary sources, twice a day.
```

### Full description (App Store max 4000 / Play max 4000)

```
Global Super Intelligence News is a graded feed of artificial intelligence and the path to superintelligence. Every 30 minutes, the radar sweeps 44 primary sources, including lab announcements, research papers, security research teams, government releases and company filings, and grades every story against a strict rubric. Analysis and forecasts are always labelled as such.

Real intelligence. A clearer tomorrow.

TWO BRIEFS A DAY
The app opens on the latest brief. A morning edition and an evening edition condense the day into what matters:
• Yesterday's calls, graded: what we said would happen, and whether it did
• Critical intelligence
• Trends and cross-domain insights
• A watchlist for the next 24 to 72 hours
Tap the date to open a calendar and read any past brief.

NEWS
Start with the lead story, then read one clean list grouped by topic, busiest first. Use the topic pills to stick to what you follow. Breaking stories are flagged so they never get buried.

WATCHLIST
See what is coming next across the field, in one place.

TEN DESKS
Frontier Models & AGI · Defense & National Security · Cybersecurity · Medical & Life Sciences · Policy & Regulation · Private Sector & Enterprise · Compute & Chips · Robotics & Autonomy · AI Safety & Alignment · Open Source & Developer Tools

BREAKING-NEWS ALERTS
Turn on alerts to get notified the moment a real breaking story lands. Breaking is reserved for news that is actually breaking.

SOURCES FIRST
Every story links to its original source. Summaries are there to help you decide what to read, not to replace the source.

FREE TO READ
Every story and every brief is free, with no paywall and no account. A free account lets you save stories and join the discussion.

Global Super Intelligence News is operated by Sirlopu Technology Services, LLC (dba TechCatalyst).
```

### App Store keywords (max 100, comma-separated, no spaces after commas)

```
AI,artificial,AGI,ASI,LLM,machine learning,briefing,alignment,safety,robotics,chips,policy,tech
```

---

## 3. URLs, categories, ratings and privacy forms

All unchanged from 2.0.1: see sections 3 to 5 of [RELEASE-2.0.1.md](RELEASE-2.0.1.md). This release collects no new data, so the App Privacy and Data safety answers stay the same.

The age-rating caveat still applies: **the app can't block users yet**, which Apple guideline 1.2 asks for in apps with user comments.

---

## 4. Review notes

### App Store: App Review Information

```
Global Super Intelligence News is free to read with no account. All stories, briefs and the watchlist work without signing in.

A demo account is provided to review the signed-in features: saving stories, commenting and reporting comments on a story, breaking-news alert settings, change password and account deletion (Account tab).

Breaking-news alerts use Firebase Cloud Messaging and need a real device. Users can start account deletion in the app: Account > Request account deletion (opens globalsinews.com/delete-account).

What changed in 2.0.2: the app now opens on the Briefs tab (News is the second tab), signing in returns to Briefs or to the story the user started from, and fixes for sign-in on devices with keychain errors and for push alert subscriptions on iOS.
```

- **Sign-in required:** check it, and enter the demo account's email and password. Use a seeded active user, and don't paste the credentials into this file.
- **Contact:** name, phone and `support@techcatalyst.co`.

### Google Play: App access

Unchanged: *"Account tab > Sign in. Reading works without an account; signing in enables saved stories and comments."*

---

## 5. Assets

The screenshots in `store/app-store/`, `store/play-screenshots/` and `store/play-desktop-screenshots/` were captured from 2.0.1. Their content still matches, but **the tab bar in them shows News first**, and 2.0.2 shows Briefs first. Either reuse them as they are, or recapture so the tab bar matches: replace the captures in `store/screens/` and run `python3 mobile/store/render_screens.py`. If you recapture, consider leading with the Brief screen, since that is now the first thing users see.

The feature graphic and icons are unchanged.

---

## 6. Submission checklist

**iOS**
- [ ] `flutter build ipa --release`, then upload with Transporter or Xcode Organizer
- [ ] App Store Connect: + Version → **2.0.2**, attach build **3**
- [ ] Paste What's New, and update the promotional text and full description
- [ ] Decide on screenshots (reuse the 2.0.1 set or recapture with the new tab order)
- [ ] On a real iPhone, turn on alerts and confirm a test breaking push arrives
- [ ] Confirm the demo account still signs in and lands on Briefs
- [ ] Submit for review; release manually or automatically after approval

**Android**
- [ ] `flutter build appbundle --release`, and check the signer isn't `androiddebugkey`
- [ ] If this is the first Play release, finish the store-listing and policy setup from the 2.0.1 checklist first
- [ ] Release name **2.0.2 (3): Briefs first**, and paste the release notes (or the first-launch notes)
- [ ] Update the full description
- [ ] After it goes live, set `APP_STORES.android` in `client/src/brand.js` to the Play URL if it's still "coming soon"
