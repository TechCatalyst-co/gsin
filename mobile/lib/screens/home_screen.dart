import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_state.dart';
import '../brand.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

/// Front page: breaking strip, lead story, editors' picks, latest, most
/// discussed. One call to GET /news/front-page.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _data;
  String? _error;
  String? _loadedFor;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Reload when the signed-in user changes (Premium fields differ).
    final uid = Provider.of<AuthState>(context).user?.id ?? '';
    if (_loadedFor != uid) {
      _loadedFor = uid;
      _load();
    }
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiClient>().get('/news/front-page');
      if (!mounted) return;
      setState(() {
        _data = data;
        _error = null;
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final data = _data;
    if (data == null) {
      return _error != null
          ? EmptyState(
              title: 'Can’t reach the wire',
              body: _error!,
              action: OutlinedButton(onPressed: _load, child: const Text('Try again')),
            )
          : Center(child: CircularProgressIndicator(color: p.signal));
    }

    final breaking = NewsItem.listFrom(data['breaking']);
    final leadJson = data['lead'];
    final lead = leadJson is Map<String, dynamic> ? NewsItem.fromJson(leadJson) : null;
    final featured = NewsItem.listFrom(data['featured']);
    final latest = NewsItem.listFrom(data['latest']);
    final discussed = NewsItem.listFrom(data['mostDiscussed']);
    final user = context.watch<AuthState>().user;

    return RefreshIndicator(
      color: p.signal,
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          if (breaking.isNotEmpty) _BreakingStrip(items: breaking),
          if (lead == null)
            const EmptyState(
              title: 'The wire is quiet',
              body: 'No stories have arrived yet. Pull down to refresh.',
            )
          else ...[
            LeadStory(item: lead),
            Divider(height: 1, color: p.line),
            if (featured.isNotEmpty) ...[
              const SectionLabel('Editors’ picks'),
              for (final i in featured.take(3)) StoryTile(item: i, compact: true),
            ],
            _BriefCard(premium: user?.capabilities.accessDailyBrief ?? false, upgradeUrl: user?.upgradeUrl),
            const SectionLabel('Latest'),
            for (final i in latest) StoryTile(item: i),
            if (discussed.isNotEmpty) ...[
              const SectionLabel('Most discussed this week'),
              for (final i in discussed) StoryTile(item: i, compact: true),
            ],
            Padding(
              padding: const EdgeInsets.all(16),
              child: OutlinedButton(
                onPressed: () => context.push('/search'),
                child: const Text('Browse all stories'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _BreakingStrip extends StatelessWidget {
  const _BreakingStrip({required this.items});
  final List<NewsItem> items;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      color: p.flare,
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Breaking', style: display(size: 13, weight: FontWeight.w800, color: Colors.white)),
          for (final i in items)
            InkWell(
              onTap: () => context.push('/story/${i.ref}', extra: i),
              child: Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(i.title, style: display(size: 15.5, weight: FontWeight.w600, color: Colors.white, height: 1.25)),
              ),
            ),
        ],
      ),
    );
  }
}

class _BriefCard extends StatelessWidget {
  const _BriefCard({required this.premium, this.upgradeUrl});
  final bool premium;
  final String? upgradeUrl;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 20, 16, 4),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: p.ink, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(premium ? 'Today’s Daily Brief is ready' : 'The Daily Brief',
              style: display(size: 21, weight: FontWeight.w800, color: p.paper)),
          const SizedBox(height: 6),
          Text(
            premium
                ? 'The day in AI, summarized in five minutes.'
                : 'Every morning: the stories that moved AI forward and why they matter. Included with Premium.',
            style: reading(size: 16, color: p.paper.withValues(alpha: 0.82)),
          ),
          const SizedBox(height: 14),
          FilledButton(
            onPressed: () => context.go('/brief'),
            child: Text(premium ? 'Read the brief' : 'See Premium (${Brand.premiumPrice}/mo)'),
          ),
        ],
      ),
    );
  }
}
