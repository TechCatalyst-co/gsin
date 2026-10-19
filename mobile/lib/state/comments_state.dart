import 'dart:math' as math;

import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_state.dart';
import '../models/comment.dart';

/// One comment with its depth in the thread, ready for a flat ListView.
typedef ThreadEntry = ({Comment comment, int depth});

/// Discussion thread under one story — the Flutter counterpart of
/// client/src/components/Comments.jsx. Readable by everyone; posting needs
/// a free account.
class CommentsState extends ChangeNotifier {
  CommentsState(this._api, this._auth, this.newsItemId);

  final ApiClient _api;
  final AuthState _auth;
  final String newsItemId;

  /// Deeper threads keep nesting logically but stop indenting visually.
  static const maxIndentDepth = 6;

  List<Comment> _comments = [];
  bool _loading = false;
  bool _loaded = false;
  bool _canPost = false;
  String? _error;

  /// Comment being replied to, shown as a chip above the composer.
  Comment? replyTo;

  bool get loading => _loading;
  bool get loaded => _loaded;

  /// Server says this viewer may post (signed in and not banned).
  bool get canPost => _canPost;
  String? get error => _error;
  int get visibleCount => _comments.where((c) => !c.removed).length;

  /// DFS flattening of the tree: a plain ListView renders this with computed
  /// indents instead of recursive widget nesting, so arbitrarily deep threads
  /// can't blow the layout.
  List<ThreadEntry> get flattened {
    final byParent = <String?, List<Comment>>{};
    final ids = _comments.map((c) => c.id).toSet();
    for (final c in _comments) {
      // Orphans (parent outside the 500-comment fetch cap) surface at root.
      final parent = ids.contains(c.parent) ? c.parent : null;
      byParent.putIfAbsent(parent, () => []).add(c);
    }
    final out = <ThreadEntry>[];
    void walk(String? parent, int depth) {
      for (final c in byParent[parent] ?? const <Comment>[]) {
        out.add((comment: c, depth: math.min(depth, maxIndentDepth)));
        walk(c.id, depth + 1);
      }
    }

    walk(null, 0);
    return out;
  }

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await _api.get('/comments?newsItem=$newsItemId');
      _comments = ((data['comments'] as List?) ?? [])
          .map((e) => Comment.fromJson(e as Map<String, dynamic>))
          .toList();
      _canPost = (data['canPost'] as bool?) ?? false;
      _loaded = true;
    } on ApiException catch (e) {
      if (await _handleAuthErrors(e)) return;
      _error = e.message;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void setReplyTo(Comment? comment) {
    replyTo = comment;
    notifyListeners();
  }

  Future<void> post(String body) async {
    final data = await _api.post('/comments', {
      'newsItem': newsItemId,
      'body': body,
      // Tells the evening analyst where the discussion came from.
      'platform': defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android',
      if (replyTo != null) 'parent': replyTo!.id,
    });
    _comments = [..._comments, Comment.fromJson(data['comment'] as Map<String, dynamic>)];
    replyTo = null;
    notifyListeners();
  }

  Future<void> remove(String id) async {
    await _api.delete('/comments/$id');
    // Status alone drives redaction — the tile never renders body/author of
    // a removed comment, and a reload gets them nulled by the server anyway.
    _comments = _comments
        .map((c) => c.id == id ? c.copyWith(status: 'removed') : c)
        .toList();
    notifyListeners();
  }

  Future<void> report(String id, {String? reason}) async {
    await _api.post('/comments/$id/report', {
      if (reason != null && reason.isNotEmpty) 'reason': reason,
    });
    _comments =
        _comments.map((c) => c.id == id ? c.copyWith(reportedByMe: true) : c).toList();
    notifyListeners();
  }

  Future<void> block(String userId) async {
    await _api.post('/comments/block', {'userId': userId});
    // Reload so redaction comes from the server, same as the web panel.
    await load();
  }

  /// An expired session drops to guest; the thread stays readable.
  Future<bool> _handleAuthErrors(ApiException e) async {
    if (e.status == 401 && _auth.isAuthed) {
      await _auth.handleUnauthorized();
      await load();
      return true;
    }
    return false;
  }
}
