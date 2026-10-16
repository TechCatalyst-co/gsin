# Ads

GSIN is free. Ad positions are already built into the web and app layouts and are **switched off** until you configure them; while off, nothing renders and no ad scripts load.

## Where ads appear

| Placement | Web | App | Position |
| --- | --- | --- | --- |
| `home-feed` / `homeFeed` | ✓ | ✓ | After every 6th story in Latest |
| `home-sidebar` | ✓ | | Home sidebar, under the Daily Brief card |
| `feed-inline` / `feedInline` | ✓ | ✓ | Topic and search feeds, after every 8th story |
| `story-inline` / `storyInline` | ✓ | ✓ | Between "Why it matters" and the analysis (only on stories with analysis) |
| `story-end` / `storyEnd` | ✓ | ✓ | After the story, before the discussion |
| `brief-inline` / `briefInline` | ✓ | ✓ | After the 3rd story in the Daily Brief (briefs with 5+ stories) |

Every slot is labeled "Advertisement" and reserves its height, so loading ads don't shift the page. Change positions in `client/src/pages/*.jsx` and `mobile/lib/screens/*.dart`.

## Preview the layout

```bash
# Web: dashed placeholder boxes in every slot
cd client && VITE_ADS_PROVIDER=preview npm run dev

# App
cd mobile && flutter run --dart-define=ADS_PROVIDER=preview
```

## Turn on ads: web (Google AdSense)

1. Apply for AdSense with your production domain and get approved.
2. Create one display ad unit per placement you want to use.
3. Set these in Netlify (Site settings → Environment variables) and redeploy:
   ```
   VITE_ADS_PROVIDER=adsense
   VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
   VITE_AD_SLOT_HOME_FEED=...
   VITE_AD_SLOT_HOME_SIDEBAR=...
   VITE_AD_SLOT_STORY_INLINE=...
   VITE_AD_SLOT_STORY_END=...
   VITE_AD_SLOT_FEED_INLINE=...
   VITE_AD_SLOT_BRIEF_INLINE=...
   ```
   A placement without a slot ID stays empty.
4. Add `client/public/ads.txt` with the line AdSense gives you (for example `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`).
5. Consent: for visitors in the EEA, UK, and Switzerland you need a Google-certified consent banner (CMP). Turn on Google's own "Privacy & messaging" CMP in AdSense, or add a third-party CMP, before going live in those regions.

The loader lives in `client/src/ads.js`; the slot component is `client/src/components/AdSlot.jsx`.

## Turn on ads: app (Google AdMob)

The app ships without an ad SDK, so builds stay review-safe until you're ready. To go live:

1. Create the app in AdMob (iOS and Android) and one banner ad unit per placement.
2. Add the SDK: `flutter pub add google_mobile_ads`.
3. Add your AdMob app IDs:
   - iOS `ios/Runner/Info.plist`: `GADApplicationIdentifier` = `ca-app-pub-…~…`, plus the `SKAdNetworkItems` list from Google's docs.
   - Android `android/app/src/main/AndroidManifest.xml`, inside `<application>`:
     `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-…~…"/>`
4. In `lib/main.dart`, call `await MobileAds.instance.initialize();` before `runApp`.
5. In `lib/ads.dart`, implement `buildLiveAd(placement)` to return an `AdWidget` for a loaded `BannerAd` (ad unit ID per placement, size to fit the reserved height). Screens don't change.
6. Build with `--dart-define=ADS_PROVIDER=admob`.
7. Consent and privacy:
   - Use Google's User Messaging Platform (included with `google_mobile_ads`) to collect consent in the EEA/UK before loading ads.
   - iOS: if you serve personalized ads, show the App Tracking Transparency prompt and add `NSUserTrackingUsageDescription` to Info.plist.
   - Update the App Store privacy label and the Google Play Data safety form to declare advertising data.

## Policy reminders

- Don't place ads where they look like stories, and keep the "Advertisement" label.
- Don't click your own ads or ask readers to.
- The Privacy and Terms pages already include an advertising section (`client/src/pages/Privacy.jsx`, `Terms.jsx`); have them reviewed before launch.
