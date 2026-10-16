import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

/// Staff-only: curate stories (pick / breaking / hidden) and clear the
/// reported-comments queue. Member management stays on the web.
class NewsroomScreen extends StatelessWidget {
  const NewsroomScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Newsroom'),
          bottom: const TabBar(tabs: [Tab(text: 'Stories'), Tab(text: 'Reported')]),
        ),
        body: const TabBarView(children: [_Stories(), _Reported()]),
      ),
    );
  }
}

class _Stories extends StatefulWidget {
  const _Stories();

  @override
  State<_Stories> createState() => _StoriesState();
}

class _StoriesState extends State<_Stories> {
  List<NewsItem>? _items;
  String _filter = '';
  String? _busy;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiClient>().get('/admin/news${_filter.isEmpty ? '' : '?filter=$_filter'}');
      if (mounted) setState(() => _items = NewsItem.listFrom(data['items']));
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  Future<void> _patch(NewsItem item, String key, bool value) async {
    setState(() => _busy = item.id);
    try {
      await context.read<ApiClient>().patch('/admin/news/${item.id}', {key: value});
      if (!mounted) return;
      setState(() {
        _items = _items!
            .map((i) => i.id != item.id
                ? i
                : i.copyWith(
                    featured: key == 'featured' ? value : null,
                    urgent: key == 'urgent' ? value : null,
                    hidden: key == 'hidden' ? value : null,
                  ))
            .toList();
      });
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    if (_error != null) return EmptyState(title: 'Couldn’t load', body: _error!);
    final items = _items;
    return Column(
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(children: [
            for (final f in const [('', 'All'), ('featured', 'Picks'), ('urgent', 'Breaking'), ('hidden', 'Hidden')])
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(f.$2),
                  selected: _filter == f.$1,
                  showCheckmark: false,
                  onSelected: (_) {
                    setState(() {
                      _filter = f.$1;
                      _items = null;
                    });
                    _load();
                  },
                ),
              ),
          ]),
        ),
        Expanded(
          child: items == null
              ? Center(child: CircularProgressIndicator(color: p.signal))
              : RefreshIndicator(
                  color: p.signal,
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: items.length,
                    itemBuilder: (context, i) {
                      final it = items[i];
                      final busy = _busy == it.id;
                      return Opacity(
                        opacity: it.hidden ? 0.55 : 1,
                        child: Container(
                          padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
                          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              InkWell(
                                onTap: () => context.push('/story/${it.ref}'),
                                child: Text(it.title, style: display(size: 15.5, color: p.ink)),
                              ),
                              const SizedBox(height: 4),
                              Text('${it.category ?? 'No topic'}   ${it.source}   ${timeAgo(it.published)}',
                                  style: TextStyle(color: p.slate, fontSize: 12.5)),
                              Wrap(spacing: 6, children: [
                                FilterChip(label: const Text('Pick'), selected: it.featured, onSelected: busy ? null : (v) => _patch(it, 'featured', v)),
                                FilterChip(label: const Text('Breaking'), selected: it.urgent, onSelected: busy ? null : (v) => _patch(it, 'urgent', v)),
                                FilterChip(label: const Text('Hidden'), selected: it.hidden, onSelected: busy ? null : (v) => _patch(it, 'hidden', v)),
                              ]),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }
}

class _Reported extends StatefulWidget {
  const _Reported();

  @override
  State<_Reported> createState() => _ReportedState();
}

class _ReportedState extends State<_Reported> {
  List<Map<String, dynamic>>? _rows;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiClient>().get('/admin/comments/reported');
      if (mounted) setState(() => _rows = ((data['comments'] as List?) ?? const []).whereType<Map<String, dynamic>>().toList());
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  Future<void> _act(String id, Future<void> Function() fn) async {
    try {
      await fn();
      if (mounted) setState(() => _rows = _rows!.where((r) => r['_id'] != id).toList());
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final api = context.read<ApiClient>();
    if (_error != null) return EmptyState(title: 'Couldn’t load', body: _error!);
    final rows = _rows;
    if (rows == null) return Center(child: CircularProgressIndicator(color: p.signal));
    if (rows.isEmpty) return const EmptyState(title: 'Queue is clear', body: 'No reported comments are waiting.');
    return RefreshIndicator(
      color: p.signal,
      onRefresh: _load,
      child: ListView(
        children: [
          for (final r in rows)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${r['authorName'] ?? 'Reader'} on “${r['articleTitle'] ?? ''}”', style: TextStyle(color: p.slate, fontSize: 13)),
                  const SizedBox(height: 6),
                  Text('${r['body'] ?? ''}', style: reading(size: 16, color: p.ink)),
                  const SizedBox(height: 4),
                  Text('${r['reportCount']} report(s)', style: TextStyle(color: p.flare, fontSize: 13)),
                  Row(children: [
                    TextButton(
                      onPressed: () => _act('${r['_id']}', () => api.delete('/comments/${r['_id']}')),
                      child: Text('Delete', style: TextStyle(color: p.flare)),
                    ),
                    TextButton(
                      onPressed: () => _act('${r['_id']}', () => api.post('/admin/comments/${r['_id']}/dismiss')),
                      child: const Text('Keep'),
                    ),
                  ]),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
