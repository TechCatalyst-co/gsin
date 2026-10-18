import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/gsi_api.dart';
import '../brand.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import 'intelligence_screen.dart' show ForecastCard;

/// Watchlist: dated facts on a timeline (the two scheduled briefs with live
/// countdowns, then radar-captured upcoming items), and the analyst's forecast
/// kept apart and labelled speculative.
class WatchlistScreen extends StatefulWidget {
  const WatchlistScreen({super.key});

  @override
  State<WatchlistScreen> createState() => _WatchlistScreenState();
}

class _WatchlistScreenState extends State<WatchlistScreen> {
  List<NewsItem> _upcoming = const [];
  DailyBrief? _evening;
  bool _loading = true;
  Timer? _tick;

  @override
  void initState() {
    super.initState();
    _load();
    _tick = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tick?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final api = context.read<ApiClient>();
    final up = api.feed(horizon: 'upcoming', hours: 336, sort: 'latest', limit: 40).catchError((_) => <NewsItem>[]);
    final ev = api.brief(type: 'evening').catchError((_) => null);
    final results = await Future.wait<dynamic>([up, ev]);
    if (!mounted) return;
    setState(() {
      _upcoming = results[0] as List<NewsItem>;
      _evening = results[1] as DailyBrief?;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final morning = nextPacific(Brand.morningHourPT, Brand.morningMinutePT);
    final evening = nextPacific(Brand.eveningHourPT, Brand.eveningMinutePT);
    final scheduled = [
      (when: morning, type: 'morning'),
      (when: evening, type: 'evening'),
    ]..sort((a, b) => a.when.compareTo(b.when));
    final forecasts = _evening?.forwardWatchlist ?? const <Forecast>[];

    return RefreshIndicator(
      color: p.signal,
      backgroundColor: p.surface,
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Watchlist', style: display(size: 26, weight: FontWeight.w700, color: p.ink, height: 1)),
              const SizedBox(height: 6),
              Text('Dated facts first. Forecasts kept apart.', style: reading(size: 13, color: p.slate)),
            ]),
          ),
          const SectionHeader('Dated and scheduled', caption: 'what is certain'),
          for (var i = 0; i < scheduled.length; i++)
            _TimelineRow(
              first: i == 0,
              last: false,
              chip: GsiChip(scheduled[i].type == 'evening' ? 'Evening brief' : 'Morning briefing', tier: i == 0 ? 1 : null),
              when: '${pacificClock(scheduled[i].when)} PT',
              count: countdown(scheduled[i].when),
              title: scheduled[i].type == 'evening'
                  ? 'Evening Daily Brief goes out, with yesterday’s forecasts graded'
                  : 'Morning Briefing consolidates the last 24 hours',
              source: '${Brand.name} · scheduled',
              onTap: () => context.go('/intelligence'),
            ),
          if (_loading)
            const RadarLoading(text: 'Reading the horizon…')
          else ...[
            for (var i = 0; i < _upcoming.length; i++)
              _TimelineRow(
                first: false,
                last: i == _upcoming.length - 1,
                chip: GsiChip('Captured ${timeAgo(_upcoming[i].capturedAt ?? _upcoming[i].published)}'),
                when: _upcoming[i].graded ? 'T${_upcoming[i].tier}' : '',
                count: 'dated event',
                title: _upcoming[i].title,
                source: '${_upcoming[i].source} · ${_upcoming[i].primarySource ? 'Verified primary source' : 'Reported'}',
                onTap: () => openStory(context, _upcoming[i]),
              ),
            if (_upcoming.isEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                child: Text('Items the radar tags as upcoming, with a date or a deadline, appear here.', style: reading(size: 13, color: p.slate)),
              ),
          ],
          const SectionHeader('Next 24 to 72 hours', trailing: LabelChip(LabelKind.forecast)),
          if (forecasts.isEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text(
                _loading ? '' : 'The forecast appears after the first evening brief at 5:25 PM Pacific.',
                style: reading(size: 13, color: p.slate),
              ),
            )
          else ...[
            for (final w in forecasts) ForecastCard(forecast: w, caption: 'from the evening brief'),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
              child: Text(
                'From the evening brief of ${_evening!.label}. The analyst grades these against the next day’s events.',
                style: reading(size: 12.5, color: p.slate),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.first,
    required this.last,
    required this.chip,
    required this.when,
    required this.count,
    required this.title,
    required this.source,
    required this.onTap,
  });
  final bool first;
  final bool last;
  final Widget chip;
  final String when;
  final String count;
  final String title;
  final String source;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
        child: IntrinsicHeight(
          child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          SizedBox(
            width: 18,
            child: Column(children: [
              const SizedBox(height: 6),
              Container(
                width: first ? 12 : 10,
                height: first ? 12 : 10,
                decoration: BoxDecoration(
                  color: first ? p.signal : p.paper,
                  shape: BoxShape.circle,
                  border: Border.all(color: first ? p.signal : p.lineStrong, width: 2),
                ),
              ),
              if (!last) Expanded(child: Container(width: 1, color: p.line)),
            ]),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  chip,
                  if (when.isNotEmpty) ...[const SizedBox(width: 8), Text(when, style: figures(size: 12, color: p.ink2, weight: FontWeight.w600))],
                  const Spacer(),
                  Text(count, style: figures(size: 12, color: first ? p.signal : p.slate, weight: FontWeight.w600)),
                ]),
                const SizedBox(height: 7),
                Text(title, style: display(size: 15, weight: FontWeight.w600, color: p.ink, height: 1.25)),
                const SizedBox(height: 4),
                Text(source, style: reading(size: 12.5, color: p.slate)),
              ]),
            ),
          ),
        ]),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Pacific time without a timezone package: America/Los_Angeles is UTC-7 under
