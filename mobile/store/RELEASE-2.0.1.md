# Release 2.0.1 (2): store submission copy

Everything to paste into App Store Connect and Google Play Console for this release. Build steps are in [../RELEASE.md](../RELEASE.md).

| | |
|---|---|
| Version | **2.0.1** (iOS "Version", Android `versionName`) |
| Build | **2** (iOS "Build", Android `versionCode`) |
| Bundle / application ID | `co.techcatalyst.gsin` |
| Release name (Play) | **2.0.1 (2): Simpler reading** |
| App Store status | Update to the live app (id6824711002) |
| Google Play status | First production release (the website still says "coming soon") |

---

## 1. What's New / release notes

### App Store: "What's New in This Version" (max 4000)

```
A simpler, faster way to read.

• Four tabs: News, Briefs, Watchlist and Account. Radar is now part of News.
• News opens with topic pills, the lead story and the latest brief, then one clean list.
• Stories are grouped by topic, busiest first. Tap a topic to see all of its stories.
• Briefs: tap the date to open a calendar and jump to any day that has a brief.
• Brief sections (graded calls, critical intelligence, trends, cross-domain insights, watchlist) start collapsed with a count, so you can see what's inside at a glance.
• Cleaner story pages with fewer badges. Breaking stories are still flagged.
• Bug fixes and performance improvements.
```

### Google Play: release notes (max 500 per language)

```
<en-US>
A simpler, faster way to read.
• Four tabs: News, Briefs, Watchlist and Account
• News opens with topic pills, the lead story and the latest brief
• Stories are grouped by topic, busiest first
• Briefs: tap the date to pick any day from a calendar
• Brief sections start collapsed with a count
• Cleaner story pages with fewer badges
• Bug fixes and performance improvements
</en-US>
```

If you would rather present this as the first Play launch than as an update, use this instead:

```
<en-US>
Welcome to Global Super Intelligence News: a graded feed of AI and the path to superintelligence, swept from 34 primary sources every 30 minutes. Read the news by topic, get a morning and an evening brief, check what to watch over the next 72 hours, and turn on breaking-news alerts. Free to read.
</en-US>
```

---

## 2. Store listing (both stores)

Only change these on the App Store if you want to refresh the listing. Google Play needs all of them for the first release.

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
New in 2.0.1: a simpler app. Four tabs, stories grouped by topic, and a calendar for jumping to any day's brief. Free to read, no account needed.
```

### Google Play short description (max 80)

```
AI and superintelligence news, graded from primary sources, twice a day.
```

### Full description (App Store max 4000 / Play max 4000)

```
Global Super Intelligence News is a graded feed of artificial intelligence and the path to superintelligence. Every 30 minutes, the radar sweeps 34 primary sources, including lab announcements, research papers, government releases and company filings, and grades every story against a strict rubric. Analysis and forecasts are always labelled as such.

Real intelligence. A clearer tomorrow.

NEWS
Start with the lead story and the latest brief, then read one clean list grouped by topic, busiest first. Use the topic pills to stick to what you follow. Breaking stories are flagged so they never get buried.

TWO BRIEFS A DAY
A morning edition and an evening edition condense the day into what matters:
• Yesterday's calls, graded: what we said would happen, and whether it did
• Critical intelligence
• Trends and cross-domain insights
• A watchlist for the next 24 to 72 hours
Tap the date to open a calendar and read any past brief.

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

(Words already in the app name, such as "news", "super" and "intelligence", are indexed automatically, so they are left out here.)

---

## 3. URLs and contact

| Field | Value |
|---|---|
| Support URL | `https://globalsinews.com` (or a `/support` page if you add one) |
| Marketing URL (App Store, optional) | `https://globalsinews.com` |
| Privacy policy URL | `https://globalsinews.com/privacy` |
| Account deletion URL (Play) | `https://globalsinews.com/delete-account` |
| Support email | `support@techcatalyst.co` |
| Privacy contact | `privacy@techcatalyst.co` |
| Copyright (App Store) | `2026 Sirlopu Technology Services, LLC` |

---

## 4. Categories and ratings

| | App Store | Google Play |
|---|---|---|
| Primary category | News | News & Magazines |
| Secondary category | Reference (optional) | — |
| Tags (Play) | — | News, Technology news |
| Price | Free | Free |
| Contains ads | — | **No** |
| In-app purchases | None | None |

