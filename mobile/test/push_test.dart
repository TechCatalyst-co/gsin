import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gsin/push/push_service.dart';

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
}
