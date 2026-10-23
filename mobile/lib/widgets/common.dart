import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../brand.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';

// ---------------------------------------------------------------------------
// Helpers

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

/// Short form for chips: 12m, 3h, 2d.
String ageShort(DateTime? d) {
  if (d == null) return '—';
  final mins = DateTime.now().difference(d).inMinutes;
  if (mins < 1) return 'now';
  if (mins < 60) return '${mins}m';
  final hrs = mins ~/ 60;
  if (hrs < 48) return '${hrs}h';
  return '${hrs ~/ 24}d';
}

bool isSafeHttpUrl(String? url) {
  if (url == null) return false;
  final uri = Uri.tryParse(url);
  return uri != null && (uri.scheme == 'http' || uri.scheme == 'https');
}

Future<void> openExternal(String url) async {
  if (!isSafeHttpUrl(url)) return;
  await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
}

/// Where a story opens: its grouped story page when the radar gave it a key,
/// else the single item.
void openStory(BuildContext context, NewsItem item) {
  context.push('/story/${Uri.encodeComponent(item.ref)}', extra: item);
}

bool reduceMotion(BuildContext context) => MediaQuery.maybeDisableAnimationsOf(context) ?? false;

// ---------------------------------------------------------------------------
// Brand

/// The Global SI symbol (assets/brand/mark.png).
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 26});
  final double size;

  @override
  Widget build(BuildContext context) =>
      Image.asset('assets/brand/mark.png', width: size, height: size, filterQuality: FilterQuality.medium);
}

/// Kept for older screens; the mark is the brand glyph now.
class CurveGlyph extends StatelessWidget {
  const CurveGlyph({super.key, this.size = 26});
  final double size;
  @override
  Widget build(BuildContext context) => BrandMark(size: size);
}

/// The mark with the gold wordmark: "✦ GLOBAL SI NEWS".
class Wordmark extends StatelessWidget {
  const Wordmark({super.key, this.size = 13, this.full = true, this.showMark = true});
  final double size;
  final bool full;
  final bool showMark;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (showMark) ...[BrandMark(size: size * 2), SizedBox(width: size * 0.7)],
        Text(
          full ? '✦  GLOBAL SI NEWS' : '✦  GSI',
          style: display(size: size, weight: FontWeight.w700, color: p.gold, letterSpacing: size * 0.16, height: 1),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Chips

/// A flat 4px-radius chip. `tier` colors it as T1/T2; `verified` is the
/// primary-source seal; `gold` is for insight labels only.
class GsiChip extends StatelessWidget {
  const GsiChip(this.text, {super.key, this.tier, this.verified = false, this.gold = false, this.dot});
  final String text;
  final int? tier;
  final bool verified;
  final bool gold;
  final Color? dot;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    Color bg = p.surface, fg = p.ink2, border = p.line;
    if (tier == 1) {
      bg = p.signal;
      fg = p.signalInk;
      border = p.signal;
    } else if (tier == 2) {
      bg = p.signalSoft;
      fg = p.isDark ? p.link : p.signal;
      border = p.signalSoft;
    } else if (verified) {
      bg = Colors.transparent;
      fg = p.isDark ? p.link : p.signal;
      border = p.signal.withValues(alpha: 0.6);
    } else if (gold) {
      bg = Colors.transparent;
      fg = p.gold;
      border = p.gold.withValues(alpha: 0.55);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4), border: Border.all(color: border)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (dot != null) ...[
          Container(width: 6, height: 6, decoration: BoxDecoration(color: dot, shape: BoxShape.circle)),
          const SizedBox(width: 5),
        ],
        if (verified) ...[Icon(Icons.verified_outlined, size: 12, color: fg), const SizedBox(width: 4)],
        Text(text, style: display(size: 11, weight: FontWeight.w600, color: fg, letterSpacing: 0.2, height: 1.1)),
      ]),
    );
  }
}

class TierChip extends StatelessWidget {
  const TierChip(this.tier, {super.key, this.long = false});
  final int tier;
  final bool long;
  @override
  Widget build(BuildContext context) =>
      GsiChip(long ? 'T$tier ${tierName[tier] ?? ''}'.trim() : 'T$tier', tier: tier <= 2 ? tier : null);
}

class DomainChip extends StatelessWidget {
  const DomainChip(this.name, {super.key, this.tappable = false});
  final String? name;
  final bool tappable;
  @override
  Widget build(BuildContext context) {
    if (name == null || name!.isEmpty) return const SizedBox.shrink();
    final meta = categoryMeta(name);
    final chip = GsiChip(meta.short, dot: meta.hue);
    if (!tappable) return chip;
    return InkWell(onTap: () => context.push('/topic/${Uri.encodeComponent(meta.name)}'), child: chip);
  }
}