// daylight time (second Sunday of March to first Sunday of November) and UTC-8
// otherwise.

int _pacificOffsetHours(DateTime utc) {
  final y = utc.year;
  DateTime nthSunday(int month, int n) {
    var d = DateTime.utc(y, month, 1);
    while (d.weekday != DateTime.sunday) {
      d = d.add(const Duration(days: 1));
    }
    return d.add(Duration(days: 7 * (n - 1)));
  }
  final dstStart = nthSunday(3, 2).add(const Duration(hours: 10)); // 2 AM PST = 10:00 UTC
  final dstEnd = nthSunday(11, 1).add(const Duration(hours: 9)); // 2 AM PDT = 09:00 UTC
  return utc.isAfter(dstStart) && utc.isBefore(dstEnd) ? -7 : -8;
}

/// The next time it is [hour]:[minute] in Los Angeles, as a local DateTime.
DateTime nextPacific(int hour, int minute) {
  final nowUtc = DateTime.now().toUtc();
  final off = _pacificOffsetHours(nowUtc);
  final nowPt = nowUtc.add(Duration(hours: off));
  var target = DateTime.utc(nowPt.year, nowPt.month, nowPt.day, hour, minute);
  if (!target.isAfter(nowPt)) target = target.add(const Duration(days: 1));
  return target.subtract(Duration(hours: off)).toLocal();
}

/// `6:50 AM` for a local DateTime, shown on the Pacific clock.
String pacificClock(DateTime local) {
  final utc = local.toUtc();
  final pt = utc.add(Duration(hours: _pacificOffsetHours(utc)));
  final h = pt.hour % 12 == 0 ? 12 : pt.hour % 12;
  final m = pt.minute < 10 ? '0${pt.minute}' : '${pt.minute}';
  return '$h:$m ${pt.hour >= 12 ? 'PM' : 'AM'}';
}

String countdown(DateTime when) {
  final s = math.max(0, when.difference(DateTime.now()).inSeconds);
  final days = s ~/ 86400, h = (s % 86400) ~/ 3600, m = (s % 3600) ~/ 60;
  if (days > 0) return h > 0 ? 'in ${days}d ${h}h' : 'in ${days}d';
  if (h > 0) return 'in ${h}h ${m}m';
  return 'in ${m < 1 ? 1 : m}m';
}
