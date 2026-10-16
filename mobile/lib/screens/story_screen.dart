import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_state.dart';
import '../config.dart';
import '../models/comment.dart';
import '../models/news_item.dart';
import '../state/comments_state.dart';
import '../theme/app_theme.dart';
import '../widgets/comment_tile.dart';
import '../widgets/common.dart';

/// One story: summary, why it matters, Premium analysis, related, discussion.
class StoryScreen extends StatefulWidget {
  const StoryScreen({super.key, required this.ref, this.preview});

  final String ref;
  final NewsItem? preview;

  @override
  State<StoryScreen> createState() => _StoryScreenState();
}

class _StoryScreenState extends State<StoryScreen> {
  NewsItem? _item;
  List<NewsItem> _related = const [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _item = widget.preview;
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ApiClient>().get('/news/${Uri.encodeComponent(widget.ref)}');
      if (!mounted) return;
      setState(() {
        _item = NewsItem.fromJson(data['item'] as Map<String, dynamic>);
        _related = NewsItem.listFrom(data['related']);
        _error = null;
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.status == 404 ? 'This story is no longer available.' : e.message);
    }
  }

  Future<void> _toggleBookmark() async {
    final item = _item;
    if (item == null) return;
    final auth = context.read<AuthState>();
    if (!auth.isAuthed) {
      context.push('/login');
      return;
    }
    final next = !item.bookmarked;
    setState(() => _item = item.copyWith(bookmarked: next));
    try {
      await context.read<ApiClient>().post('/me/bookmarks', {'newsItem': item.id, 'saved': next});
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _item = item);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final item = _item;
    if (item == null) {
      return Scaffold(
        appBar: AppBar(),
        body: _error != null
            ? EmptyState(title: 'Story not found', body: _error!)
            : Center(child: CircularProgressIndicator(color: p.signal)),
      );
    }
    final auth = context.watch<AuthState>();
    final shareUrl = '$webBaseUrl/story/${item.ref}';

    return ChangeNotifierProvider(
      key: ValueKey('comments-${item.id}-${auth.user?.id}'),
      create: (ctx) => CommentsState(ctx.read<ApiClient>(), ctx.read<AuthState>(), item.id)..load(),
      child: Scaffold(
        appBar: AppBar(
          actions: [
            IconButton(
              tooltip: item.bookmarked ? 'Remove from saved' : 'Save',
              icon: Icon(item.bookmarked ? Icons.bookmark : Icons.bookmark_border),
              onPressed: _toggleBookmark,
            ),
            IconButton(
              tooltip: 'Share',
              icon: const Icon(Icons.ios_share),
              onPressed: () => SharePlus.instance.share(ShareParams(uri: Uri.parse(shareUrl), subject: item.title)),
            ),
          ],
        ),
        body: Column(
          children: [
            Expanded(
              child: RefreshIndicator(
                color: p.signal,
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.only(bottom: 24),
                  children: [
                    _StoryBody(item: item, signedIn: auth.isAuthed, upgradeUrl: auth.user?.upgradeUrl),
                    const _Discussion(),
                    if (_related.isNotEmpty) ...[
                      const SectionLabel('Related'),
                      for (final r in _related) StoryTile(item: r),
                    ],
                  ],
                ),
              ),
            ),
            const _Composer(),
          ],
        ),
      ),
    );
  }
}

class _StoryBody extends StatelessWidget {
  const _StoryBody({required this.item, required this.signedIn, this.upgradeUrl});

  final NewsItem item;
  final bool signedIn;
  final String? upgradeUrl;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final body = reading(size: 18.5, color: p.ink, height: 1.6);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(spacing: 12, runSpacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
            CategoryLabel(name: item.category),
            if (item.urgent) const BreakingFlag(),
          ]),
          const SizedBox(height: 12),
          Text(item.title, style: display(size: 30, weight: FontWeight.w800, color: p.ink, height: 1.05)),
          if (item.headline != null && item.headline!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(item.headline!, style: reading(size: 19, color: p.ink2, height: 1.4)),
          ],
          const SizedBox(height: 12),
          Text(
            '${item.author != null ? '${item.author}, ' : ''}${item.source}   ${timeAgo(item.published)}',
            style: display(size: 13.5, weight: FontWeight.w400, color: p.slate),
          ),
          if (isSafeHttpUrl(item.url)) ...[
            const SizedBox(height: 14),
            FilledButton.icon(
              onPressed: () => openExternal(item.url),
              icon: const Icon(Icons.open_in_new, size: 18),
              label: Text('Read at ${item.source}'),
            ),
          ],
          if (item.imageUrl != null) ...[const SizedBox(height: 20), StoryImage(url: item.imageUrl)],
          if (item.summary != null && item.summary!.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(item.summary!, style: body),
          ],
          if (item.impact != null && item.impact!.isNotEmpty) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.only(left: 14),
              decoration: BoxDecoration(border: Border(left: BorderSide(color: p.signal, width: 4))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Why it matters', style: display(size: 16, color: p.ink)),
                const SizedBox(height: 4),
                Text(item.impact!, style: body),
              ]),
            ),
          ],
          if (item.hasAnalysis) ...[
            const SizedBox(height: 20),
            if (item.analysis != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(12)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Analysis', style: display(size: 16, color: p.ink)),
                  const SizedBox(height: 6),
                  for (final para in item.analysis!.split(RegExp(r'\n{2,}')))
                    Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(para, style: body)),
                ]),
              )
            else
              PremiumPitch(
                title: 'Analysis',
                body: 'Our extended analysis of this story — context, what to watch, and second-order effects — is part of Premium.',
                upgradeUrl: upgradeUrl,
                signedIn: signedIn,
              ),
          ],
          if (item.tags.isNotEmpty) ...[
            const SizedBox(height: 18),
            Wrap(spacing: 8, runSpacing: 8, children: [
              for (final t in item.tags)
                ActionChip(label: Text('#$t'), onPressed: () => context.push('/search?tag=${Uri.encodeComponent(t)}')),
            ]),
          ],
        ],
      ),
    );
  }
}