/// Reporting vs analysis vs forecast, as the style guide requires.
enum LabelKind { reporting, analysis, forecast }

class LabelChip extends StatelessWidget {
  const LabelChip(this.kind, {super.key});
  final LabelKind kind;
  @override
  Widget build(BuildContext context) => switch (kind) {
        LabelKind.reporting => const GsiChip('Verified reporting', verified: true),
        LabelKind.analysis => const GsiChip('AI-generated analysis', gold: true),
        LabelKind.forecast => const GsiChip('Speculative forecast'),
      };
}

/// Signal score as a thin segmented meter with the number.
class SignalMeter extends StatelessWidget {
  const SignalMeter({super.key, required this.score, this.tier = 3, this.width = 64});
  final int score;
  final int tier;
  final double width;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final color = tier == 1 ? p.signal : (tier == 2 ? p.link : p.slate);
    final filled = (score / 20).ceil().clamp(0, 5).toInt();
    return Row(mainAxisSize: MainAxisSize.min, children: [
      for (var i = 0; i < 5; i++)
        Container(
          width: (width - 8) / 5,
          height: 6,
          margin: EdgeInsets.only(right: i == 4 ? 0 : 2),
          decoration: BoxDecoration(color: i < filled ? color : p.line, borderRadius: BorderRadius.circular(1)),
        ),
      const SizedBox(width: 6),
      Text('$score', style: figures(size: 12, color: p.ink2, weight: FontWeight.w600)),
    ]);
  }
}

/// The QA stage's confidence, 0–100, as a ring.
class ConfidenceRing extends StatelessWidget {
  const ConfidenceRing({super.key, required this.value, this.size = 64});
  final int value;
  final double size;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _ArcPainter(value: value / 100, track: p.line, fill: p.signal, stroke: size * 0.08, sweep: 2 * math.pi),
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text('$value', style: figures(size: size * 0.3, color: p.ink, weight: FontWeight.w700, height: 1)),
            Text('QA', style: display(size: size * 0.14, weight: FontWeight.w600, color: p.slate, letterSpacing: 1)),
          ]),
        ),
      ),
    );
  }
}

class _ArcPainter extends CustomPainter {
  _ArcPainter({required this.value, required this.track, required this.fill, required this.stroke, required this.sweep});
  final double value;
  final Color track;
  final Color fill;
  final double stroke;
  final double sweep;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(stroke / 2, stroke / 2, size.width - stroke, size.height - stroke);
    final start = sweep >= 2 * math.pi ? -math.pi / 2 : math.pi / 2 + (2 * math.pi - sweep) / 2;
    final base = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;
    canvas.drawArc(rect, start, sweep, false, base..color = track);
    canvas.drawArc(rect, start, sweep * value.clamp(0.0, 1.0).toDouble(), false, base..color = fill);
  }

  @override
  bool shouldRepaint(covariant _ArcPainter old) =>
      old.value != value || old.track != track || old.fill != fill || old.stroke != stroke;
}

/// One reading on an instrument strip: a value with a small label under it.
class Reading extends StatelessWidget {
  const Reading({super.key, required this.label, this.value, this.child});
  final String label;
  final String? value;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Expanded(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        SizedBox(
          height: 46,
          child: Center(child: child ?? Text(value ?? '—', style: display(size: 22, weight: FontWeight.w700, color: p.ink, height: 1))),
        ),
        const SizedBox(height: 4),
        Text(label, style: display(size: 10, weight: FontWeight.w600, color: p.slate, letterSpacing: 0.6)),
      ]),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader(this.title, {super.key, this.caption, this.trailing, this.padding = const EdgeInsets.fromLTRB(16, 18, 16, 8)});
  final String title;
  final String? caption;
  final Widget? trailing;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: padding,
      child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        if (caption != null) ...[
          Text(title, style: display(size: 15, weight: FontWeight.w700, color: p.ink)),
          const SizedBox(width: 8),
          Expanded(child: Text(caption!, style: reading(size: 12, color: p.slate, height: 1.3), overflow: TextOverflow.ellipsis)),
        ] else
          // Title takes the slack and wraps, so a long title never pushes the trailing chip off-screen.
          Expanded(child: Text(title, style: display(size: 15, weight: FontWeight.w700, color: p.ink))),
        if (trailing != null) ...[const SizedBox(width: 8), trailing!],
      ]),
    );
  }
}

