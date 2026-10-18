import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../ads.dart';
import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../api/gsi_api.dart';
import '../brand.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

/// Intelligence: two briefs a day. The Morning Briefing (6:50 AM PT)
/// consolidates the last 24 hours; the Evening Daily Brief (5:25 PM PT) is
/// written by an analyst agent, grades its own forecasts, and is audited before
/// it goes out. Free for everyone.
///
/// Inside the tab shell it opens on the latest edition; as a pushed route
/// (`/intelligence/:date/:type`) it shows one edition with its own app bar.
class IntelligenceScreen extends StatefulWidget {
  const IntelligenceScreen({super.key, this.date, this.type, this.standalone = false});

  final String? date;
  final String? type;
  final bool standalone;

  @override
  State<IntelligenceScreen> createState() => _IntelligenceScreenState();
}

class _IntelligenceScreenState extends State<IntelligenceScreen> {
  DailyBrief? _brief;
  List<Edition> _editions = const [];
  String? _date;
  String? _type;
  bool _loading = true;
  bool _empty = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _date = widget.date;
    _type = widget.type;
    _load();
    _loadEditions();
  }

  Future<void> _loadEditions() async {
    try {
      final e = await context.read<ApiClient>().editions();
      if (mounted) setState(() => _editions = e);
    } catch (_) {
      /* the picker is optional */
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final b = await context.read<ApiClient>().brief(date: _date, type: _type);
      if (!mounted) return;
      setState(() {
        _brief = b;
        _empty = b == null;
        if (b != null) {
          _date = b.dateSlug;
          _type = b.briefType;
        }
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.status == 404 ? 'No brief for that edition yet.' : e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not load the brief. Pull down to try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _pick({String? date, String? type}) {
    setState(() {
      _date = date ?? _date;
      _type = type ?? _type;
      _brief = null;
    });
    _load();
  }

  bool _has(String? date, String type) => _editions.any((e) => e.date == date && e.type == type);

  static String _dayLabel(String ymd) {
    final d = DateTime.tryParse('${ymd}T12:00:00Z');
    if (d == null) return ymd;
    const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${wd[d.weekday - 1]}, ${m[d.month - 1]} ${d.day}';
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final brief = _brief;
    final dates = <String>[];
    for (final e in _editions) {
      if (!dates.contains(e.date)) dates.add(e.date);
    }
    final currentDate = brief?.dateSlug ?? _date ?? (dates.isNotEmpty ? dates.first : null);
    final evening = (brief?.briefType ?? _type) == 'evening';

    final body = RefreshIndicator(
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
              Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Expanded(child: Text('Intelligence', style: display(size: 26, weight: FontWeight.w700, color: p.ink, height: 1))),
                if (dates.length > 1 && currentDate != null)
                  _DayPicker(dates: dates, value: currentDate, label: _dayLabel, onChanged: (d) => _pick(date: d, type: _type ?? 'morning')),
              ]),
              const SizedBox(height: 6),
              Row(children: [
                Expanded(child: Text('Two briefs a day, audited before they go out.', style: reading(size: 13, color: p.slate, height: 1.3))),
                const SizedBox(width: 8),
                const LabelChip(LabelKind.analysis),
              ]),
              const SizedBox(height: 12),
              _Editions(
                evening: evening,
                morningEnabled: currentDate == null || _has(currentDate, 'morning') || _editions.isEmpty,
                eveningEnabled: currentDate == null || _has(currentDate, 'evening') || _editions.isEmpty,
                onPick: (t) => _pick(date: currentDate, type: t),
              ),
            ]),
          ),
          if (_loading && brief == null)
            const RadarLoading(text: 'Opening the brief…')
          else if (_error != null)
            ErrorBlock(text: _error!, onRetry: _load)
          else if (_empty || brief == null)
            EmptyState(
              title: 'No brief yet',
              body: 'The first Morning Briefing goes out at ${_time(Brand.morningHourPT, Brand.morningMinutePT)} Pacific; the Evening Daily Brief at ${_time(Brand.eveningHourPT, Brand.eveningMinutePT)}.',
            )
          else
            BriefBody(brief: brief),
        ],
      ),
    );

    if (!widget.standalone) return body;
    return Scaffold(appBar: AppBar(title: const Wordmark(size: 12)), body: body);
  }

  static String _time(int h, int m) => '${h > 12 ? h - 12 : h}:${m < 10 ? '0$m' : m} ${h >= 12 ? 'PM' : 'AM'}';
}