class _Discussion extends StatelessWidget {
  const _Discussion();

  Future<void> _run(BuildContext context, Future<void> Function() action) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await action();
    } on ApiException catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _report(BuildContext context, CommentsState state, Comment c) async {
    final controller = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Report comment'),
        content: TextField(controller: controller, maxLength: 500, decoration: const InputDecoration(hintText: 'Reason (optional)')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Report')),
        ],
      ),
    );
    final reason = controller.text.trim();
    controller.dispose();
    if (ok == true && context.mounted) await _run(context, () => state.report(c.id, reason: reason));
  }

  Future<void> _confirm(BuildContext context, String title, String body, String action, Future<void> Function() run) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text(action)),
        ],
      ),
    );
    if (ok == true && context.mounted) await _run(context, run);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final state = context.watch<CommentsState>();
    final auth = context.watch<AuthState>();
    final curate = auth.user?.capabilities.curate ?? false;
    final thread = state.flattened;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Divider(height: 32, color: p.line, indent: 16, endIndent: 16),
        SectionLabel('Discussion${state.visibleCount > 0 ? ' (${state.visibleCount})' : ''}', padding: const EdgeInsets.fromLTRB(16, 0, 16, 4)),
        if (state.loading && !state.loaded)
          Padding(padding: const EdgeInsets.all(16), child: Center(child: CircularProgressIndicator(color: p.signal)))
        else if (state.error != null)
          Padding(padding: const EdgeInsets.all(16), child: Text(state.error!, style: TextStyle(color: p.flare)))
        else ...[
          if (!state.canPost)
            Container(
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: p.signalSoft, borderRadius: BorderRadius.circular(12)),
              child: Row(children: [
                Expanded(
                  child: Text(
                    auth.isAuthed ? 'Posting in discussions is part of Premium.' : 'Sign in to join the discussion. Posting is part of Premium.',
                    style: TextStyle(color: p.ink, fontSize: 14.5),
                  ),
                ),
                if (!auth.isAuthed)
                  TextButton(onPressed: () => context.push('/login'), child: const Text('Sign in'))
                else if (showUpgradeLinks)
                  TextButton(onPressed: () => openPremiumOnWeb(auth.user?.upgradeUrl), child: const Text('Premium')),
              ]),
            ),
          if (thread.isEmpty)
            Padding(padding: const EdgeInsets.all(16), child: Text('No comments yet.', style: TextStyle(color: p.slate))),
          for (final e in thread)
            CommentTile(
              comment: e.comment,
              depth: e.depth,
              canDelete: !e.comment.removed && (e.comment.isMine || curate),
              canReply: state.canPost,
              signedIn: auth.isAuthed,
              onReply: () => state.setReplyTo(e.comment),
              onReport: () => _report(context, state, e.comment),
              onBlock: () => _confirm(context, 'Block user', 'Hide all comments from ${e.comment.authorName ?? 'this reader'}?', 'Block', () => state.block(e.comment.authorId!)),
              onDelete: () => _confirm(context, 'Delete comment', 'Delete this comment?', 'Delete', () => state.remove(e.comment.id)),
            ),
        ],
      ],
    );
  }
}

class _Composer extends StatefulWidget {
  const _Composer();

  @override
  State<_Composer> createState() => _ComposerState();
}

class _ComposerState extends State<_Composer> {
  final _controller = TextEditingController();
  bool _posting = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send(CommentsState state) async {
    final body = _controller.text.trim();
    if (body.isEmpty || _posting) return;
    setState(() => _posting = true);
    try {
      await state.post(body);
      _controller.clear();
      if (mounted) FocusScope.of(context).unfocus();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<CommentsState>();
    if (!state.canPost) return const SizedBox.shrink();
    final p = context.palette;
    final replyTo = state.replyTo;
    return SafeArea(
      top: false,
      child: Container(
        decoration: BoxDecoration(color: p.surface, border: Border(top: BorderSide(color: p.line))),
        padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (replyTo != null)
              InputChip(
                label: Text('Replying to ${replyTo.authorName ?? 'comment'}'),
                onDeleted: () => state.setReplyTo(null),
              ),
            Row(children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  minLines: 1,
                  maxLines: 5,
                  maxLength: 2000,
                  decoration: const InputDecoration(hintText: 'Add to the discussion', counterText: ''),
                ),
              ),
              IconButton(
                tooltip: 'Post',
                icon: _posting
                    ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: p.signal))
                    : Icon(Icons.send, color: p.signal),
                onPressed: _posting ? null : () => _send(state),
              ),
            ]),
          ],
        ),
      ),
    );
  }
}
