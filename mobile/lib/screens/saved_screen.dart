import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_state.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

/// "For you" tab: followed topics feed and saved stories.
class SavedScreen extends StatefulWidget {
  const SavedScreen({super.key});

  @override
  State<SavedScreen> createState() => _SavedScreenState();
}

class _SavedScreenState extends State<SavedScreen> {
  List<NewsItem>? _saved;
  List<NewsItem>? _forYou;
  List<String> _followed = const [];
  String? _error;
  String? _loadedFor;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = Provider.of<AuthState>(context);
    final key = '${auth.user?.id}|${auth.user?.followedCategories.join(',')}';
    if (auth.isAuthed && _loadedFor != key) {
      _loadedFor = key;
      _load();
    }
  }

  Future<void> _load() async {
    final api = context.read<ApiClient>();
    try {
      final results = await Future.wait([api.get('/me/bookmarks'), api.get('/me/feed')]);
      if (!mounted) return;
      setState(() {
        _saved = NewsItem.listFrom(results[0]['items']);
        _forYou = NewsItem.listFrom(results[1]['items']);
        _followed = ((results[1]['followedCategories'] as List?) ?? const []).whereType<String>().toList();
        _error = null;
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final auth = context.watch<AuthState>();
    if (!auth.isAuthed) {
      return EmptyState(
        title: 'Your reading, in one place',
        body: 'Create a free account to save stories and follow the topics you care about.',
        action: Wrap(spacing: 10, children: [
          FilledButton(onPressed: () => context.push('/register'), child: const Text('Create account')),
          OutlinedButton(onPressed: () => context.push('/login'), child: const Text('Sign in')),
        ]),
      );
    }
    if (_error != null) return EmptyState(title: 'Couldn’t load', body: _error!);
    if (_saved == null) return Center(child: CircularProgressIndicator(color: p.signal));

    return RefreshIndicator(
      color: p.signal,
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SectionLabel('From topics you follow'),
          if (_followed.isEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: Row(children: [
                Expanded(child: Text('You aren’t following any topics yet.', style: TextStyle(color: p.slate))),
                TextButton(onPressed: () => context.go('/account'), child: const Text('Choose topics')),
              ]),
            )
          else if (_forYou!.isEmpty)
            Padding(padding: const EdgeInsets.all(16), child: Text('No recent stories in your topics.', style: TextStyle(color: p.slate)))
          else
            for (final i in _forYou!.take(15)) StoryTile(item: i),
          const SectionLabel('Saved stories'),
          if (_saved!.isEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
              child: Text('Nothing saved yet. Tap the bookmark on any story to keep it here.', style: TextStyle(color: p.slate)),
            )
          else
            for (final i in _saved!) StoryTile(item: i),
        ],
      ),
    );
  }
}
