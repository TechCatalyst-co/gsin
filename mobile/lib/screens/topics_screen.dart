import 'package:flutter/material.dart';

import '../brand.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/feed_list.dart';

const _sorts = [('signal', 'Strongest'), ('latest', 'Latest'), ('discussed', 'Most discussed')];

/// A filtered feed: one desk, a search, a tag, or everything.
class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key, this.category, this.search, this.tag});

  final String? category;
  final String? search;
  final String? tag;

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  String _sort = 'signal';
  int? _tier = 3;

  String get _title {
    if (widget.category != null) return categoryMeta(widget.category).name;
    if (widget.search != null) return '“${widget.search}”';
    if (widget.tag != null) return '#${widget.tag}';
    return 'Everything captured';
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final meta = widget.category != null ? categoryMeta(widget.category) : null;
    final query = <String, String>{
      'sort': _sort,
      if (_tier != null) 'tier': '$_tier',
      if (widget.category != null) 'category': widget.category!,
      if (widget.search != null) 'search': widget.search!,
      if (widget.tag != null) 'tag': widget.tag!,
    };
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
    return Scaffold(
      appBar: AppBar(
        title: Row(mainAxisSize: MainAxisSize.min, children: [
          if (meta != null) ...[
            Container(width: 8, height: 8, decoration: BoxDecoration(color: meta.hue, shape: BoxShape.circle)),
            const SizedBox(width: 8),
          ],
          Flexible(child: Text(_title, overflow: TextOverflow.ellipsis)),
        ]),
      ),
      body: FeedList(
        query: query,
        showCategory: widget.category == null,
        emptyText: _tier == null ? 'Nothing matches yet.' : 'Nothing graded Tier 1 to 3 matches. Try including Tier 4.',
        header: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (meta != null && categories.contains(meta))
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Text('Everything the radar graded into ${meta.name}.', style: reading(size: 13, color: p.slate)),
            ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
            child: Row(children: [
              for (final s in _sorts) pill(s.$2, _sort == s.$1, () => setState(() => _sort = s.$1)),
              Container(width: 1, height: 18, margin: const EdgeInsets.only(left: 4, right: 10), color: p.line),
              pill('Tier 1–3', _tier == 3, () => setState(() => _tier = 3)),
              pill('All tiers', _tier == null, () => setState(() => _tier = null)),
            ]),
          ),
        ]),
      ),
    );
  }
}
