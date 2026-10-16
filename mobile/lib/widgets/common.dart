import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../brand.dart';
import '../config.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';

String timeAgo(DateTime? d) {
  if (d == null) return '';
  final mins = DateTime.now().difference(d).inMinutes;
  if (mins < 1) return 'just now';
  if (mins < 60) return '$mins min ago';
  final hrs = (mins / 60).round();
  if (hrs < 24) return '$hrs hr ago';
  final days = (hrs / 24).round();
  if (days < 7) return '$days day${days == 1 ? '' : 's'} ago';
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${m[d.month - 1]} ${d.day}';
}

bool isSafeHttpUrl(String url) {
  final uri = Uri.tryParse(url);
  return uri != null && (uri.scheme == 'http' || uri.scheme == 'https');
}

Future<void> openExternal(String url) async {
  if (!isSafeHttpUrl(url)) return;
  await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
}

/// Premium is purchased on the web (App Store 3.1.1); returns false when
/// link-outs are disabled for this build.
Future<bool> openPremiumOnWeb(String? upgradeUrl) async {
  if (!showUpgradeLinks) return false;
  final url = upgradeUrl ?? '$webBaseUrl/premium';
  await openExternal(url);
  return true;
}

class CategoryLabel extends StatelessWidget {
  const CategoryLabel({super.key, required this.name, this.tappable = true});

  final String? name;
  final bool tappable;

  @override
  Widget build(BuildContext context) {
    if (name == null || name!.isEmpty) return const SizedBox.shrink();
    final meta = categoryMeta(name);
    final p = context.palette;
    final row = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: meta.hue, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(meta.name, style: display(size: 13, weight: FontWeight.w600, color: p.ink2)),
      ],
    );
    if (!tappable) return row;
    return InkWell(
      onTap: () => context.push('/topic/${Uri.encodeComponent(meta.name)}'),
      child: Padding(padding: const EdgeInsets.symmetric(vertical: 2), child: row),
    );
  }
}

class BreakingFlag extends StatelessWidget {
  const BreakingFlag({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
      decoration: BoxDecoration(color: p.flare, borderRadius: BorderRadius.circular(4)),
      child: Text('Breaking', style: display(size: 11.5, weight: FontWeight.w700, color: Colors.white)),
    );
  }
}

class StoryMeta extends StatelessWidget {
  const StoryMeta({super.key, required this.item, this.showCategory = true});

  final NewsItem item;
  final bool showCategory;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final small = display(size: 13, weight: FontWeight.w400, color: p.slate);
    return Wrap(
      spacing: 12,
      runSpacing: 2,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        if (showCategory) CategoryLabel(name: item.category),
        Text(item.source, style: small.copyWith(color: p.ink2, fontWeight: FontWeight.w500)),
        Text(timeAgo(item.published), style: small),
        if (item.commentCount > 0)
          Text('${item.commentCount} comment${item.commentCount == 1 ? '' : 's'}', style: small),
      ],
    );
  }
}

class StoryImage extends StatelessWidget {
  const StoryImage({super.key, required this.url, this.aspect = 16 / 9, this.radius = 12});

  final String? url;
  final double aspect;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final u = url;
    if (u == null || !isSafeHttpUrl(u)) return const SizedBox.shrink();
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: AspectRatio(
        aspectRatio: aspect,
        child: Image.network(
          u,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => ColoredBox(color: context.palette.line),
        ),
      ),
    );
  }
}

/// The lead story: biggest type on the screen.
class LeadStory extends StatelessWidget {
  const LeadStory({super.key, required this.item});

  final NewsItem item;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return InkWell(
      onTap: () => context.push('/story/${item.ref}', extra: item),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            StoryImage(url: item.imageUrl),
            if (item.imageUrl != null) const SizedBox(height: 16),
            if (item.urgent) ...[const BreakingFlag(), const SizedBox(height: 12)],
            Text(item.title, style: display(size: 30, weight: FontWeight.w800, color: p.ink, height: 1.05)),
            if (item.dek != null) ...[
              const SizedBox(height: 10),
              Text(item.dek!, style: reading(size: 18, color: p.ink2, height: 1.4)),
            ],
            const SizedBox(height: 12),
            StoryMeta(item: item),
          ],
        ),
      ),
    );
  }
}

/// Standard list row: text on the left, thumbnail on the right.
class StoryTile extends StatelessWidget {
  const StoryTile({super.key, required this.item, this.showCategory = true, this.compact = false});

