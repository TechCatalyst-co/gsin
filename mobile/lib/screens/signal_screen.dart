import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../api/gsi_api.dart';
import '../auth/auth_state.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/fold.dart';
import '../widgets/radar_strip.dart';

/// News: the home tab. Topic pills, the lead story with the latest brief under
/// it, then one feed (tiers 1–3 from the last seven days, strongest first).
/// Mirrors client/src/pages/Home.jsx so the web and app show the same page.
class SignalScreen extends StatefulWidget {
  const SignalScreen({super.key});

  @override
  State<SignalScreen> createState() => _SignalScreenState();
}

class _SignalScreenState extends State<SignalScreen> {
  List<NewsItem>? _items;
  Map<String, dynamic> _front = const {};
  List<DailyBrief> _briefs = const [];
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
        api.frontPage(),
        api.feed(tier: 3, sort: 'signal', hours: 168, limit: 40).catchError((_) => <NewsItem>[]),
        api.briefList(limit: 1).catchError((_) => <DailyBrief>[]),
      ]);
      if (!mounted) return;
      setState(() {
        _front = results[0] as Map<String, dynamic>;
        _items = results[1] as List<NewsItem>;
        _briefs = results[2] as List<DailyBrief>;
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

    final latest = NewsItem.listFrom(_front['latest']);
    final discussed = NewsItem.listFrom(_front['mostDiscussed']);
    final lead = _pickLead(
      breaking: NewsItem.listFrom(_front['breaking']),
      featured: NewsItem.listFrom(_front['featured']),
      latest: latest,
    );
    // Before the radar has graded anything, show whatever the wire has.
    final pool = items.isNotEmpty ? items : latest;
    final rest = lead == null ? pool : pool.where((i) => i.id != lead.id).toList();

    return RefreshIndicator(
      color: p.signal,
      backgroundColor: p.surface,
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        children: [
          // A desk opens its own feed, like the web's /topic/:slug.
          FilterPills(
            selected: null,
            onChanged: (v) {
              if (v != null) context.push('/topic/${Uri.encodeComponent(v)}');
            },
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          ),
          if (lead == null)
            EmptyState(
              title: 'The radar is live and nothing has cleared the bar yet.',
              body: 'Stories appear here the moment one grades Tier 1 to 3. The radar sweeps ${radar.sourceCount} sources every 30 minutes.',
            )
          else ...[
            LeadStory(item: lead),
            if (_briefs.isNotEmpty)
              Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 8), child: _BriefCard(brief: _briefs.first)),
            Divider(color: p.line),
            SectionHeader(
              'By topic',
              caption: items.isNotEmpty ? 'last seven days, strongest first' : 'latest from the wire',
            ),
            if (rest.isNotEmpty)
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
            if (discussed.isNotEmpty) ...[
              const SectionHeader('Most discussed'),
              for (final it in discussed.take(5)) StoryTile(item: it),
            ],
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}

/// The lead is the strongest verified item: T1 with a primary source first,
/// then the newest breaking, then the editors' pick, then the latest. Same
/// rule as pickLead() in client/src/pages/Home.jsx.
NewsItem? _pickLead({required List<NewsItem> breaking, required List<NewsItem> featured, required List<NewsItem> latest}) {
  final t1 = [...breaking, ...latest].where((i) => i.urgencyTier == 1).toList()
    ..sort((a, b) {
      final byPrimary = (b.primarySource ? 1 : 0) - (a.primarySource ? 1 : 0);
      return byPrimary != 0 ? byPrimary : (b.signalScore ?? 0).compareTo(a.signalScore ?? 0);
    });
  if (t1.isNotEmpty) return t1.first;
  if (breaking.isNotEmpty) return breaking.first;
  if (featured.isNotEmpty) return featured.first;
  return latest.isNotEmpty ? latest.first : null;
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
