import '../models/news_item.dart';
import 'api_client.dart';

/// Typed reads for the Global SI screens, on top of [ApiClient]. Every call
/// maps to a public endpoint in docs/N8N_API.md.
extension GsiApi on ApiClient {
  /// The graded feed. `domains` may name several desks (repeated `domain=`),
  /// `tier` is the loosest tier to include (3 = tiers 1–3), `hours` a rolling
  /// window, `sort` one of signal | latest | discussed.
  Future<List<NewsItem>> feed({
    List<String> domains = const [],
    int? tier,
    String? horizon,
    int? hours,
    String sort = 'signal',
    int limit = 40,
    int page = 1,
    String? search,
    String? tag,
  }) async {
    final qs = <String>[
      for (final d in domains) 'domain=${Uri.encodeQueryComponent(d)}',
      if (tier != null) 'tier=$tier',
      if (horizon != null) 'horizon=${Uri.encodeQueryComponent(horizon)}',
      if (hours != null) 'hours=$hours',
      if (search != null && search.isNotEmpty) 'search=${Uri.encodeQueryComponent(search)}',
      if (tag != null && tag.isNotEmpty) 'tag=${Uri.encodeQueryComponent(tag)}',
      'sort=$sort',
      'limit=$limit',
      'page=$page',
    ].join('&');
    final data = await get('/news?$qs');
    return NewsItem.listFrom(data['items']);
  }

  /// Breaking / lead / picks / latest / most discussed in one call.
  Future<Map<String, dynamic>> frontPage() => get('/news/front-page');

  /// The live strip.
  Future<RadarStatus> status() async => RadarStatus.fromJson(await get('/news/status'));

  /// Every capture of one underlying story, primary source first.
  Future<({NewsItem lead, List<NewsItem> captures})> storyGroup(String storyKey) async {
    final data = await get('/news/story/${Uri.encodeComponent(storyKey)}');
    final lead = NewsItem.fromJson(data['lead'] as Map<String, dynamic>);
    return (lead: lead, captures: NewsItem.listFrom(data['captures']));
  }

  /// One brief: the latest (optionally of one type), or a dated edition.
  Future<DailyBrief?> brief({String? date, String? type}) async {
    final path = date == null
        ? '/daily-brief/latest${type != null ? '?type=$type' : ''}'
        : '/daily-brief/$date${type != null ? '/$type' : ''}';
    final data = await get(path);
    return DailyBrief.maybeFrom(data['brief']);
  }

  /// Recent briefs without their items (cards on the Signal tab).
  Future<List<DailyBrief>> briefList({int limit = 4, String? type}) async {
    final data = await get('/daily-brief/list?limit=$limit${type != null ? '&type=$type' : ''}');
    return ((data['briefs'] as List?) ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(DailyBrief.fromJson)
        .toList();
  }

  /// Which editions exist, newest first.
  Future<List<Edition>> editions() async {
    final data = await get('/daily-brief/dates');
    final raw = (data['editions'] as List?) ?? const [];
    final out = <Edition>[
      for (final e in raw.whereType<Map<String, dynamic>>())
        if (e['date'] is String && e['type'] is String) Edition(e['date'] as String, e['type'] as String),
    ];
    if (out.isEmpty) {
      // Older servers only return `dates`.
      for (final d in ((data['dates'] as List?) ?? const []).whereType<String>()) {
        out.add(Edition(d, 'morning'));
      }
    }
    return out;
  }
}
