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
}