class _Editions extends StatelessWidget {
  const _Editions({required this.evening, required this.morningEnabled, required this.eveningEnabled, required this.onPick});
  final bool evening;
  final bool morningEnabled;
  final bool eveningEnabled;
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    Widget seg(String text, IconData icon, bool on, bool enabled, VoidCallback tap) => Expanded(
          child: InkWell(
            onTap: enabled ? tap : null,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 9),
              decoration: BoxDecoration(color: on ? p.signal : Colors.transparent, borderRadius: BorderRadius.circular(6)),
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(icon, size: 15, color: on ? p.signalInk : (enabled ? p.ink2 : p.faint)),
                const SizedBox(width: 6),
                Text(text, style: display(size: 12.5, weight: FontWeight.w600, color: on ? p.signalInk : (enabled ? p.ink2 : p.faint))),
              ]),
            ),
          ),
        );
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(8), border: Border.all(color: p.line)),
      child: Row(children: [
        seg('Morning', Icons.wb_sunny_outlined, !evening, morningEnabled, () => onPick('morning')),
        seg('Evening', Icons.nightlight_outlined, evening, eveningEnabled, () => onPick('evening')),
      ]),
    );
  }
}

class _DayPicker extends StatelessWidget {
  const _DayPicker({required this.dates, required this.value, required this.label, required this.onChanged});
  final List<String> dates;
  final String value;
  final String Function(String) label;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final v = dates.contains(value) ? value : dates.first;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(6), border: Border.all(color: p.line)),
      child: DropdownButton<String>(
        value: v,
        isDense: true,
        underline: const SizedBox.shrink(),
        icon: Icon(Icons.expand_more, size: 18, color: p.slate),
        dropdownColor: p.surface,
        style: display(size: 12.5, weight: FontWeight.w600, color: p.ink),
        items: [for (final d in dates) DropdownMenuItem(value: d, child: Text(label(d)))],
        onChanged: (d) {
          if (d != null) onChanged(d);
        },
      ),
    );
  }
}

