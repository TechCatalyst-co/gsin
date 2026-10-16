/// Mirrors the serialized comment shape from server/routes/comments.js.
class Comment {
  const Comment({
    required this.id,
    this.parent,
    this.authorId,
    this.authorName,
    this.authorBadge,
    this.body,
    required this.status,
    required this.hidden,
    this.createdAt,
    required this.isMine,
    required this.reportedByMe,
  });

  final String id;
  final String? parent;
  final String? authorId;
  final String? authorName;

  /// 'staff' | 'premium' | 'member', snapshotted at write time.
  final String? authorBadge;
  final String? body;
  final String status;
  final bool hidden;
  final DateTime? createdAt;
  final bool isMine;
  final bool reportedByMe;

  bool get removed => status == 'removed';
  bool get redacted => removed || hidden;

  Comment copyWith({String? status, bool? reportedByMe}) => Comment(
        id: id,
        parent: parent,
        authorId: authorId,
        authorName: authorName,
        authorBadge: authorBadge,
        body: body,
        status: status ?? this.status,
        hidden: hidden,
        createdAt: createdAt,
        isMine: isMine,
        reportedByMe: reportedByMe ?? this.reportedByMe,
      );

  factory Comment.fromJson(Map<String, dynamic> json) => Comment(
        id: (json['_id'] as String?) ?? '',
        parent: json['parent'] as String?,
        authorId: json['authorId'] as String?,
        authorName: json['authorName'] as String?,
        authorBadge: json['authorBadge'] as String?,
        body: json['body'] as String?,
        status: (json['status'] as String?) ?? 'visible',
        hidden: (json['hidden'] as bool?) ?? false,
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'] as String)
            : null,
        isMine: (json['isMine'] as bool?) ?? false,
        reportedByMe: (json['reportedByMe'] as bool?) ?? false,
      );
}