/// Older screens use this name.
class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key, this.padding = const EdgeInsets.fromLTRB(16, 18, 16, 8)});
  final String text;
  final EdgeInsets padding;
  @override
  Widget build(BuildContext context) => SectionHeader(text, padding: padding);
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
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const MiniRadar(size: 40),
          const SizedBox(height: 14),
          Text(title, style: display(size: 20, weight: FontWeight.w700, color: p.ink, height: 1.2)),
          const SizedBox(height: 8),
          Text(body, style: reading(size: 15, color: p.ink2)),
          if (action != null) ...[const SizedBox(height: 16), action!],
        ],
      ),
    );
  }
}

class ErrorBlock extends StatelessWidget {
  const ErrorBlock({super.key, required this.text, this.onRetry});
  final String text;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(8), border: Border.all(color: p.lineStrong)),
      child: Row(children: [
        Icon(Icons.wifi_tethering_error, color: p.flare, size: 20),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: reading(size: 14, color: p.ink))),
        if (onRetry != null) TextButton(onPressed: onRetry, child: const Text('Try again')),
      ]),
    );
  }
}

/// Loading state: the small radar sweeping.
class RadarLoading extends StatelessWidget {
  const RadarLoading({super.key, this.text = 'Sweeping the radar…'});
  final String text;
  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const MiniRadar(size: 56),
        const SizedBox(height: 14),
        Text(text, style: reading(size: 13, color: p.slate)),
      ]),
    );
  }
}

/// A small radar: two rings and a sweeping hand. Static when motion is reduced.
class MiniRadar extends StatefulWidget {
  const MiniRadar({super.key, this.size = 56, this.period = const Duration(milliseconds: 2400)});
  final double size;
  final Duration period;

  @override
  State<MiniRadar> createState() => _MiniRadarState();
}

class _MiniRadarState extends State<MiniRadar> with SingleTickerProviderStateMixin {
  late final Ticker _ticker;
  double _t = 0;

  @override
  void initState() {
    super.initState();
    _ticker = createTicker((elapsed) {
      setState(() => _t = (elapsed.inMilliseconds % widget.period.inMilliseconds) / widget.period.inMilliseconds);
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final still = reduceMotion(context);
    if (still && _ticker.isActive) _ticker.stop();
    if (!still && !_ticker.isActive) _ticker.start();
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: CustomPaint(painter: _MiniRadarPainter(angle: _t * 2 * math.pi - math.pi / 2, blue: p.signal)),
    );
  }
}

class _MiniRadarPainter extends CustomPainter {
  _MiniRadarPainter({required this.angle, required this.blue});
  final double angle;
  final Color blue;

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final r = size.shortestSide / 2 - 1;
    final ring = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    canvas.drawCircle(c, r, ring..color = blue.withValues(alpha: 0.5));
    canvas.drawCircle(c, r * 0.5, ring..color = blue.withValues(alpha: 0.3));
    canvas.drawLine(c, c + Offset(math.cos(angle), math.sin(angle)) * r, Paint()
      ..color = blue
      ..strokeWidth = 1.5);
    canvas.drawCircle(c, 2, Paint()..color = blue);
  }

  @override
  bool shouldRepaint(covariant _MiniRadarPainter old) => old.angle != angle || old.blue != blue;
}

// ---------------------------------------------------------------------------
// Stories

class StoryImage extends StatelessWidget {
  const StoryImage({super.key, required this.url, this.aspect = 16 / 9, this.radius = 10});
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
          errorBuilder: (_, _, _) => ColoredBox(color: context.palette.line),
        ),
      ),
    );
  }
}

/// Source, age, kind, corroboration, comments, and the signal meter.
class StoryMeta extends StatelessWidget {
  const StoryMeta({super.key, required this.item, this.showCategory = false, this.showSignal = true});
  final NewsItem item;
  final bool showCategory;
  final bool showSignal;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final small = reading(size: 12.5, color: p.slate, height: 1.3);
    return Row(children: [
      Expanded(
        child: Wrap(spacing: 10, runSpacing: 2, crossAxisAlignment: WrapCrossAlignment.center, children: [
          if (showCategory && item.category != null) Text(domainShort(item.category), style: small.copyWith(color: p.ink2)),
          Text(item.source, style: small.copyWith(color: p.ink2, fontWeight: FontWeight.w500)),
          Text(timeAgo(item.published), style: small),
          if (item.commentCount > 0) Text('${item.commentCount} comment${item.commentCount == 1 ? '' : 's'}', style: small),
        ]),
      ),
      if (showSignal && item.signalScore != null) ...[
        const SizedBox(width: 8),
        SignalMeter(score: item.signalScore!, tier: item.tier),
      ],
    ]);
  }
}

