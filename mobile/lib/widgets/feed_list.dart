import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import 'common.dart';
import 'scroll_to_top_button.dart';

/// Infinite-scrolling list over GET /news with the given filters
/// (category, tag, search, sort). Pull to refresh.
class FeedList extends StatefulWidget {
  const FeedList({super.key, required this.query, this.header, this.showCategory = true, this.emptyText = 'No stories match yet.'});

  final Map<String, String> query;
  final Widget? header;
  final bool showCategory;
  final String emptyText;

  @override
  State<FeedList> createState() => _FeedListState();
}

class _FeedListState extends State<FeedList> {
  final _scroll = ScrollController();
  final _items = <NewsItem>[];
  int _page = 0;
  int _totalPages = 1;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 600) _loadMore();
    });
    _refresh();
  }

  @override
  void didUpdateWidget(covariant FeedList old) {
    super.didUpdateWidget(old);
    if (old.query.toString() != widget.query.toString()) _refresh();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    _items.clear();
    _page = 0;
    _totalPages = 1;
    await _loadMore();
  }

  Future<void> _loadMore() async {
    if (_loading || _page >= _totalPages) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final qs = Uri(queryParameters: {...widget.query, 'page': '${_page + 1}', 'limit': '25'}).query;
      final data = await context.read<ApiClient>().get('/news?$qs');
      final pag = (data['pagination'] as Map?) ?? const {};
      if (!mounted) return;
      setState(() {
        _items.addAll(NewsItem.listFrom(data['items']));
        _page = ((pag['page'] as num?) ?? (_page + 1)).toInt();
        _totalPages = ((pag['totalPages'] as num?) ?? 1).toInt();
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
    final header = widget.header;
    final showEmpty = !_loading && _error == null && _items.isEmpty;
    return Stack(
      children: [
        RefreshIndicator(
          color: p.signal,
          onRefresh: _refresh,
          child: ListView.builder(
            controller: _scroll,
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount: _items.length + 2,
            itemBuilder: (context, i) {
              if (i == 0) return header ?? const SizedBox.shrink();
              if (i == _items.length + 1) {
                if (_error != null) {
                  return Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(children: [
                      Text(_error!, style: TextStyle(color: p.flare)),
                      TextButton(onPressed: _loadMore, child: const Text('Try again')),
                    ]),
                  );
                }
                if (showEmpty) return EmptyState(title: 'Nothing here yet', body: widget.emptyText);
                if (_loading) {
                  return Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(child: CircularProgressIndicator(color: p.signal)),
                  );
                }
                return const SizedBox(height: 32);
              }
              return StoryTile(item: _items[i - 1], showCategory: widget.showCategory);
            },
          ),
        ),
        Positioned(right: 16, bottom: 16, child: ScrollToTopButton(controller: _scroll)),
      ],
    );
  }
}
