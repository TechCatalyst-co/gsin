import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/gsi_api.dart';
import '../brand.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import 'common.dart';

/// What the radar is doing, shared by every tab: polled once a minute from
/// GET /news/status and re-rendered every 30 s so the ages stay honest.
class RadarState extends ChangeNotifier {
  RadarState(this._api);
  final ApiClient _api;
  RadarStatus? status;
  Timer? _poll;
  Timer? _tick;

  void start() {
    refresh();
    _poll ??= Timer.periodic(const Duration(seconds: 60), (_) => refresh());
    _tick ??= Timer.periodic(const Duration(seconds: 30), (_) => notifyListeners());
  }

  Future<void> refresh() async {
    try {
      status = await _api.status();
      notifyListeners();
    } catch (_) {
      /* the strip keeps the last reading */
    }
  }

  int get sourceCount => status?.sourceCount ?? Brand.sourceCount;

  @override
  void dispose() {
    _poll?.cancel();
    _tick?.cancel();
    super.dispose();
  }
}

/// The live strip under the app bar: LIVE dot, last sweep, 24-hour counts,
/// the latest brief.
class RadarStrip extends StatelessWidget {
  const RadarStrip({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final radar = context.watch<RadarState>();
    final s = radar.status;
    final live = s?.lastCaptureAt != null && DateTime.now().difference(s!.lastCaptureAt!).inMinutes < 90;
    final label = display(size: 10.5, weight: FontWeight.w600, color: p.slate, letterSpacing: 0.4);
    final value = figures(size: 11.5, color: p.ink, weight: FontWeight.w600);

    Widget cell(String k, String v) => Padding(
          padding: const EdgeInsets.only(right: 14),
          child: Row(mainAxisSize: MainAxisSize.min, children: [Text(k, style: label), const SizedBox(width: 5), Text(v, style: value)]),
        );

    return Container(
      height: 32,
      decoration: BoxDecoration(color: p.paperDeep, border: Border(bottom: BorderSide(color: p.line))),
      child: Row(children: [
        const SizedBox(width: 16),
        _LiveDot(on: live),
        const SizedBox(width: 6),
        Text(live ? 'LIVE' : 'RADAR', style: display(size: 10.5, weight: FontWeight.w700, color: live ? p.signal : p.slate, letterSpacing: 1)),
        const SizedBox(width: 14),
        Expanded(
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              cell('last sweep', s == null ? '…' : (s.lastCaptureAt == null ? 'waiting' : timeAgo(s.lastCaptureAt))),
              cell('24h', s == null ? '…' : '${s.stories24h} stories'),
              cell('breaking', s == null ? '…' : '${s.breaking24h}'),
              cell('sources', '${radar.sourceCount}'),
              if (s?.latestBriefAt != null) cell(s!.latestBriefType == 'evening' ? 'evening brief' : 'morning brief', timeAgo(s.latestBriefAt)),
              const SizedBox(width: 8),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _LiveDot extends StatefulWidget {
  const _LiveDot({required this.on});
  final bool on;
  @override
  State<_LiveDot> createState() => _LiveDotState();
}

class _LiveDotState extends State<_LiveDot> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    if (!widget.on || reduceMotion(context)) {
      return Container(width: 7, height: 7, decoration: BoxDecoration(color: widget.on ? p.signal : p.faint, shape: BoxShape.circle));
    }
    return FadeTransition(
      opacity: Tween(begin: 0.35, end: 1.0).animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut)),
      child: Container(width: 7, height: 7, decoration: BoxDecoration(color: p.signal, shape: BoxShape.circle)),
    );
  }
}

/// Headline ticker: the strongest titles scrolling once across the strip.
class HeadlineTicker extends StatefulWidget {
  const HeadlineTicker({super.key, required this.items});
  final List<NewsItem> items;

  @override
  State<HeadlineTicker> createState() => _TickerState();
}

class _TickerState extends State<HeadlineTicker> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(seconds: 60))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    if (widget.items.isEmpty) return const SizedBox.shrink();
    final still = reduceMotion(context);
    final style = reading(size: 12.5, color: p.ink2, height: 1);
    final rowItems = <Widget>[
      for (final it in widget.items.take(8)) ...[
        TierChip(it.tier),
        const SizedBox(width: 8),
        InkWell(onTap: () => openStory(context, it), child: Text(it.title, style: style)),
        const SizedBox(width: 28),
      ],
    ];
    final row = Row(mainAxisSize: MainAxisSize.min, children: rowItems);
    return Container(
      height: 30,
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
      clipBehavior: Clip.hardEdge,
      child: still
          ? SingleChildScrollView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16), child: row)
          : LayoutBuilder(builder: (context, box) {
              return AnimatedBuilder(
                animation: _c,
                builder: (context, _) => Stack(children: [
                  Positioned.fill(
                    child: OverflowBox(
                      alignment: Alignment.centerLeft,
                      maxWidth: double.infinity,
                      child: FractionalTranslation(
                        translation: Offset(-_c.value * 0.5, 0),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          SizedBox(width: box.maxWidth),
                          row,
                          SizedBox(width: box.maxWidth),
                          row,
                        ]),
                      ),
                    ),
                  ),
                ]),
              );
            }),
    );
  }
}
