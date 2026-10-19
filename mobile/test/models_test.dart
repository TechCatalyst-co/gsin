import 'package:flutter_test/flutter_test.dart';
import 'package:gsin/models/news_item.dart';
import 'package:gsin/models/user.dart';

void main() {
  test('NewsItem parses the public story shape', () {
    final item = NewsItem.fromJson({
      '_id': 'abc',
      'slug': 'aurora-5-abc123',
      'title': 'Aurora-5 ships',
      'url': 'https://example.com/a',
      'tags': ['llm', 3],
      'hasAnalysis': true,
    });
    expect(item.ref, 'aurora-5-abc123');
    expect(item.tags, ['llm']);
    expect(item.hasAnalysis, isTrue);
    expect(item.analysis, isNull);
  });

  test('User capabilities default to public reading when missing', () {
    final user = User.fromJson({'id': '1', 'email': 'a@b.co'});
    expect(user.capabilities.readNews, isTrue);
    expect(user.capabilities.accessDailyBrief, isTrue);
    expect(user.capabilities.participateInThreads, isFalse);
    expect(user.briefEmails, isTrue);
    expect(user.isStaff, isFalse);
  });

  test('NewsItem reads the Global SI grading fields', () {
    final item = NewsItem.fromJson({
      '_id': 'g1',
      'title': 'DeepMind releases Gemini 4 Argon',
      'url': 'https://deepmind.google/x',
      'source': 'Google DeepMind',
      'category': 'Frontier Models & AGI',
      'kind': 'Model Release',
      'urgencyTier': 1,
      'signalScore': 94,
      'primarySource': true,
      'horizon': 'now',
      'storyKey': 'gemini-4-argon',
      'sourceCount': 3,
      'industryLine': 'A new frontier model shipped today.',
      'capturedAt': '2026-10-18T16:55:58.077Z',
    });
    expect(item.tier, 1);
    expect(item.graded, isTrue);
    expect(item.signalScore, 94);
    expect(item.primarySource, isTrue);
    expect(item.kind, 'Model Release');
    expect(item.storyKey, 'gemini-4-argon');
    expect(item.capturedAt, isNotNull);
    expect(item.dek, isNull);
    expect(item.freshLabel, isNotEmpty);
  });

  test('Plain RSS items are ungraded and default to tier 3', () {
    final item = NewsItem.fromJson({'_id': 'r', 'title': 'T', 'url': 'https://e.com'});
    expect(item.graded, isFalse);
    expect(item.tier, 3);
    expect(NewsItem.fromJson({'_id': 'u', 'title': 'T', 'url': 'https://e.com', 'urgent': true}).tier, 1);
  });

  test('DailyBrief reads both editions', () {
    final evening = DailyBrief.fromJson({
      'briefingDate': '2026-10-18T00:00:00.000Z',
      'briefingDateLabel': 'October 18, 2026',
      'briefType': 'evening',
      'confidence': 82,
      'forwardWatchlist': [{'item': 'EU AI Office guidance', 'window': '48h', 'why': 'Draft leaked'}],
      'watchlistFollowup': [{'predicted': 'OpenAI ships', 'status': 'confirmed', 'evidence': 'Shipped 9am'}],
      'criticalIntelligence': [{'headline': 'H', 'whyItMatters': 'W', 'priority': 'HIGH'}],
      'items': [{'title': 'A', 'url': 'https://a.com', 'urgencyTier': 2, 'signalScore': 70}],
    });
    expect(evening.isEvening, isTrue);
    expect(evening.dateSlug, '2026-10-18');
    expect(evening.confidence, 82);
    expect(evening.forwardWatchlist.single.window, '48h');
    expect(evening.watchlistFollowup.single.confirmed, isTrue);
    expect(evening.criticalIntelligence.single.high, isTrue);
    expect(evening.items.single.urgencyTier, 2);
    final morning = DailyBrief.fromJson({'briefingDate': '2026-10-18T00:00:00.000Z'});
    expect(morning.isEvening, isFalse);
    expect(morning.editionName, 'Morning Briefing');
  });

  test('RadarStatus reads the live strip', () {
    final s = RadarStatus.fromJson({'source_count': 34, 'last_capture_at': '2026-10-18T16:55:58.077Z', 'stories_24h': 16, 'breaking_24h': 3});
    expect(s.sourceCount, 34);
    expect(s.stories24h, 16);
    expect(s.breaking24h, 3);
    expect(s.lastCaptureAt, isNotNull);
  });
}
