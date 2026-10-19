/// Mirrors the public story shape from server/routes/news.js (serialize()),
/// including the Global SI grading fields the radar sends (docs/N8N_API.md §1b).
class NewsItem {
  const NewsItem({
    required this.id,
    this.slug,
    required this.title,
    required this.url,
    required this.source,
    this.author,
    this.published,
    this.capturedAt,
    this.category,
    this.kind,
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
    this.urgencyTier,
    this.tierLabel,
    this.signalScore,
    this.relevance,
    this.primarySource = false,
    this.contentType,
    this.dimensions = const [],
    this.direction,
    this.geo,
    this.horizon,
    this.entities = const [],
    this.whoCares,
    this.industryLine,
    this.storyKey,
    this.updateType,
    this.whatIsNew,
    this.sourceCount,
  });

  final String id;
  final String? slug;
  final String title;
  final String url;
  final String source;
  final String? author;
  final DateTime? published;

  /// When the radar captured it (the live strip's "last sweep").
  final DateTime? capturedAt;

  /// The desk (Global SI domain).
  final String? category;

  /// The event type (Model Release, Research Paper, …).
  final String? kind;
  final List<String> tags;
  final String? imageUrl;
  final String? headline;
  final String? summary;
  final String? impact;

  /// Longer analysis from the n8n pipeline; optional.
  final String? analysis;
  final bool hasAnalysis;
  final bool urgent;
  final bool featured;
  final bool hidden;
  final int commentCount;
  final bool bookmarked;

  // Grading.
  final int? urgencyTier;
  final String? tierLabel;
  final int? signalScore;
  final int? relevance;
  final bool primarySource;
  final String? contentType;
  final List<String> dimensions;
  final String? direction;
  final String? geo;
  final String? horizon;
  final List<String> entities;
  final String? whoCares;

  /// The plain-English line.
  final String? industryLine;
  final String? storyKey;
  final String? updateType;
  final String? whatIsNew;
  final int? sourceCount;

  /// Path segment for /story/:slug (falls back to the id).
  String get ref => slug ?? id;

  /// Tier for display: graded tier, else 1 for breaking, else 3.
  int get tier => urgencyTier ?? (urgent ? 1 : 3);

  /// True once the radar has graded this item (plain RSS items have no score).
  bool get graded => signalScore != null || urgencyTier != null;

  /// Dek shown under the title in lists: impact first, then headline, then summary.
  String? get dek {
    for (final s in [impact, headline, summary]) {
      if (s != null && s.isNotEmpty) return s;
    }
    return null;
  }

  /// Hours since publication, for the "fresh" reading.
  String get freshLabel {
    final d = published;
    if (d == null) return '—';
    final h = DateTime.now().difference(d).inHours;
    if (h < 1) return '<1h';
    if (h < 48) return '${h}h';
    return '${h ~/ 24}d';
  }

  NewsItem copyWith({bool? bookmarked, bool? featured, bool? urgent, bool? hidden}) => NewsItem(
        id: id,
        slug: slug,
        title: title,
        url: url,
        source: source,
        author: author,
        published: published,
        capturedAt: capturedAt,
        category: category,
        kind: kind,
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
        urgencyTier: urgencyTier,
        tierLabel: tierLabel,
        signalScore: signalScore,
        relevance: relevance,
        primarySource: primarySource,
        contentType: contentType,
        dimensions: dimensions,
        direction: direction,
        geo: geo,
        horizon: horizon,
        entities: entities,
        whoCares: whoCares,
        industryLine: industryLine,
        storyKey: storyKey,
        updateType: updateType,
        whatIsNew: whatIsNew,
        sourceCount: sourceCount,
      );

  factory NewsItem.fromJson(Map<String, dynamic> j) => NewsItem(
        id: (j['_id'] as String?) ?? '',
        slug: j['slug'] as String?,
        title: (j['title'] as String?) ?? '',
        url: (j['url'] as String?) ?? '',
        source: (j['source'] as String?) ?? 'RSS',
        author: j['author'] as String?,
        published: _date(j['published']),
        capturedAt: _date(j['capturedAt']),
        category: j['category'] as String?,
        kind: j['kind'] as String?,
        tags: _strings(j['tags']),
        imageUrl: j['imageUrl'] as String?,
        headline: j['headline'] as String?,
        summary: j['summary'] as String?,
        impact: j['impact'] as String?,
        analysis: j['analysis'] as String?,
        hasAnalysis: (j['hasAnalysis'] as bool?) ?? false,
        urgent: (j['urgent'] as bool?) ?? false,
        featured: (j['featured'] as bool?) ?? false,
        hidden: (j['hidden'] as bool?) ?? false,
        commentCount: _int(j['commentCount']) ?? 0,
        bookmarked: (j['bookmarked'] as bool?) ?? false,
        urgencyTier: _int(j['urgencyTier']),
        tierLabel: j['tierLabel'] as String?,
        signalScore: _int(j['signalScore']),
        relevance: _int(j['relevance']),
        primarySource: (j['primarySource'] as bool?) ?? false,
        contentType: j['contentType'] as String?,
        dimensions: _strings(j['dimensions']),
        direction: j['direction'] as String?,
        geo: j['geo'] as String?,
        horizon: j['horizon'] as String?,
        entities: _strings(j['entities']),
        whoCares: j['whoCares'] as String?,
        industryLine: j['industryLine'] as String?,
        storyKey: j['storyKey'] as String?,
        updateType: j['updateType'] as String?,
        whatIsNew: j['whatIsNew'] as String?,
        sourceCount: _int(j['sourceCount']),
      );