  final NewsItem item;
  final bool showCategory;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final hasThumb = !compact && item.imageUrl != null && isSafeHttpUrl(item.imageUrl!);
    return InkWell(
      onTap: () => context.push('/story/${item.ref}', extra: item),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (item.urgent) const Padding(padding: EdgeInsets.only(bottom: 4), child: BreakingFlag()),
                  Text(item.title, style: display(size: compact ? 16 : 18, weight: FontWeight.w700, color: p.ink, height: 1.2)),
                  if (!compact && item.dek != null) ...[
                    const SizedBox(height: 4),
                    Text(item.dek!, maxLines: 3, overflow: TextOverflow.ellipsis, style: reading(size: 15.5, color: p.ink2, height: 1.4)),
                  ],
                  const SizedBox(height: 8),
                  StoryMeta(item: item, showCategory: showCategory),
                ],
              ),
            ),
            if (hasThumb) ...[
              const SizedBox(width: 12),
              SizedBox(width: 92, child: StoryImage(url: item.imageUrl, aspect: 1, radius: 8)),
            ],
          ],
        ),
      ),
    );
  }
}

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key, this.padding = const EdgeInsets.fromLTRB(16, 20, 16, 4)});

  final String text;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) => Padding(
        padding: padding,
        child: Text(text, style: display(size: 14, weight: FontWeight.w700, color: context.palette.slate)),
      );
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.title, required this.body, this.action});

  final String title;
  final String body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: display(size: 24, weight: FontWeight.w800, color: p.ink)),
          const SizedBox(height: 8),
          Text(body, style: reading(size: 17, color: p.ink2)),
          if (action != null) ...[const SizedBox(height: 16), action!],
        ],
      ),
    );
  }
}

/// The exponential-curve brand glyph.
class CurveGlyph extends StatelessWidget {
  const CurveGlyph({super.key, this.size = 26});
  final double size;

  @override
  Widget build(BuildContext context) =>
      CustomPaint(size: Size.square(size), painter: _CurvePainter(context.palette));
}

class _CurvePainter extends CustomPainter {
  _CurvePainter(this.p);
  final AppPalette p;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 32;
    final axis = Paint()
      ..color = p.lineStrong
      ..strokeWidth = 2 * s
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(4 * s, 28 * s), Offset(28 * s, 28 * s), axis);
    final curve = Paint()
      ..color = p.signal
      ..strokeWidth = 3 * s
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    final path = Path()
      ..moveTo(4 * s, 27 * s)
      ..cubicTo(14 * s, 27 * s, 20 * s, 25 * s, 24 * s, 16 * s)
      ..cubicTo(26 * s, 11 * s, 27 * s, 7 * s, 27.5 * s, 3 * s);
    canvas.drawPath(path, curve);
    canvas.drawCircle(Offset(27.5 * s, 3.5 * s), 2.4 * s, Paint()..color = p.flare);
  }

  @override
  bool shouldRepaint(covariant _CurvePainter old) => old.p != p;
}

/// "GSIN" set heavy, with the full name beside it as a two-line lockup.
class Wordmark extends StatelessWidget {
  const Wordmark({super.key, this.size = 22, this.full = true});
  final double size;
  final bool full;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        CurveGlyph(size: size * 1.1),
        const SizedBox(width: 8),
        Text(Brand.short, style: display(size: size, weight: FontWeight.w800, color: p.ink, height: 1)),
        if (full) ...[
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.only(left: 8),
            decoration: BoxDecoration(border: Border(left: BorderSide(color: p.signal, width: 2))),
            child: Text(
              // Two balanced lines: "Global Super" / "Intelligence News"
              '${Brand.name.split(' ').take(2).join(' ')}\n${Brand.name.split(' ').skip(2).join(' ')}',
              maxLines: 2,
              style: display(size: size * 0.42, weight: FontWeight.w600, color: p.ink2, height: 1.15),
            ),
          ),
        ],
      ],
    );
  }
}

/// Inline pitch shown where a Premium feature would be.
class PremiumPitch extends StatelessWidget {
  const PremiumPitch({super.key, required this.title, required this.body, this.upgradeUrl, this.signedIn = true});

  final String title;
  final String body;
  final String? upgradeUrl;
  final bool signedIn;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: p.lineStrong),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: display(size: 17, color: p.ink)),
          const SizedBox(height: 6),
          Text(body, style: reading(size: 16.5, color: p.ink2)),
          const SizedBox(height: 14),
          Wrap(spacing: 10, runSpacing: 8, children: [
            if (showUpgradeLinks)
              FilledButton(
                onPressed: () => openPremiumOnWeb(upgradeUrl),
                child: Text('Get Premium for ${Brand.premiumPrice}/mo'),
              ),
            if (!signedIn)
              OutlinedButton(onPressed: () => context.push('/login'), child: const Text('Sign in')),
          ]),
        ],
      ),
    );
  }
}
