import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../ads.dart';
import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../api/gsi_api.dart';
import '../auth/auth_state.dart';
import '../brand.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/radar_strip.dart';

/// Signal: the home tab. Ticker, the lead story as an instrument panel, lanes
/// by desk, the two briefs, then the graded feed (tiers 1–3 from the last seven
/// days, strongest first).
class SignalScreen extends StatefulWidget {
  const SignalScreen({super.key});

  @override
  State<SignalScreen> createState() => _SignalScreenState();
}

class _SignalScreenState extends State<SignalScreen> {
  List<NewsItem>? _items;
  List<NewsItem> _fallback = const [];
  List<DailyBrief> _briefs = const [];
  String? _filter;
  String? _error;
  String? _loadedFor;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Reload when the signed-in user changes (bookmarks, staff fields).
    final uid = Provider.of<AuthState>(context).user?.id ?? '';
    if (_loadedFor != uid) {
      _loadedFor = uid;
      _load();
    }
  }

  Future<void> _load() async {
    final api = context.read<ApiClient>();
    try {
      final results = await Future.wait<dynamic>([
        api.feed(tier: 3, sort: 'signal', hours: 168, limit: 50),
        api.briefList(limit: 4).catchError((_) => <DailyBrief>[]),
      ]);
      var items = results[0] as List<NewsItem>;
      // Before the radar has graded anything, show whatever the wire has.
      if (items.isEmpty) {
        _fallback = await api.feed(sort: 'latest', limit: 30).catchError((_) => <NewsItem>[]);
      } else {
        _fallback = const [];
      }
      if (!mounted) return;
      setState(() {
        _items = items;
        _briefs = results[1] as List<DailyBrief>;
        _error = null;
      });
      context.read<RadarState>().refresh();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = 'Could not read the feed. Pull down to try again.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final items = _items;
    final radar = context.watch<RadarState>();

    if (items == null) {
      return _error != null
          ? ListView(children: [ErrorBlock(text: _error!, onRetry: _load)])
          : const Center(child: RadarLoading());
    }

    final pool = items.isNotEmpty ? items : _fallback;
    final lead = _filter == null && pool.isNotEmpty ? pool.first : null;
    final filtered = _filter == null ? pool : pool.where((i) => i.category == _filter).toList();
    final rest = lead == null ? filtered : filtered.where((i) => i.id != lead.id).toList();

    return RefreshIndicator(
      color: p.signal,
      backgroundColor: p.surface,
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        children: [
          HeadlineTicker(items: pool.take(8).toList()),
          if (pool.isEmpty)
            EmptyState(
              title: 'The radar is live and nothing has cleared the bar yet.',
              body: 'Stories appear here the moment one grades Tier 1 to 3. The radar sweeps ${radar.sourceCount} sources every 30 minutes.',
            )
          else ...[
            if (lead != null) ...[
              LeadStory(item: lead),
              Divider(color: p.line),
              _Lanes(items: pool, onPick: (name) => setState(() => _filter = name)),
              Divider(color: p.line),
            ],
            if (_filter == null && _briefs.isNotEmpty) ...[
              const SectionHeader('Intelligence', caption: 'two briefs a day, audited'),
              SizedBox(
                height: 168,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _briefs.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, i) => _BriefCard(brief: _briefs[i]),
                ),
              ),
            ],
            SectionHeader(
              _filter == null ? 'All signal' : domainShort(_filter),
              caption: items.isNotEmpty ? 'tier 1 to 3, last seven days, strongest first' : 'latest from the wire',
              trailing: _filter != null
                  ? TextButton(onPressed: () => setState(() => _filter = null), child: const Text('Clear'))
                  : null,
            ),
            FilterPills(selected: _filter, onChanged: (v) => setState(() => _filter = v)),
            if (rest.isEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                child: Text('Nothing from this desk cleared the bar this week.', style: reading(size: 14, color: p.slate)),
              ),
            for (var n = 0; n < rest.length; n++) ...[
              StoryTile(item: rest[n], showCategory: _filter == null),
              if ((n + 1) % 6 == 0 && n < rest.length - 1) const AdSlot(AdPlacement.homeFeed),
            ],
            Padding(
              padding: const EdgeInsets.all(16),
              child: OutlinedButton(onPressed: () => context.push('/search'), child: const Text('Browse everything the radar captured')),
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}

/// Domain lanes: how much signal each desk carried this week, and its latest
/// headline. Tapping a lane filters the feed.
class _Lanes extends StatelessWidget {
  const _Lanes({required this.items, required this.onPick});
  final List<NewsItem> items;
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final groups = <String, List<NewsItem>>{};
    for (final it in items) {
      groups.putIfAbsent(it.category ?? 'Other', () => []).add(it);
    }
    final lanes = groups.entries.toList()..sort((a, b) => b.value.length.compareTo(a.value.length));
    if (lanes.isEmpty) return const SizedBox.shrink();
    final max = lanes.first.value.length;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SectionHeader('Lanes', caption: 'last seven days, by desk', padding: EdgeInsets.fromLTRB(16, 14, 16, 8)),
      SizedBox(
        height: 118,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
          itemCount: lanes.length > 10 ? 10 : lanes.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (context, i) {
            final e = lanes[i];
            final meta = categoryMeta(e.key);
            return InkWell(
              onTap: () => onPick(e.key),
              borderRadius: BorderRadius.circular(10),
              child: Container(
                width: 168,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: p.line)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Container(width: 7, height: 7, decoration: BoxDecoration(color: meta.hue, shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    Expanded(child: Text(meta.short, style: display(size: 12, weight: FontWeight.w700, color: p.ink), overflow: TextOverflow.ellipsis)),
                    Text('${e.value.length}', style: figures(size: 13, color: p.ink2, weight: FontWeight.w600)),
                  ]),
                  const SizedBox(height: 8),
                  Expanded(
                    child: Text(e.value.first.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: reading(size: 12.5, color: p.ink2, height: 1.3)),
                  ),
                  const SizedBox(height: 8),
                  Stack(children: [
                    Container(height: 3, color: p.line),
                    FractionallySizedBox(widthFactor: e.value.length / max, child: Container(height: 3, color: p.signal)),
                  ]),
                ]),
              ),
            );
          },
        ),
      ),
    ]);
  }
}

class _BriefCard extends StatelessWidget {
  const _BriefCard({required this.brief});
  final DailyBrief brief;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final text = brief.plainSummary ?? brief.summary ?? '';
    return InkWell(
      onTap: () => context.push('/intelligence/${brief.dateSlug}/${brief.briefType}'),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        width: 280,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: p.line)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(brief.isEvening ? Icons.nightlight_outlined : Icons.wb_sunny_outlined, size: 16, color: p.gold),
            const SizedBox(width: 6),
            Expanded(
              child: Text(brief.editionName.toUpperCase(), style: display(size: 10.5, weight: FontWeight.w700, color: p.gold, letterSpacing: 1)),
            ),
            if (brief.isEvening && brief.confidence != null) ConfidenceRing(value: brief.confidence!, size: 36),
          ]),
          const SizedBox(height: 4),
          Text(brief.label, style: display(size: 14, weight: FontWeight.w700, color: p.ink)),
          const SizedBox(height: 6),
          Expanded(child: Text(text, maxLines: 3, overflow: TextOverflow.ellipsis, style: reading(size: 13, color: p.ink2, height: 1.4))),
          const SizedBox(height: 8),
          Row(children: [
            const LabelChip(LabelKind.analysis),
            const Spacer(),
            Text('Read', style: display(size: 12.5, weight: FontWeight.w600, color: p.link)),
          ]),
        ]),
      ),
    );
  }
}
