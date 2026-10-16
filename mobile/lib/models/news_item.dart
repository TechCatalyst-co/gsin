/// Mirrors the public story shape from server/routes/news.js (serialize()).
class NewsItem {
  const NewsItem({
    required this.id,
    this.slug,
    required this.title,
    required this.url,
    required this.source,
    this.author,
    this.published,
    this.category,
    this.tags = const [],
    this.imageUrl,
    this.headline,
    this.summary,
    this.impact,
    this.analysis,
    this.hasAnalysis = false,
    this.urgent = false,
    this.featured = false,
    this.hidden = false,
    this.commentCount = 0,
    this.bookmarked = false,
  });

  final String id;
  final String? slug;
  final String title;
  final String url;
  final String source;
  final String? author;
  final DateTime? published;
  final String? category;
  final List<String> tags;
  final String? imageUrl;
  final String? headline;
  final String? summary;
  final String? impact;

  /// Premium body; null for readers without access even when [hasAnalysis].
  final String? analysis;
  final bool hasAnalysis;
  final bool urgent;
  final bool featured;
  final bool hidden;
  final int commentCount;
  final bool bookmarked;

  /// Path segment for /story/:slug (falls back to the id).
  String get ref => slug ?? id;

  /// Dek shown under the title in lists.
  String? get dek {
    final h = headline;
    if (h != null && h.isNotEmpty) return h;
    final s = summary;
    return (s != null && s.isNotEmpty) ? s : null;
  }

  NewsItem copyWith({bool? bookmarked, bool? featured, bool? urgent, bool? hidden}) => NewsItem(
        id: id,
        slug: slug,
        title: title,
        url: url,
        source: source,
        author: author,
        published: published,
        category: category,
        tags: tags,
        imageUrl: imageUrl,
        headline: headline,
        summary: summary,
        impact: impact,
        analysis: analysis,
        hasAnalysis: hasAnalysis,
        urgent: urgent ?? this.urgent,
        featured: featured ?? this.featured,
        hidden: hidden ?? this.hidden,
        commentCount: commentCount,
        bookmarked: bookmarked ?? this.bookmarked,
      );

  factory NewsItem.fromJson(Map<String, dynamic> j) => NewsItem(
        id: (j['_id'] as String?) ?? '',
        slug: j['slug'] as String?,
        title: (j['title'] as String?) ?? '',
        url: (j['url'] as String?) ?? '',
        source: (j['source'] as String?) ?? 'RSS',
        author: j['author'] as String?,
        published: j['published'] != null ? DateTime.tryParse(j['published'] as String) : null,
        category: j['category'] as String?,
        tags: ((j['tags'] as List?) ?? const []).whereType<String>().toList(),
        imageUrl: j['imageUrl'] as String?,
        headline: j['headline'] as String?,
        summary: j['summary'] as String?,
        impact: j['impact'] as String?,
        analysis: j['analysis'] as String?,
        hasAnalysis: (j['hasAnalysis'] as bool?) ?? false,
        urgent: (j['urgent'] as bool?) ?? false,
        featured: (j['featured'] as bool?) ?? false,
        hidden: (j['hidden'] as bool?) ?? false,
        commentCount: ((j['commentCount'] as num?) ?? 0).round(),
        bookmarked: (j['bookmarked'] as bool?) ?? false,
      );

  static List<NewsItem> listFrom(dynamic raw) => ((raw as List?) ?? const [])
      .whereType<Map<String, dynamic>>()
      .map(NewsItem.fromJson)
      .toList();
}

/// One entry in a Daily Brief (server/models/DailyBrief.js + discussion link).
class BriefItem {
  const BriefItem({
    required this.title,
    required this.url,
    this.slug,
    this.headline,
    this.impact,
    this.category,
    this.urgent = false,
    this.commentCount = 0,
  });

  final String title;
  final String url;
  final String? slug;
  final String? headline;
  final String? impact;
  final String? category;
  final bool urgent;
  final int commentCount;

  factory BriefItem.fromJson(Map<String, dynamic> j) => BriefItem(
        title: (j['title'] as String?) ?? '',
        url: (j['url'] as String?) ?? '',
        slug: j['slug'] as String?,
        headline: j['headline'] as String?,
        impact: j['impact'] as String?,
        category: j['category'] as String?,
        urgent: (j['urgent'] as bool?) ?? false,
        commentCount: ((j['commentCount'] as num?) ?? 0).round(),
      );
}

class DailyBrief {
  const DailyBrief({
    required this.label,
    this.windowStart,
    this.windowEnd,
    this.summary,
    this.keyPoints = const [],
    this.statsLine,
    this.items = const [],
  });

  final String label;
  final String? windowStart;
  final String? windowEnd;
  final String? summary;
  final List<String> keyPoints;
  final String? statsLine;
  final List<BriefItem> items;

  factory DailyBrief.fromJson(Map<String, dynamic> j) => DailyBrief(
        label: (j['briefingDateLabel'] as String?) ?? '',
        windowStart: j['windowStart'] as String?,
        windowEnd: j['windowEnd'] as String?,
        summary: j['summary'] as String?,
        keyPoints: ((j['keyPoints'] as List?) ?? const []).whereType<String>().toList(),
        statsLine: j['statsLine'] as String?,
        items: ((j['items'] as List?) ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(BriefItem.fromJson)
            .toList(),
      );
}
