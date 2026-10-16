import 'package:flutter/material.dart';

import 'theme/app_theme.dart';

/// Ad configuration for the app. OFF by default; the app renders no empty
/// boxes while off. See docs/ADS.md for turning on AdMob.
///
///   --dart-define=ADS_PROVIDER=none|preview|admob
///     preview = labeled placeholder boxes, for layout review
const String adsProvider = String.fromEnvironment('ADS_PROVIDER', defaultValue: 'none');

bool get adsEnabled => adsProvider == 'preview' || adsProvider == 'admob';

/// Every place an ad can appear, with the height reserved for it so a
/// loading ad never shifts the screen.
enum AdPlacement {
  homeFeed(250),
  storyInline(250),
  storyEnd(250),
  feedInline(100),
  briefInline(250);

  const AdPlacement(this.height);
  final double height;
}

/// Builds the real ad view once an ad SDK is added. Kept as a hook so the
/// screens never change when ads go live — only this function does.
///
/// To go live with AdMob (docs/ADS.md): add `google_mobile_ads`, put your
/// AdMob app IDs in Info.plist / AndroidManifest.xml, call
/// `MobileAds.instance.initialize()` in main(), and return an `AdWidget`
/// for a loaded `BannerAd` here.
Widget? buildLiveAd(AdPlacement placement) => null;

/// One ad position. Renders nothing while ads are off.
class AdSlot extends StatelessWidget {
  const AdSlot(this.placement, {super.key, this.padded = true});

  final AdPlacement placement;

  /// False when the parent already supplies side padding.
  final bool padded;

  @override
  Widget build(BuildContext context) {
    if (!adsEnabled) return const SizedBox.shrink();
    final live = adsProvider == 'admob' ? buildLiveAd(placement) : null;
    if (adsProvider == 'admob' && live == null) return const SizedBox.shrink();
    final p = context.palette;
    return Padding(
      padding: padded ? const EdgeInsets.all(16) : const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Advertisement', style: TextStyle(color: p.slate, fontSize: 11.5)),
          const SizedBox(height: 6),
          SizedBox(
            height: placement.height,
            width: double.infinity,
            child: live ??
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: p.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: p.lineStrong),
                  ),
                  child: Center(child: Text(placement.name, style: TextStyle(color: p.slate, fontSize: 13))),
                ),
          ),
        ],
      ),
    );
  }
}
