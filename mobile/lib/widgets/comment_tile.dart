import 'package:flutter/material.dart';

import '../models/comment.dart';
import '../theme/app_theme.dart';
import 'common.dart';

String _fmtWhen(DateTime? d) => timeAgo(d);

const _badgeLabel = {'staff': 'Editor', 'premium': 'Premium'};

/// One row of the discussion thread. The trailing "…" opens the bottom sheet
/// with Reply / Report / Block / Delete — the App-Store-visible moderation UX.
class CommentTile extends StatelessWidget {
  const CommentTile({
    super.key,
    required this.comment,
    required this.depth,
    required this.canDelete,
    required this.canReply,
    required this.signedIn,
    required this.onReply,
    required this.onReport,
    required this.onBlock,
    required this.onDelete,
  });

  final Comment comment;
  final int depth;
  final bool canDelete;
  final bool canReply;
  final bool signedIn;
  final VoidCallback onReply;
  final VoidCallback onReport;
  final VoidCallback onBlock;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final c = comment;
    final p = context.palette;
    final label = c.removed
        ? 'Removed'
        : c.hidden
            ? 'Hidden (blocked user)'
            : (c.authorName ?? 'Reader');
    final badge = c.redacted ? null : _badgeLabel[c.authorBadge];
    final staff = !c.redacted && c.authorBadge == 'staff';

    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 6,
                children: [
                  Text.rich(
                    TextSpan(children: [
                      TextSpan(
                        text: label,
                        style: TextStyle(
                          color: c.redacted ? p.slate : p.ink,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                          fontStyle: c.redacted ? FontStyle.italic : FontStyle.normal,
                        ),
                      ),
                      TextSpan(
                        text: '  ${_fmtWhen(c.createdAt)}',
                        style: TextStyle(color: p.slate, fontSize: 12),
                      ),
                    ]),
                  ),
                  if (badge != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
                      decoration: BoxDecoration(
                        color: staff ? p.signal : p.signalSoft,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        badge,
                        style: TextStyle(
                          color: staff ? p.signalInk : p.ink,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (!c.redacted && (signedIn || canDelete))
              IconButton(
                icon: Icon(Icons.more_horiz, size: 18, color: p.slate),
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                onPressed: () => _showActions(context),
              ),
          ],
        ),
        if (!c.redacted)
          Padding(
            padding: const EdgeInsets.only(top: 2, bottom: 4),
            child: Text(
              c.body ?? '',
              style: reading(size: 16, color: p.ink, height: 1.45),
            ),
          ),
      ],
    );

    return Padding(
      padding: EdgeInsets.only(left: 16.0 + depth * 12.0, right: 8, top: 10),
      child: Container(
        decoration: depth > 0
            ? BoxDecoration(
                border: Border(left: BorderSide(color: staff ? p.signal : p.line, width: 2)),
              )
            : (staff ? BoxDecoration(border: Border(left: BorderSide(color: p.signal, width: 3))) : null),
        padding: (depth > 0 || staff) ? const EdgeInsets.only(left: 10) : EdgeInsets.zero,
        child: content,
      ),
    );
  }

  void _showActions(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      builder: (sheet) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (canReply)
              ListTile(
                leading: const Icon(Icons.reply),
                title: const Text('Reply'),
                onTap: () {
                  Navigator.pop(sheet);
                  onReply();
                },
              ),
            if (signedIn && !comment.isMine)
              ListTile(
                leading: const Icon(Icons.flag_outlined),
                title: Text(comment.reportedByMe ? 'Reported' : 'Report comment'),
                enabled: !comment.reportedByMe,
                onTap: () {
                  Navigator.pop(sheet);
                  onReport();
                },
              ),
            if (signedIn && !comment.isMine && comment.authorId != null)
              ListTile(
                leading: const Icon(Icons.block),
                title: const Text('Block user'),
                onTap: () {
                  Navigator.pop(sheet);
                  onBlock();
                },
              ),
            if (canDelete)
              ListTile(
                leading: const Icon(Icons.delete_outline),
                title: const Text('Delete'),
                onTap: () {
                  Navigator.pop(sheet);
                  onDelete();
                },
              ),
          ],
        ),
      ),
    );
  }
}