  static List<NewsItem> listFrom(dynamic raw) => ((raw as List?) ?? const [])
      .whereType<Map<String, dynamic>>()
      .map(NewsItem.fromJson)
      .toList();
}

DateTime? _date(dynamic v) => v is String ? DateTime.tryParse(v)?.toLocal() : null;
int? _int(dynamic v) => v is num ? v.round() : (v is String ? int.tryParse(v) : null);
List<String> _strings(dynamic v) => ((v as List?) ?? const []).whereType<String>().toList();
Map<String, dynamic>? _map(dynamic v) => v is Map<String, dynamic> ? v : null;
List<Map<String, dynamic>> _maps(dynamic v) => ((v as List?) ?? const []).whereType<Map<String, dynamic>>().toList();

/// What the radar is doing right now: GET /news/status.
class RadarStatus {
  const RadarStatus({
    required this.sourceCount,
    this.lastCaptureAt,
    this.stories24h = 0,
    this.breaking24h = 0,
    this.latestBriefAt,
    this.latestBriefType,
  });

  final int sourceCount;
  final DateTime? lastCaptureAt;
  final int stories24h;
  final int breaking24h;
  final DateTime? latestBriefAt;
  final String? latestBriefType;

  factory RadarStatus.fromJson(Map<String, dynamic> j) => RadarStatus(
        sourceCount: _int(j['source_count']) ?? 34,
        lastCaptureAt: _date(j['last_capture_at']),
        stories24h: _int(j['stories_24h']) ?? 0,
        breaking24h: _int(j['breaking_24h']) ?? 0,
        latestBriefAt: _date(j['latest_brief_at']),
        latestBriefType: j['latest_brief_type'] as String?,
      );
}

/// One entry in a brief (server/models/DailyBrief.js + discussion link).
class BriefItem {
  const BriefItem({
    required this.title,
    required this.url,
    this.slug,
    this.headline,
    this.impact,
    this.category,
    this.source,
    this.urgent = false,
    this.commentCount = 0,
    this.urgencyTier,
    this.signalScore,
    this.primarySource = false,
    this.industryLine,
    this.storyKey,
  });

  final String title;
  final String url;
  final String? slug;
  final String? headline;
  final String? impact;
  final String? category;
  final String? source;
  final bool urgent;
  final int commentCount;
  final int? urgencyTier;
  final int? signalScore;
  final bool primarySource;
  final String? industryLine;
  final String? storyKey;

  factory BriefItem.fromJson(Map<String, dynamic> j) => BriefItem(
        title: (j['title'] as String?) ?? '',
        url: (j['url'] as String?) ?? '',
        slug: j['slug'] as String?,
        headline: j['headline'] as String?,
        impact: j['impact'] as String?,
        category: j['category'] as String?,
        source: j['source'] as String?,
        urgent: (j['urgent'] as bool?) ?? false,
        commentCount: _int(j['commentCount']) ?? 0,
        urgencyTier: _int(j['urgencyTier']),
        signalScore: _int(j['signalScore']),
        primarySource: (j['primarySource'] as bool?) ?? false,
        industryLine: j['industryLine'] as String?,
        storyKey: j['storyKey'] as String?,
      );
}

/// Evening brief: one critical-intelligence card.
class CriticalItem {
  const CriticalItem({required this.headline, this.whyItMatters, this.priority, this.domain, this.url});
  final String headline;
  final String? whyItMatters;
  final String? priority;
  final String? domain;
  final String? url;
  bool get high => (priority ?? '').toUpperCase() == 'HIGH';

  factory CriticalItem.fromJson(Map<String, dynamic> j) => CriticalItem(
        headline: (j['headline'] as String?) ?? '',
        whyItMatters: j['whyItMatters'] as String?,
        priority: j['priority'] as String?,
        domain: j['domain'] as String?,
        url: j['url'] as String?,
      );
}

