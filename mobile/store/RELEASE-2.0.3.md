# Release 2.0.3 (4): store submission copy

Everything to paste into App Store Connect and Google Play Console for this release. Build steps are in [../RELEASE.md](../RELEASE.md). Anything not mentioned here is unchanged from [RELEASE-2.0.2.md](RELEASE-2.0.2.md) and [RELEASE-2.0.1.md](RELEASE-2.0.1.md).

| | |
|---|---|
| Version | **2.0.3** (iOS "Version", Android `versionName`) |
| Build | **4** (iOS "Build", Android `versionCode`) |
| Bundle / application ID | `co.techcatalyst.gsin` |
| Release name (Play) | **2.0.3 (4): Breaking ticker and alerts** |
| App Store status | Update to the live app (id6824711002) |
| Google Play status | Update to 2.0.2 if that went out; otherwise use the first-launch notes below |
| Uploads | `build/app/outputs/bundle/release/app-release.aab` and `build/ios/ipa/*.ipa` (already built) |

### What changed since 2.0.2

| Change | Commit |
|---|---|
| New breaking-news ticker under the top bar on every tab. It scrolls urgent stories from the last 24 hours, a tap opens the story, and it shows one headline at a time when Reduce Motion is on. | `98b452b` |
| New alerts bell in the top bar, with a dot when something is new. It opens a list of recent breaking and brief alerts, so a missed or dismissed notification can still be opened. | `98b452b` |
| News tab: the lead story and the feed now match the website (lead = editors' pick, else breaking, else latest). Topic filtering is fixed. | `d8b54d2` |
| Server only: push alerts were not being sent because the Firebase service account on Render was invalid. Fixed on 2026-11-09; needs no app update. | (Render env) |

> **Ship the server first.** The bell reads `GET /api/v1/news/alerts`, which is committed on `development` (`98b452b`) but not yet on `main`, which Render deploys. Merge to `main` and confirm `https://gsin-api.onrender.com/api/v1/news/alerts` returns `{"alerts":[…]}` **before** submitting, or reviewers will see "Couldn't load alerts" on the bell. The ticker uses an existing endpoint and works either way.

---

## 1. What's New / release notes

### App Store: "What's New in This Version" (max 4000)

```
Breaking news, front and center.

• New breaking-news ticker: urgent stories scroll across the top of every screen. Tap one to read it.
• New alerts bell: see the breaking stories and new briefs you were notified about, even if you missed the notification.
• The News tab now leads with the editors' pick or the latest breaking story, and topic filters work as expected.
• Breaking-news and brief alerts are being delivered again.
• Bug fixes and performance improvements.
```

### Google Play: release notes (max 500 per language)

```
<en-US>
Breaking news, front and center.
• New breaking-news ticker across the top of every screen
• New alerts bell: catch up on alerts you missed
• News tab leads with the top story; topic filters fixed
• Breaking-news and brief alerts are delivered again
• Bug fixes and performance improvements
</en-US>
```

If no earlier version reached Play production and this is the first launch, use this instead:

```
<en-US>
Welcome to Global Super Intelligence News: a graded feed of AI and the path to superintelligence, swept from 44 primary sources every 30 minutes. Read a morning and an evening brief, follow breaking stories on the live ticker, browse the news by topic, check what to watch over the next 72 hours, and turn on alerts. Free to read.
</en-US>
```

---

## 2. Store listing (both stores)

The name, subtitle, short description and keywords are unchanged. Update the promotional text and the full description; the only change in the description is the new BREAKING NEWS section.

### App Store promotional text (max 170; you can change this without a new review)

```
New in 2.0.3: a live breaking-news ticker and an alerts bell, so you never miss a breaking story or a new brief. Free to read, no account needed.
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

BREAKING NEWS
When a real breaking story lands, it scrolls across the top of every screen. Tap it to read. Turn on alerts to be notified the moment it happens, and open the bell to catch up on any alert you missed. Breaking is reserved for news that is actually breaking.

NEWS
Start with the lead story, then read one clean list grouped by topic, busiest first. Use the topic pills to stick to what you follow.

WATCHLIST
See what is coming next across the field, in one place.

TEN DESKS
Frontier Models & AGI · Defense & National Security · Cybersecurity · Medical & Life Sciences · Policy & Regulation · Private Sector & Enterprise · Compute & Chips · Robotics & Autonomy · AI Safety & Alignment · Open Source & Developer Tools

SOURCES FIRST
Every story links to its original source. Summaries are there to help you decide what to read, not to replace the source.

FREE TO READ
Every story and every brief is free, with no paywall and no account. A free account lets you save stories and join the discussion.

Global Super Intelligence News is operated by Sirlopu Technology Services, LLC (dba TechCatalyst).
```

Unchanged (copy from [RELEASE-2.0.2.md](RELEASE-2.0.2.md)): app name, App Store subtitle, Play short description, App Store keywords.

---

## 3. URLs, categories, ratings and privacy forms

All unchanged. This release collects no new data: the alerts list is public and read-only, and its "seen" state stays on the device. The App Privacy and Data safety answers stay the same.

The age-rating caveat still applies: **the app can't block users yet**, which Apple guideline 1.2 asks for in apps with user comments.

---

## 4. Review notes

### App Store: App Review Information

```
Global Super Intelligence News is free to read with no account. All stories, briefs and the watchlist work without signing in.

A demo account is provided to review the signed-in features: saving stories, commenting and reporting comments on a story, alert settings, change password and account deletion (Account tab).

New in 2.0.3:
- Breaking-news ticker: a blue strip under the top bar appears while a story is marked breaking (urgent stories from the last 24 hours) and is hidden otherwise. Tapping it opens the story.
- Alerts bell (top-right): lists the breaking-news and brief notifications that were sent, newest first. Tapping one opens the story or brief.

Breaking-news alerts use Firebase Cloud Messaging and need a real device. Users can start account deletion in the app: Account > Request account deletion (opens globalsinews.com/delete-account).
```

- **Sign-in required:** check it, and enter the demo account's email and password. Use a seeded active user, and don't paste the credentials into this file.
- **Contact:** name, phone and `support@techcatalyst.co`.
- The ticker only appears while something is breaking. Flag a recent story as Breaking in the Newsroom around submission time so the reviewer sees it.

### Google Play: App access

Unchanged: *"Account tab > Sign in. Reading works without an account; signing in enables saved stories and comments."*

---

## 5. Assets

The screenshots in `store/app-store/`, `store/play-screenshots/` and `store/play-desktop-screenshots/` are from 2.0.1. They don't show the ticker or the bell, and their tab bar still shows News first. They are still accurate enough to reuse, but if you recapture:

1. Run the release build on the **iPhone 17 Pro Max** simulator against production, with the status bar at 9:41 (`xcrun simctl status_bar booted override --time 9:41`), while a story is marked breaking so the ticker shows.
2. Replace the captures in `store/screens/` (`brief.png`, `news.png`, `story.png`, `calendar.png`, `watch.png`). Consider adding an `alerts.png` capture of the bell's list.
3. Run `python3 mobile/store/render_screens.py` to regenerate every App Store and Play size.

The feature graphic and icons are unchanged.

---

## 6. Submission checklist

**Before either store**
- [ ] Merge `development` into `main` so Render deploys `/api/v1/news/alerts`, then check the URL above returns JSON
- [ ] Check the Render logs show no `FIREBASE_SERVICE_ACCOUNT is invalid` line

**iOS**
- [ ] Upload the `.ipa` with Transporter or Xcode Organizer
- [ ] App Store Connect: + Version → **2.0.3**, attach build **4**
- [ ] Paste What's New, and update the promotional text and full description
- [ ] Paste the review notes; confirm the demo account still signs in
- [ ] On a real iPhone: turn on alerts, flag a story Breaking, and confirm the push arrives, the ticker appears, and the bell lists it
- [ ] Decide on screenshots (reuse or recapture, see section 5)
- [ ] Submit for review; release manually or automatically after approval

**Android**
- [ ] Check the bundle is signed with the upload key: `keytool -printcert -jarfile build/app/outputs/bundle/release/app-release.aab | head -3` must not say `androiddebugkey`
- [ ] Create the release **2.0.3 (4): Breaking ticker and alerts**, upload the `.aab`, and paste the release notes (or the first-launch notes)
- [ ] Update the full description
- [ ] On a real Android phone, run the same alert, ticker and bell check
- [ ] Roll out
