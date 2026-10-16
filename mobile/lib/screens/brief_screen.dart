import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../ads.dart';
import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

/// The Daily Brief with an edition picker. Free for everyone.
class BriefScreen extends StatefulWidget {
  const BriefScreen({super.key});

  @override
  State<BriefScreen> createState() => _BriefScreenState();
}

class _BriefScreenState extends State<BriefScreen> {
  DailyBrief? _brief;
  List<String> _dates = const [];
  String? _date;
  bool _loading = false;
  bool _empty = false;
  String? _error;
  @override
  void initState() {
    super.initState();
    _load();
    _loadDates();
  }

  Future<void> _loadDates() async {
    try {
      final data = await context.read<ApiClient>().get('/daily-brief/dates');
      if (mounted) setState(() => _dates = ((data['dates'] as List?) ?? const []).whereType<String>().toList());
    } on ApiException {
      /* picker is optional */
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final path = _date == null ? '/daily-brief/latest' : '/daily-brief/$_date';
      final data = await context.read<ApiClient>().get(path);
      final b = data['brief'];
      if (!mounted) return;
      setState(() {
        _brief = b is Map<String, dynamic> ? DailyBrief.fromJson(b) : null;
        _empty = b == null;
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    final brief = _brief;
    return RefreshIndicator(
      color: p.signal,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(child: Text('Daily Brief', style: display(size: 32, weight: FontWeight.w800, color: p.ink))),
                if (_dates.length > 1)
                  DropdownButton<String?>(
                    value: _date,
                    underline: const SizedBox.shrink(),
                    items: [
                      const DropdownMenuItem<String?>(value: null, child: Text('Latest')),
                      for (final d in _dates) DropdownMenuItem<String?>(value: d, child: Text(d)),
                    ],
                    onChanged: (v) {
                      setState(() => _date = v);
                      _load();
                    },
                  ),
              ],
            ),
          ),
          if (_loading && brief == null)
            Padding(padding: const EdgeInsets.all(32), child: Center(child: CircularProgressIndicator(color: p.signal)))
          else if (_error != null)
            EmptyState(title: 'Couldn’t load the brief', body: _error!)
          else if (_empty || brief == null)
            const EmptyState(title: 'No brief yet', body: 'The first edition appears after the morning run.')
          else ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(brief.label, style: display(size: 18, color: p.ink)),
                  if (brief.windowStart != null)
                    Text('Covering ${brief.windowStart} to ${brief.windowEnd ?? ''}', style: TextStyle(color: p.slate, fontSize: 13)),
                  if (brief.summary != null) ...[
                    const SizedBox(height: 14),
                    Text(brief.summary!, style: reading(size: 20, color: p.ink, height: 1.45)),
                  ],
                  if (brief.keyPoints.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text('Key points', style: display(size: 14, color: p.slate)),
                    const SizedBox(height: 6),
                    for (final k in brief.keyPoints)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('•  ', style: reading(size: 17, color: p.signal)),
                          Expanded(child: Text(k, style: reading(size: 17, color: p.ink))),
                        ]),
                      ),
                  ],
                  if (brief.statsLine != null) Text(brief.statsLine!, style: TextStyle(color: p.slate, fontSize: 13)),
                ],
              ),
            ),
            const SectionLabel('The stories'),
            for (var i = 0; i < brief.items.length; i++) ...[
              _BriefRow(n: i + 1, item: brief.items[i]),
              if (i == 2 && brief.items.length > 4) const AdSlot(AdPlacement.briefInline),
            ],
          ],
        ],
      ),
    );
  }
}

class _BriefRow extends StatelessWidget {
  const _BriefRow({required this.n, required this.item});
  final int n;
  final BriefItem item;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return InkWell(
      onTap: () => item.slug != null ? context.push('/story/${item.slug}') : openExternal(item.url),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 34, child: Text('$n', style: display(size: 26, weight: FontWeight.w800, color: p.signal, height: 1))),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(spacing: 10, crossAxisAlignment: WrapCrossAlignment.center, children: [
                    CategoryLabel(name: item.category, tappable: false),
                    if (item.urgent) const BreakingFlag(),
                  ]),
                  const SizedBox(height: 6),
                  Text(item.title, style: display(size: 17.5, color: p.ink, height: 1.2)),
                  if (item.headline != null) ...[
                    const SizedBox(height: 4),
                    Text(item.headline!, style: reading(size: 15.5, color: p.ink2)),
                  ],
                  if (item.impact != null) ...[
                    const SizedBox(height: 6),
                    Text.rich(TextSpan(children: [
                      TextSpan(text: 'Why it matters. ', style: reading(size: 15.5, color: p.ink, weight: FontWeight.w600)),
                      TextSpan(text: item.impact, style: reading(size: 15.5, color: p.ink2)),
                    ])),
                  ],
                  if (item.commentCount > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text('${item.commentCount} comments', style: TextStyle(color: p.slate, fontSize: 13)),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