class Trend {
  const Trend({required this.trend, this.evidence, this.domain});
  final String trend;
  final String? evidence;
  final String? domain;
  factory Trend.fromJson(Map<String, dynamic> j) =>
      Trend(trend: (j['trend'] as String?) ?? '', evidence: j['evidence'] as String?, domain: j['domain'] as String?);
}

/// The analyst's forecast for the next 24 to 72 hours.
class Forecast {
  const Forecast({required this.item, this.window, this.why});
  final String item;
  final String? window;
  final String? why;
  factory Forecast.fromJson(Map<String, dynamic> j) =>
      Forecast(item: (j['item'] as String?) ?? '', window: j['window'] as String?, why: j['why'] as String?);
}

/// Yesterday's forecast, graded.
class Followup {
  const Followup({required this.predicted, this.status, this.evidence});
  final String predicted;
  final String? status;
  final String? evidence;
  bool get confirmed => status == 'confirmed';
  String get statusLabel => (status ?? 'pending').replaceAll('_', ' ');
  factory Followup.fromJson(Map<String, dynamic> j) =>
      Followup(predicted: (j['predicted'] as String?) ?? '', status: j['status'] as String?, evidence: j['evidence'] as String?);
}

/// A Morning Briefing or an Evening Daily Brief.
class DailyBrief {
  const DailyBrief({
    required this.label,
    required this.briefType,
    this.dateSlug,
    this.windowStart,
    this.windowEnd,
    this.summary,
    this.plainSummary,
    this.watchToday,
    this.horizonNote,
    this.generatedAt,
    this.keyPoints = const [],
    this.statsLine,
    this.confidence,
    this.qaNote,
    this.criticalIntelligence = const [],
    this.emergingTrends = const [],
    this.crossDomainInsights = const [],
    this.forwardWatchlist = const [],
    this.watchlistFollowup = const [],
    this.items = const [],
  });

  final String label;

  /// `morning` or `evening`.
  final String briefType;

  /// YYYY-MM-DD.
  final String? dateSlug;
  final String? windowStart;
  final String? windowEnd;
  final String? summary;
  final String? plainSummary;
  final String? watchToday;
  final String? horizonNote;
  final DateTime? generatedAt;
  final List<String> keyPoints;
  final String? statsLine;

  /// Evening only: the QA stage's confidence, 0–100.
  final int? confidence;
  final String? qaNote;
  final List<CriticalItem> criticalIntelligence;
  final List<Trend> emergingTrends;
  final List<String> crossDomainInsights;
  final List<Forecast> forwardWatchlist;
  final List<Followup> watchlistFollowup;
  final List<BriefItem> items;

  bool get isEvening => briefType == 'evening';
  String get editionName => isEvening ? 'Evening Daily Brief' : 'Morning Briefing';
  String get scheduleLabel => isEvening ? '5:25 PM PT' : '6:50 AM PT';

  factory DailyBrief.fromJson(Map<String, dynamic> j) {
    final iso = j['briefingDate'] as String?;
    return DailyBrief(
      label: (j['briefingDateLabel'] as String?) ?? (iso != null && iso.length >= 10 ? iso.substring(0, 10) : ''),
      briefType: (j['briefType'] as String?) ?? 'morning',
      dateSlug: (j['dateSlug'] as String?) ?? (iso != null && iso.length >= 10 ? iso.substring(0, 10) : null),
      windowStart: j['windowStart'] as String?,
      windowEnd: j['windowEnd'] as String?,
      summary: j['summary'] as String?,
      plainSummary: j['plainSummary'] as String?,
      watchToday: j['watchToday'] as String?,
      horizonNote: j['horizonNote'] as String?,
      generatedAt: _date(j['generatedAt']),
      keyPoints: _strings(j['keyPoints']),
      statsLine: j['statsLine'] as String?,
      confidence: _int(j['confidence']),
      qaNote: j['qaNote'] as String?,
      criticalIntelligence: _maps(j['criticalIntelligence']).map(CriticalItem.fromJson).toList(),
      emergingTrends: _maps(j['emergingTrends']).map(Trend.fromJson).toList(),
      crossDomainInsights: _strings(j['crossDomainInsights']),
      forwardWatchlist: _maps(j['forwardWatchlist']).map(Forecast.fromJson).toList(),
      watchlistFollowup: _maps(j['watchlistFollowup']).map(Followup.fromJson).toList(),
      items: _maps(j['items']).map(BriefItem.fromJson).toList(),
    );
  }

  static DailyBrief? maybeFrom(dynamic raw) {
    final m = _map(raw);
    return m == null ? null : DailyBrief.fromJson(m);
  }
}

/// One edition in GET /daily-brief/dates → editions[].
class Edition {
  const Edition(this.date, this.type);
  final String date;
  final String type;
}
