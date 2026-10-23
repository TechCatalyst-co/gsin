import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../api/gsi_api.dart';
import '../auth/auth_state.dart';
import '../brand.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/fold.dart';
import '../widgets/radar_strip.dart';

/// News: the home tab. Topic filter, the lead story with the latest brief under
/// it, then one feed (tiers 1–3 from the last seven days, strongest first).
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
        api.briefList(limit: 1).catchError((_) => <DailyBrief>[]),
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
          FilterPills(selected: _filter, onChanged: (v) => setState(() => _filter = v), padding: const EdgeInsets.fromLTRB(16, 12, 16, 4)),
          if (pool.isEmpty)
            EmptyState(
              title: 'The radar is live and nothing has cleared the bar yet.',
              body: 'Stories appear here the moment one grades Tier 1 to 3. The radar sweeps ${radar.sourceCount} sources every 30 minutes.',
            )
          else ...[
            if (lead != null) ...[
              LeadStory(item: lead),
              if (_briefs.isNotEmpty)
                Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 8), child: _BriefCard(brief: _briefs.first)),
              Divider(color: p.line),
            ],
            SectionHeader(
              _filter == null ? 'By topic' : domainShort(_filter),
              caption: items.isNotEmpty ? 'last seven days, strongest first' : 'latest from the wire',
            ),
            if (rest.isEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                child: Text('Nothing from this desk cleared the bar this week.', style: reading(size: 14, color: p.slate)),
              )
            // One desk picked: a plain list. All desks: one fold per desk.
            else if (_filter != null)
              for (final it in rest) StoryTile(item: it, showCategory: false)
            else
              TopicGroups<NewsItem>(
                items: rest,
                category: (i) => i.category,
                title: (i) => i.title,
                itemBuilder: (i, _) => StoryTile(item: i, showCategory: false),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: OutlinedButton(onPressed: () => context.push('/search'), child: const Text('Browse all stories')),
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}

/// The latest brief, one line of summary, tap to read.
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
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: p.line)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(brief.isEvening ? Icons.nightlight_outlined : Icons.wb_sunny_outlined, size: 16, color: p.gold),
            const SizedBox(width: 6),
            Expanded(child: Text('${brief.editionName} · ${brief.label}', style: display(size: 12.5, weight: FontWeight.w700, color: p.ink))),
            Text('Read', style: display(size: 12.5, weight: FontWeight.w600, color: p.link)),
          ]),
          if (text.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(text, maxLines: 2, overflow: TextOverflow.ellipsis, style: reading(size: 13, color: p.ink2, height: 1.4)),
          ],
        ]),
      ),
    );
  }
}
