import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../brand.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/feed_list.dart';

/// Topics tab: search box plus the list of desks.
class TopicsScreen extends StatefulWidget {
  const TopicsScreen({super.key});

  @override
  State<TopicsScreen> createState() => _TopicsScreenState();
}

class _TopicsScreenState extends State<TopicsScreen> {
  final _q = TextEditingController();

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  void _search() {
    final q = _q.text.trim();
    if (q.isNotEmpty) context.push('/search?q=${Uri.encodeComponent(q)}');
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return ListView(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: TextField(
            controller: _q,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _search(),
            decoration: InputDecoration(
              hintText: 'Search stories',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(icon: const Icon(Icons.arrow_forward), onPressed: _search, tooltip: 'Search'),
            ),
          ),
        ),
        const SectionLabel('Topics'),
        for (final c in categories)
          ListTile(
            leading: Container(width: 14, height: 14, decoration: BoxDecoration(color: c.hue, shape: BoxShape.circle)),
            title: Text(c.name, style: display(size: 17, weight: FontWeight.w600, color: p.ink)),
            trailing: Icon(Icons.chevron_right, color: p.slate),
            onTap: () => context.push('/topic/${Uri.encodeComponent(c.name)}'),
          ),
      ],
    );
  }
}

const _sorts = [('latest', 'Latest'), ('discussed', 'Most discussed')];

/// A filtered feed: one topic, a search, or a tag.
class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key, this.category, this.search, this.tag});

  final String? category;
  final String? search;
  final String? tag;

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  String _sort = 'latest';

  String get _title {
    if (widget.category != null) return categoryMeta(widget.category).name;
    if (widget.search != null) return '“${widget.search}”';
    if (widget.tag != null) return '#${widget.tag}';
    return 'All stories';
  }

  @override
  Widget build(BuildContext context) {
    final query = <String, String>{
      'sort': _sort,
      if (widget.category != null) 'category': widget.category!,
      if (widget.search != null) 'search': widget.search!,
      if (widget.tag != null) 'tag': widget.tag!,
    };
    return Scaffold(
      appBar: AppBar(title: Text(_title)),
      body: FeedList(
        query: query,
        showCategory: widget.category == null,
        header: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              for (final s in _sorts)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(s.$2),
                    selected: _sort == s.$1,
                    showCheckmark: false,
                    onSelected: (_) => setState(() => _sort = s.$1),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