/// The dossier: cover, then the sections the edition carries.
class BriefBody extends StatelessWidget {
  const BriefBody({super.key, required this.brief});
  final DailyBrief brief;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final body = reading(size: 15, color: p.ink, height: 1.55);
    final evening = brief.isEvening;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Cover.
      Container(
        margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: p.line)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('✦  ${brief.editionName.toUpperCase()}', style: display(size: 10.5, weight: FontWeight.w700, color: p.gold, letterSpacing: 1.3)),
                  const SizedBox(height: 8),
                  Text(brief.label, style: display(size: 22, weight: FontWeight.w700, color: p.ink, height: 1.1)),
                  const SizedBox(height: 6),
                  Text(
                    [
                      brief.scheduleLabel,
                      if (brief.windowStart != null) 'covers ${brief.windowStart} to ${brief.windowEnd ?? ''}',
                      if (brief.items.isNotEmpty) '${brief.items.length} stories',
                      if (brief.generatedAt != null) 'generated ${timeAgo(brief.generatedAt)}',
                    ].join('  ·  '),
                    style: reading(size: 12, color: p.slate, height: 1.4),
                  ),
                ]),
              ),
              if (evening && brief.confidence != null) ...[const SizedBox(width: 12), ConfidenceRing(value: brief.confidence!, size: 60)],
            ]),
          ),
          Divider(color: p.line),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (brief.summary != null && brief.summary!.isNotEmpty) Text(brief.summary!, style: reading(size: 16.5, color: p.ink, height: 1.5)),
              if (brief.plainSummary != null && brief.plainSummary!.isNotEmpty) ...[
                const SizedBox(height: 12),
                PlainEnglish(text: brief.plainSummary!),
              ],
              if (brief.keyPoints.isNotEmpty) ...[
                const SizedBox(height: 14),
                for (final k in brief.keyPoints) _Bullet(k),
              ],
              if (brief.watchToday != null && brief.watchToday!.isNotEmpty) ...[
                const SizedBox(height: 10),
                _Lead('Watching today.', brief.watchToday!),
              ],
              if (brief.horizonNote != null && brief.horizonNote!.isNotEmpty) ...[
                const SizedBox(height: 8),
                _Lead('On the horizon.', brief.horizonNote!),
              ],
              if (brief.qaNote != null && brief.qaNote!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('QA: ${brief.qaNote}', style: reading(size: 12.5, color: p.slate)),
              ],
              if (brief.statsLine != null && brief.statsLine!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(brief.statsLine!, style: reading(size: 12.5, color: p.slate)),
              ],
            ]),
          ),
        ]),
      ),

      if (brief.watchlistFollowup.isNotEmpty) ...[
        const SectionHeader('Yesterday’s calls, graded', trailing: LabelChip(LabelKind.analysis)),
        for (final f in brief.watchlistFollowup)
          _Card(children: [
            GsiChip(f.statusLabel, tier: f.confirmed ? 1 : null),
            const SizedBox(height: 8),
            Text(f.predicted, style: body),
            if (f.evidence != null && f.evidence!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text('Evidence: ${f.evidence}', style: reading(size: 13, color: p.slate)),
            ],
          ]),
      ],

      if (brief.criticalIntelligence.isNotEmpty) ...[
        const SectionHeader('Critical intelligence', trailing: LabelChip(LabelKind.analysis)),
        for (final c in brief.criticalIntelligence)
          _Card(accent: c.high, children: [
            Wrap(spacing: 6, runSpacing: 6, children: [
              GsiChip(c.high ? 'High priority' : 'Medium', tier: c.high ? 1 : null),
              if (c.domain != null) DomainChip(c.domain),
            ]),
            const SizedBox(height: 8),
            Text(c.headline, style: display(size: 15.5, weight: FontWeight.w600, color: p.ink, height: 1.25)),
            if (c.whyItMatters != null && c.whyItMatters!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(c.whyItMatters!, style: reading(size: 14, color: p.ink2, height: 1.45)),
            ],
            if (isSafeHttpUrl(c.url)) ...[
              const SizedBox(height: 6),
              InkWell(
                onTap: () => openExternal(c.url!),
                child: Text('Read the original source ↗', style: display(size: 12.5, weight: FontWeight.w600, color: p.link)),
              ),
            ],
          ]),
      ],

      if (brief.emergingTrends.isNotEmpty) ...[
        const SectionHeader('Emerging trends', trailing: LabelChip(LabelKind.analysis)),
        for (final t in brief.emergingTrends)
          _Card(children: [
            if (t.domain != null) DomainChip(t.domain),
            if (t.domain != null) const SizedBox(height: 8),
            Text(t.trend, style: display(size: 15, weight: FontWeight.w600, color: p.ink, height: 1.25)),
            if (t.evidence != null && t.evidence!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(t.evidence!, style: reading(size: 14, color: p.ink2, height: 1.45)),
            ],
          ]),
      ],

      if (brief.crossDomainInsights.isNotEmpty)
        Container(
          margin: const EdgeInsets.fromLTRB(16, 18, 16, 0),
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
          decoration: BoxDecoration(
            color: p.paperDeep,
            border: Border(left: BorderSide(color: p.gold, width: 2)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('✦  CROSS-DOMAIN INSIGHTS', style: display(size: 10.5, weight: FontWeight.w700, color: p.gold, letterSpacing: 1.3)),
            const SizedBox(height: 8),
            for (final s in brief.crossDomainInsights) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(s, style: body)),
          ]),
        ),

      if (brief.forwardWatchlist.isNotEmpty) ...[
        const SectionHeader('Watchlist, next 24 to 72 hours', trailing: LabelChip(LabelKind.forecast)),
        for (final w in brief.forwardWatchlist) ForecastCard(forecast: w),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
          child: InkWell(
            onTap: () => context.go('/watchlist'),
            child: Text('The analyst grades these against the next day’s events. The full watchlist →',
                style: reading(size: 12.5, color: p.slate)),
          ),
        ),
      ],

      if (brief.items.isNotEmpty) ...[
        const SectionHeader('Stories in this brief', trailing: LabelChip(LabelKind.reporting)),
        for (var i = 0; i < brief.items.length; i++) ...[
          _BriefRow(n: i + 1, item: brief.items[i]),
          if (i == 2 && brief.items.length > 4) const AdSlot(AdPlacement.briefInline),
        ],
      ],
    ]);
  }
}

