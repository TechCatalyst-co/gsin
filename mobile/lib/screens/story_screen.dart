import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../ads.dart';
import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../api/gsi_api.dart';
import '../auth/auth_state.dart';
import '../config.dart' show webBaseUrl;
import '../models/comment.dart';
import '../models/news_item.dart';
import '../state/comments_state.dart';
import '../theme/app_theme.dart';
import '../widgets/comment_tile.dart';
import '../widgets/common.dart';

/// One story as an instrument: chips, headline, the four readings, plain
/// English, why it matters, the verified-source block, every capture of the
/// same story, the grading panel, analysis, related, discussion.
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
  List<NewsItem> _captures = const [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _item = widget.preview;
    _load();
  }

  Future<void> _load() async {
    final api = context.read<ApiClient>();
    try {
      final data = await api.get('/news/${Uri.encodeComponent(widget.ref)}');
      if (!mounted) return;
      final item = NewsItem.fromJson(data['item'] as Map<String, dynamic>);
      setState(() {
        _item = item;
        _related = NewsItem.listFrom(data['related']);
        _error = null;
      });
      if (item.storyKey != null && item.storyKey!.isNotEmpty) {
        try {
          final group = await api.storyGroup(item.storyKey!);
          if (mounted) setState(() => _captures = group.captures.where((c) => c.id != item.id).toList());
        } catch (_) {
          /* captures are optional */
        }
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.status == 404 ? 'This story is no longer available.' : e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not load the story.');
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
        body: _error != null ? EmptyState(title: 'Story not found', body: _error!) : const Center(child: RadarLoading(text: 'Opening the story…')),
      );
    }
    final auth = context.watch<AuthState>();
    final shareUrl = '$webBaseUrl/story/${item.ref}';

    return ChangeNotifierProvider(
      key: ValueKey('comments-${item.id}-${auth.user?.id}'),
      create: (ctx) => CommentsState(ctx.read<ApiClient>(), ctx.read<AuthState>(), item.id)..load(),
      child: Scaffold(
        appBar: AppBar(
          title: const Wordmark(size: 12),
          actions: [
            IconButton(
              tooltip: item.bookmarked ? 'Remove from saved' : 'Save',
              icon: Icon(item.bookmarked ? Icons.bookmark : Icons.bookmark_border, color: item.bookmarked ? p.signal : null),
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
                backgroundColor: p.surface,
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.only(bottom: 24),
                  children: [
                    _StoryBody(item: item, captures: _captures),
                    const AdSlot(AdPlacement.storyEnd),
                    const _Discussion(),
                    if (_related.isNotEmpty) ...[
                      const SectionHeader('Related'),
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
  const _StoryBody({required this.item, required this.captures});

  final NewsItem item;
  final List<NewsItem> captures;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final body = reading(size: 16, color: p.ink, height: 1.6);
    final dek = item.headline != null && item.headline!.isNotEmpty && item.headline != item.title ? item.headline : null;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(spacing: 8, runSpacing: 6, children: [
            if (item.tier == 1 && (item.graded || item.urgent)) const TierChip(1, long: true),
            DomainChip(item.category, tappable: true),
          ]),
          const SizedBox(height: 12),
          Text(item.title, style: display(size: 26, weight: FontWeight.w700, color: p.ink, height: 1.12, letterSpacing: -0.3)),
          if (dek != null) ...[
            const SizedBox(height: 10),
            Text(dek, style: reading(size: 16.5, color: p.ink2, height: 1.4)),
          ],
          const SizedBox(height: 12),
          Text(
            '${item.author != null ? '${item.author}, ' : ''}${item.source}   ·   ${timeAgo(item.published)}',
            style: reading(size: 13, color: p.slate),
          ),
          if (item.industryLine != null && item.industryLine!.isNotEmpty) ...[
            const SizedBox(height: 6),
            PlainEnglish(text: item.industryLine!),
          ],
          if (isSafeHttpUrl(item.imageUrl)) ...[const SizedBox(height: 18), StoryImage(url: item.imageUrl)],
          if (item.summary != null && item.summary!.isNotEmpty) ...[
            const SizedBox(height: 18),
            Text(item.summary!, style: body),
          ],
          if (item.impact != null && item.impact!.isNotEmpty) ...[
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.only(left: 14),
              decoration: BoxDecoration(border: Border(left: BorderSide(color: p.signal, width: 3))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Why it matters', style: display(size: 15, weight: FontWeight.w700, color: p.ink)),
                const SizedBox(height: 4),
                Text(item.impact!, style: body),
              ]),
            ),
          ],
          if (item.whatIsNew != null && item.whatIsNew!.isNotEmpty) ...[
            const SizedBox(height: 14),
            Text.rich(TextSpan(children: [
              TextSpan(text: 'What is new. ', style: reading(size: 15, color: p.ink, weight: FontWeight.w600, height: 1.5)),
              TextSpan(text: item.whatIsNew, style: reading(size: 15, color: p.ink2, height: 1.5)),
            ])),
          ],
          if (item.whoCares != null && item.whoCares!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text.rich(TextSpan(children: [
              TextSpan(text: 'Who this affects. ', style: reading(size: 15, color: p.ink, weight: FontWeight.w600, height: 1.5)),
              TextSpan(text: item.whoCares, style: reading(size: 15, color: p.ink2, height: 1.5)),
            ])),
          ],
          const SizedBox(height: 18),
          _VerifiedBlock(item: item),
          if (captures.isNotEmpty) ...[
            const SizedBox(height: 18),
            Text('Every capture of this story', style: display(size: 15, weight: FontWeight.w700, color: p.ink)),
            const SizedBox(height: 4),
            Text('${captures.length + 1} captures. The lead is the primary source when one exists.', style: reading(size: 12.5, color: p.slate)),
            const SizedBox(height: 8),
            for (final c in captures) _CaptureLine(item: c),
          ],
          if (item.analysis != null && item.analysis!.isNotEmpty) ...[
            const AdSlot(AdPlacement.storyInline, padded: false),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: p.line)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text('Analysis', style: display(size: 15, weight: FontWeight.w700, color: p.ink)),
                  const Spacer(),
                  const LabelChip(LabelKind.analysis),
                ]),
                const SizedBox(height: 8),
                for (final para in item.analysis!.split(RegExp(r'\n{2,}')))
                  Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(para, style: body)),
              ]),
            ),
          ],
          if (item.tags.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(spacing: 6, runSpacing: 6, children: [
              for (final t in item.tags)
                InkWell(
                  onTap: () => context.push('/search?tag=${Uri.encodeComponent(t)}'),
                  child: GsiChip('#$t'),
                ),
            ]),
          ],
        ],
      ),
    );
  }
}

