import 'package:flutter_test/flutter_test.dart';
import 'package:singularity_wire/models/news_item.dart';
import 'package:singularity_wire/models/user.dart';

void main() {
  test('NewsItem parses the public story shape', () {
    final item = NewsItem.fromJson({
      '_id': 'abc',
      'slug': 'aurora-5-abc123',
      'title': 'Aurora-5 ships',
      'url': 'https://example.com/a',
      'relevance': 140,
      'tags': ['llm', 3],
      'hasAnalysis': true,
    });
    expect(item.ref, 'aurora-5-abc123');
    expect(item.relevance, 100);
    expect(item.tags, ['llm']);
    expect(item.hasAnalysis, isTrue);
    expect(item.analysis, isNull);
  });

  test('User capabilities default to anonymous when missing', () {
    final user = User.fromJson({'id': '1', 'email': 'a@b.co'});
    expect(user.capabilities.readNews, isTrue);
    expect(user.capabilities.accessDailyBrief, isFalse);
    expect(user.isStaff, isFalse);
  });
}