/// A forecast card, labelled speculative, with its window.
class ForecastCard extends StatelessWidget {
  const ForecastCard({super.key, required this.forecast, this.caption});
  final Forecast forecast;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return _Card(dashed: true, children: [
      Row(children: [
        GsiChip('Next ${forecast.window ?? '72h'}'),
        if (caption != null) ...[const SizedBox(width: 8), Expanded(child: Text(caption!, style: reading(size: 12, color: p.slate)))],
      ]),
      const SizedBox(height: 8),
      Text(forecast.item, style: display(size: 15, weight: FontWeight.w600, color: p.ink, height: 1.25)),
      if (forecast.why != null && forecast.why!.isNotEmpty) ...[
        const SizedBox(height: 6),
        Text(forecast.why!, style: reading(size: 14, color: p.ink2, height: 1.45)),
      ],
    ]);
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.children, this.accent = false, this.dashed = false});
  final List<Widget> children;
  final bool accent;
  final bool dashed;
  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: dashed ? Colors.transparent : p.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: accent ? p.signal : (dashed ? p.lineStrong : p.line)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );
  }
}

class _Bullet extends StatelessWidget {
  const _Bullet(this.text);
  final String text;
  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(width: 6, height: 6, margin: const EdgeInsets.only(top: 8, right: 10), decoration: BoxDecoration(color: p.signal, shape: BoxShape.circle)),
        Expanded(child: Text(text, style: reading(size: 15, color: p.ink, height: 1.5))),
      ]),
    );
  }
}

class _Lead extends StatelessWidget {
  const _Lead(this.lead, this.text);
  final String lead;
  final String text;
  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Text.rich(TextSpan(children: [
      TextSpan(text: '$lead ', style: reading(size: 15, color: p.ink, weight: FontWeight.w600, height: 1.5)),
      TextSpan(text: text, style: reading(size: 15, color: p.ink2, height: 1.5)),
    ]));
  }
}

class _BriefRow extends StatelessWidget {
  const _BriefRow({required this.n, required this.item});
  final int n;
  final BriefItem item;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final tier = item.urgencyTier ?? (item.urgent ? 1 : null);
    return InkWell(
      onTap: () => item.slug != null ? context.push('/story/${Uri.encodeComponent(item.slug!)}') : openExternal(item.url),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 30, child: Text('$n', style: figures(size: 18, color: p.signal, weight: FontWeight.w700, height: 1.1))),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Wrap(spacing: 6, runSpacing: 6, children: [
                if (tier != null) TierChip(tier),
                DomainChip(item.category),
                if (item.primarySource) const GsiChip('Verified source', verified: true),
              ]),
              const SizedBox(height: 7),
              Text(item.title, style: display(size: 15.5, weight: FontWeight.w600, color: p.ink, height: 1.22)),
              if (item.headline != null && item.headline != item.title) ...[
                const SizedBox(height: 4),
                Text(item.headline!, style: reading(size: 14, color: p.ink2, height: 1.4)),
              ],
              if (item.impact != null && item.impact!.isNotEmpty) ...[
                const SizedBox(height: 6),
                _Lead('Why it matters.', item.impact!),
              ],
              if (item.industryLine != null && item.industryLine!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(item.industryLine!, style: reading(size: 13.5, color: p.slate, height: 1.4)),
              ],
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Row(children: [
                  if (item.source != null) Text(item.source!, style: reading(size: 12.5, color: p.slate)),
                  if (item.signalScore != null) ...[const SizedBox(width: 10), SignalMeter(score: item.signalScore!, tier: tier ?? 3)],
                  const Spacer(),
                  if (item.slug != null && item.commentCount > 0) Text('${item.commentCount} comments', style: reading(size: 12.5, color: p.slate)),
                ]),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}