**Age rating.** Answer the questionnaires truthfully. News coverage of defense and cybersecurity can mention real-world violence, so mark "Infrequent/Mild" for realistic violence if you see it in the feed. Signed-in users can comment, which counts as user-generated content. Apple guideline 1.2 asks for a way to report content (the app has **Report comment**, and admins work the Reported queue in the Newsroom), active moderation, **and a way to block abusive users. The app can't block users yet**, so review may flag it. Adding a "Block user" action on comments before submitting is the safe choice.

**Play target audience.** Pick **18 and over** (or 13+ at the youngest). Including under-13s puts the app under the Families policy.

---

## 5. Privacy forms

### App Store: App Privacy

| Data type | Collected | Linked to user | Tracking | Purpose |
|---|---|---|---|---|
| Email address | Yes | Yes | No | App functionality (account) |
| User ID | Yes | Yes | No | App functionality (account) |
| Other user content (comments) | Yes | Yes | No | App functionality |
| Device ID (push token, Firebase) | Yes | No | No | App functionality (notifications) |

### Google Play: Data safety

- Collects: **Email address**, **User IDs**, **Other user-generated content** (comments), **Device or other IDs** (Firebase Cloud Messaging).
- Purpose: Account management and app functionality. Nothing is used for advertising or analytics.
- Shared with third parties: **No.**
- Encrypted in transit: **Yes.**
- Users can request deletion: **Yes**, in the app (Account) and at the deletion URL.
- Account creation is optional. Reading works without signing in.

---

## 6. Review notes

### App Store: App Review Information

```
Global Super Intelligence News is free to read with no account. All stories, briefs and the watchlist work without signing in.

A demo account is provided to review the signed-in features: saving stories, commenting and reporting comments on a story, breaking-news alert settings, change password and account deletion (Account tab).

Breaking-news alerts use Firebase Cloud Messaging and need a real device. Users can start account deletion in the app: Account > Request account deletion (opens globalsinews.com/delete-account).

What changed in 2.0.1: navigation simplified to four tabs (News, Briefs, Watchlist, Account), stories grouped by topic, and a calendar for picking a brief by date.
```

- **Sign-in required:** check it, and enter the demo account's email and password. Use a seeded active user, and don't paste the credentials into this file.
- **Contact:** name, phone and `support@techcatalyst.co`.

### Google Play: App access

Choose "All or some functionality is restricted", then add the same demo account with the instruction: *"Account tab > Sign in. Reading works without an account; signing in enables saved stories and comments."*

---

## 7. Assets in this repo

| Asset | Path |
|---|---|
| iPhone 6.9" screenshots (required) | `store/app-store/iphone-6.9/` |
| iPhone 6.5" / 6.3" / 6.1" screenshots | `store/app-store/iphone-6.5/`, `iphone-6.3/`, `iphone-6.1/` |
| App preview video | `store/app-store/app-preview/` |
| Play phone screenshots (2–8) | `store/play-screenshots/01-signal.png` … `05-watchlist.png` |
| Play feature graphic 1024×500 | `store/feature-graphic-1024x500.png` |
| Play app icon 512×512 | Export from `assets/` (the launcher icon source) |

**Check the screenshots before you upload.** Several were made before 2.0.1. Any that show the Radar tab, the radar strip or the stats and grading panels no longer match the app. Both stores can reject a listing whose screenshots don't match the build, so retake those from 2.0.1.

---

## 8. Submission checklist

**iOS**
- [ ] `flutter build ipa --release`, then upload with Transporter or Xcode Organizer
- [ ] App Store Connect: + Version → **2.0.1**, attach build **2**
- [ ] Paste What's New, update promotional text and screenshots if needed
- [ ] Confirm the demo account still signs in
- [ ] Submit for review; release manually or automatically after approval

**Android**
- [ ] `flutter build appbundle --release`, and check the signer isn't `androiddebugkey`
- [ ] Complete the main store listing, Data safety, content rating, target audience, ads (No), app access and news app declaration
- [ ] Create a release on **closed testing** first if the account is personal (12 testers for 14 days), otherwise go to production
- [ ] Release name **2.0.1 (2): Simpler reading**, and paste the release notes
- [ ] After it goes live, set `APP_STORES.android` in `client/src/brand.js` to the Play URL so the website stops saying "coming soon"