/// The lead story: a breaking flag when it is one, the biggest type on the
/// screen, its impact, one meta line, and the two actions.
class LeadStory extends StatelessWidget {
  const LeadStory({super.key, required this.item});
  final NewsItem item;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final dek = item.impact ?? item.headline ?? item.summary;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (item.tier == 1 && (item.graded || item.urgent)) ...[const TierChip(1, long: true), const SizedBox(height: 12)],
        InkWell(
          onTap: () => openStory(context, item),
          child: Text(item.title, style: display(size: 27, weight: FontWeight.w700, color: p.ink, height: 1.12, letterSpacing: -0.4)),
        ),
        if (dek != null && dek.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(dek, style: reading(size: 15.5, color: p.ink2, height: 1.45)),
        ],
        const SizedBox(height: 10),
        StoryMeta(item: item, showCategory: true, showSignal: false),
        const SizedBox(height: 12),
        Row(children: [
          FilledButton(onPressed: () => openStory(context, item), child: const Text('Open the story')),
          const SizedBox(width: 8),
          if (isSafeHttpUrl(item.url))
            Flexible(
              child: OutlinedButton.icon(
                onPressed: () => openExternal(item.url),
                icon: const Icon(Icons.open_in_new, size: 16),
                label: const Text('Original source', overflow: TextOverflow.ellipsis),
              ),
            ),
        ]),
      ]),
    );
  }
}

/// "In plain English": the industry line, gold-labelled.
class PlainEnglish extends StatelessWidget {
  const PlainEnglish({super.key, required this.text});
  final String text;
  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 11),
      decoration: BoxDecoration(
        border: Border(left: BorderSide(color: p.gold, width: 2)),
        color: p.paperDeep,
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('✦  IN PLAIN ENGLISH', style: display(size: 10, weight: FontWeight.w700, color: p.gold, letterSpacing: 1.2)),
        const SizedBox(height: 5),
        Text(text, style: reading(size: 14.5, color: p.ink, height: 1.45)),
      ]),
    );
  }
}

/// Standard list row: tier rail on the left, a breaking flag when it is one,
/// headline, dek and one meta line. Thumbnail on the right when there is one.
class StoryTile extends StatelessWidget {
  const StoryTile({super.key, required this.item, this.showCategory = true, this.compact = false});
  final NewsItem item;
  final bool showCategory;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final hasThumb = !compact && isSafeHttpUrl(item.imageUrl);
    final rail = item.tier <= 2 ? p.tierColor(item.tier) : (item.tier == 3 ? p.lineStrong : p.line);
    return InkWell(
      onTap: () => openStory(context, item),
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 14, 16, 14),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: p.line), left: BorderSide(color: rail, width: 3)),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (!compact && item.tier == 1 && (item.graded || item.urgent)) ...[
                const TierChip(1, long: true),
                const SizedBox(height: 8),
              ],
              Text(item.title,
                  style: display(size: compact ? 15 : 16.5, weight: FontWeight.w600, color: p.ink, height: 1.22)),
              if (!compact && item.dek != null) ...[
                const SizedBox(height: 5),
                Text(item.dek!, maxLines: 2, overflow: TextOverflow.ellipsis, style: reading(size: 14, color: p.ink2, height: 1.4)),
              ],
              const SizedBox(height: 8),
              StoryMeta(item: item, showCategory: showCategory, showSignal: false),
            ]),
          ),
          if (hasThumb) ...[
            const SizedBox(width: 12),
            SizedBox(width: 84, child: StoryImage(url: item.imageUrl, aspect: 1, radius: 6)),
          ],
        ]),
      ),
    );
  }
}

/// A horizontal chip row that filters by desk.
class FilterPills extends StatelessWidget {
  const FilterPills({super.key, required this.selected, required this.onChanged, this.padding = const EdgeInsets.fromLTRB(16, 4, 16, 10)});
  final String? selected;
  final ValueChanged<String?> onChanged;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    Widget pill(String text, bool on, VoidCallback tap) => Padding(
          padding: const EdgeInsets.only(right: 6),
          child: InkWell(
            onTap: tap,
            borderRadius: BorderRadius.circular(4),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: on ? p.signal : p.surface,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: on ? p.signal : p.line),
              ),
              child: Text(text, style: display(size: 12, weight: FontWeight.w600, color: on ? p.signalInk : p.ink2)),
            ),
          ),
        );
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: padding,
      child: Row(children: [
        pill('All', selected == null, () => onChanged(null)),
        for (final c in categories) pill(c.short, selected == c.name, () => onChanged(c.name)),
      ]),
    );
  }
}
