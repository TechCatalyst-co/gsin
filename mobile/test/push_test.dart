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
}
