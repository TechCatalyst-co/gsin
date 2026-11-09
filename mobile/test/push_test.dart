import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gsin/push/push_service.dart';
import 'package:gsin/state/alerts_state.dart';

void main() {
  test('BreakingAlert reads the API payload', () {
    final alert = BreakingAlert.fromMessage(const RemoteMessage(
      data: {'type': 'breaking', 'slug': 'lab-ships-agi-claim-ab12', 'id': '1'},
      notification: RemoteNotification(title: 'Lab ships AGI claim', body: 'What it means'),
    ));
    expect(alert?.slug, 'lab-ships-agi-claim-ab12');
    expect(alert?.title, 'Lab ships AGI claim');
    expect(alert?.body, 'What it means');
  });

  test('BreakingAlert ignores other messages', () {
    expect(BreakingAlert.fromMessage(const RemoteMessage(data: {'slug': 'x'})), isNull);
    expect(BreakingAlert.fromMessage(const RemoteMessage(data: {'type': 'breaking'})), isNull);
  });

  test('PushService is off until Firebase is configured', () {
    final push = PushService();
    expect(push.available, isFalse);
    expect(push.enabled, isFalse);
  });

  test('PushAlert reads a brief payload and routes to the edition', () {
    final alert = PushAlert.fromMessage(const RemoteMessage(
      data: {'type': 'brief', 'date': '2026-10-18', 'briefType': 'evening'},
      notification: RemoteNotification(title: 'Evening Daily Brief is out'),
    ));
    expect(alert?.isBrief, isTrue);
    expect(alert?.route, '/intelligence/2026-10-18/evening');
    expect(PushAlert.fromMessage(const RemoteMessage(data: {'type': 'brief'})), isNull);
  });

  test('Breaking alerts route to the story', () {
    final alert = PushAlert.fromMessage(const RemoteMessage(data: {'type': 'breaking', 'slug': 'a-b'}));
    expect(alert?.route, '/story/a-b');
  });

  test('PushAlert reads /news/alerts rows and routes like a push', () {
    final rows = PushAlert.listFrom([
      {'type': 'brief', 'at': '2026-11-09T01:26:00.000Z', 'title': 'Evening Daily Brief is out', 'date': '2026-11-08', 'briefType': 'evening'},
      {'type': 'breaking', 'at': '2026-11-09T00:10:00.000Z', 'title': 'Lab ships AGI claim', 'slug': 'lab-ships-agi-claim-ab12'},
      {'type': 'breaking', 'title': 'no slug'},
      {'type': 'other'},
    ]);
    expect(rows.length, 2);
    expect(rows[0].isBrief, isTrue);
    expect(rows[0].route, '/intelligence/2026-11-08/evening');
    expect(rows[0].at, DateTime.utc(2026, 11, 9, 1, 26));
    expect(rows[1].route, '/story/lab-ships-agi-claim-ab12');
    expect(rows[1].title, 'Lab ships AGI claim');
  });

  test('alerts are unread until the newest one has been seen', () {
    final rows = PushAlert.listFrom([
      {'type': 'breaking', 'at': '2026-11-09T03:56:00.000Z', 'slug': 'a'},
      {'type': 'breaking', 'at': '2026-11-08T03:56:00.000Z', 'slug': 'b'},
    ]);
    expect(AlertsState.hasUnread(const [], null), isFalse);
    expect(AlertsState.hasUnread(rows, null), isTrue);
    expect(AlertsState.hasUnread(rows, DateTime.utc(2026, 11, 9)), isTrue);
    expect(AlertsState.hasUnread(rows, DateTime.utc(2026, 11, 9, 3, 56)), isFalse);
  });
}