/// The source in one line, with the link out.
class _VerifiedBlock extends StatelessWidget {
  const _VerifiedBlock({required this.item});
  final NewsItem item;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Divider(color: p.line),
      const SizedBox(height: 6),
      Text(
        '${item.primarySource ? 'Verified primary source' : 'Reported by'}: ${item.source}.${item.graded ? ' Summary lines are AI-generated.' : ''}',
        style: reading(size: 13, color: p.slate, height: 1.4),
      ),
      if (isSafeHttpUrl(item.url)) ...[
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: () => openExternal(item.url),
          icon: const Icon(Icons.open_in_new, size: 16),
          label: const Text('Read the original source'),
        ),
      ],
    ]);
  }
}

class _CaptureLine extends StatelessWidget {
  const _CaptureLine({required this.item});
  final NewsItem item;
  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return InkWell(
      onTap: () => openStory(context, item),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
        child: Row(children: [
          SizedBox(width: 36, child: Text(ageShort(item.published), style: figures(size: 12, color: p.slate, weight: FontWeight.w600))),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: reading(size: 13.5, color: p.ink, weight: FontWeight.w500, height: 1.3)),
              const SizedBox(height: 2),
              Text(item.source, style: reading(size: 12, color: p.slate)),
            ]),
          ),
          if (item.primarySource) Icon(Icons.verified_outlined, size: 14, color: p.signal),
        ]),
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
                    auth.isAuthed ? 'Your account can’t post right now.' : 'Sign in or create a free account to join the discussion.',
                    style: TextStyle(color: p.ink, fontSize: 14.5),
                  ),
                ),
                if (!auth.isAuthed)
                  TextButton(onPressed: () => context.push('/login'), child: const Text('Sign in')),
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
