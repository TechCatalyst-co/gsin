import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../api/gsi_api.dart';
import '../brand.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/radar_strip.dart';

/// Radar: what the sweep is doing right now. The instrument with its four
/// readings, search, the ten desks, and every capture from the last 24 hours
/// newest first (including Tier 4, which the Signal tab leaves out).
class RadarScreen extends StatefulWidget {
  const RadarScreen({super.key});

  @override
  State<RadarScreen> createState() => _RadarScreenState();
}

class _RadarScreenState extends State<RadarScreen> {
  final _q = TextEditingController();
  List<NewsItem>? _captures;
  String? _error;
  String? _filter;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final items = await context.read<ApiClient>().feed(
            sort: 'latest',
            hours: 24,
            limit: 40,
            domains: _filter == null ? const [] : [_filter!],
          );
      if (!mounted) return;
      setState(() {
        _captures = items;
        _error = null;
      });
      context.read<RadarState>().refresh();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not reach the radar. Pull down to try again.');
    }
  }

  void _search() {
    final q = _q.text.trim();
    if (q.isNotEmpty) context.push('/search?q=${Uri.encodeComponent(q)}');
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final radar = context.watch<RadarState>();
    final s = radar.status;
    final captures = _captures;

    return RefreshIndicator(
      color: p.signal,
      backgroundColor: p.surface,
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        children: [
          // The instrument.
          Container(
            color: p.paperDeep,
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
            child: Row(children: [
              const MiniRadar(size: 92),
              const SizedBox(width: 18),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Radar', style: display(size: 24, weight: FontWeight.w700, color: p.ink, height: 1)),
                  const SizedBox(height: 4),
                  Text('Every 30 minutes. Primary sources first. Nothing older than seven days.',
                      style: reading(size: 12.5, color: p.slate, height: 1.35)),
                  const SizedBox(height: 12),
                  Row(children: [
                    _Stat(label: 'LAST SWEEP', value: s == null ? '…' : (s.lastCaptureAt == null ? 'waiting' : ageShort(s.lastCaptureAt))),
                    _Stat(label: '24H', value: s == null ? '…' : '${s.stories24h}'),
                    _Stat(label: 'BREAKING', value: s == null ? '…' : '${s.breaking24h}', hot: (s?.breaking24h ?? 0) > 0),
                    _Stat(label: 'SOURCES', value: '${radar.sourceCount}'),
                  ]),
                ]),
              ),
            ]),
          ),
          Divider(color: p.line),

          // Search.
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
            child: TextField(
              controller: _q,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _search(),
              style: reading(size: 14.5, color: p.ink),
              decoration: InputDecoration(
                hintText: 'Search every capture',
                prefixIcon: Icon(Icons.search, color: p.slate),
                suffixIcon: IconButton(icon: Icon(Icons.arrow_forward, color: p.signal), onPressed: _search, tooltip: 'Search'),
              ),
            ),
          ),

          // Desks.
          const SectionHeader('Desks', caption: 'the ten domains the radar grades into'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(spacing: 8, runSpacing: 8, children: [
              for (final c in categories)
                InkWell(
                  onTap: () => context.push('/topic/${Uri.encodeComponent(c.name)}'),
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(6), border: Border.all(color: p.line)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(width: 8, height: 8, decoration: BoxDecoration(color: c.hue, shape: BoxShape.circle)),
                      const SizedBox(width: 8),
                      Text(c.short, style: display(size: 12.5, weight: FontWeight.w600, color: p.ink)),
                    ]),
                  ),
                ),
            ]),
          ),

          // Captures.
          SectionHeader('Captures', caption: 'last 24 hours, newest first, all tiers'),
          FilterPills(
            selected: _filter,
            onChanged: (v) {
              setState(() {
                _filter = v;
                _captures = null;
              });
              _load();
            },
          ),
          if (_error != null)
            ErrorBlock(text: _error!, onRetry: _load)
          else if (captures == null)
            const RadarLoading()
          else if (captures.isEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: Text(
                _filter == null ? 'No captures in the last 24 hours yet. The next sweep is never more than 30 minutes away.' : 'Nothing from this desk in the last 24 hours.',
                style: reading(size: 14, color: p.slate),
              ),
            )
          else
            for (final it in captures) _CaptureRow(item: it),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, this.hot = false});
  final String label;
  final String value;
  final bool hot;
  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Expanded(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: figures(size: 17, color: hot ? p.signal : p.ink, weight: FontWeight.w700, height: 1)),
        const SizedBox(height: 3),
        Text(label, style: display(size: 9, weight: FontWeight.w600, color: p.slate, letterSpacing: 0.6)),
      ]),
    );
  }
}

/// A capture: dense, chronological. Time, tier, desk, headline, source.
class _CaptureRow extends StatelessWidget {
  const _CaptureRow({required this.item});
  final NewsItem item;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return InkWell(
      onTap: () => openStory(context, item),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 11, 16, 11),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(
            width: 40,
            child: Text(ageShort(item.capturedAt ?? item.published), style: figures(size: 12, color: p.slate, weight: FontWeight.w600)),
          ),
          Container(
            width: 3,
            height: 34,
            margin: const EdgeInsets.only(right: 10, top: 1),
            color: item.tier <= 2 ? p.tierColor(item.tier) : (item.tier == 3 ? p.lineStrong : p.line),
          ),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: display(size: 14, weight: FontWeight.w600, color: p.ink, height: 1.25)),
              const SizedBox(height: 4),
              Row(children: [
                if (item.graded) ...[Text('T${item.tier}', style: figures(size: 11, color: p.tierColor(item.tier), weight: FontWeight.w700)), const SizedBox(width: 8)],
                if (item.category != null) ...[Text(domainShort(item.category), style: reading(size: 12, color: p.ink2, height: 1.2)), const SizedBox(width: 8)],
                Expanded(child: Text(item.source, style: reading(size: 12, color: p.slate, height: 1.2), overflow: TextOverflow.ellipsis)),
                if (item.primarySource) Icon(Icons.verified_outlined, size: 13, color: p.signal),
              ]),
            ]),
          ),
          if (item.signalScore != null) ...[
            const SizedBox(width: 10),
            Text('${item.signalScore}', style: figures(size: 13, color: p.ink2, weight: FontWeight.w600)),
          ],
        ]),
      ),
    );
  }
}
