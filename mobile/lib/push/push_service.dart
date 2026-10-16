import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';

/// A breaking-news alert, from the FCM `data` payload the API sends
/// (server/utils/push.js).
class BreakingAlert {
  const BreakingAlert({required this.slug, this.title, this.body});

  final String slug;
  final String? title;
  final String? body;

  static BreakingAlert? fromMessage(RemoteMessage m) {
    final slug = m.data['slug'];
    if (m.data['type'] != 'breaking' || slug is! String || slug.isEmpty) return null;
    return BreakingAlert(slug: slug, title: m.notification?.title, body: m.notification?.body);
  }
}

/// Breaking-news push alerts. Each device subscribes to one FCM topic, so
/// alerts work without an account and the preference is per device.
///
/// Push is unavailable (and the toggle hidden) when Firebase isn't configured
/// for the build: no google-services.json / GoogleService-Info.plist.
class PushService extends ChangeNotifier {
  static const _prefKey = 'push_breaking';

  bool _available = false;
  bool _enabled = false;
  bool _blocked = false;

  /// Firebase is configured and initialized on this build.
  bool get available => _available;

  /// This device is subscribed to breaking-news alerts.
  bool get enabled => _enabled;

  /// The reader turned notifications off in system settings.
  bool get blocked => _blocked;

  void Function(BreakingAlert alert)? _onOpen;
  BreakingAlert? _unhandledOpen;

  /// Called when the reader taps an alert (app in background or closed). An
  /// alert tapped before a handler is set is delivered when one is.
  set onOpen(void Function(BreakingAlert alert)? handler) {
    _onOpen = handler;
    final pending = _unhandledOpen;
    if (handler != null && pending != null) {
      _unhandledOpen = null;
      handler(pending);
    }
  }

  void _opened(BreakingAlert alert) {
    final handler = _onOpen;
    if (handler != null) {
      handler(alert);
    } else {
      _unhandledOpen = alert;
    }
  }

  /// Alerts that arrive while the app is open (no system banner is shown).
  final _foreground = StreamController<BreakingAlert>.broadcast();
  Stream<BreakingAlert> get foregroundAlerts => _foreground.stream;

  Future<void> init() async {
    try {
      await Firebase.initializeApp();
    } catch (e) {
      debugPrint('Push disabled: Firebase is not configured ($e)');
      return;
    }
    _available = true;

    final messaging = FirebaseMessaging.instance;
    FirebaseMessaging.onMessageOpenedApp.listen((m) {
      final alert = BreakingAlert.fromMessage(m);
      if (alert != null) _opened(alert);
    });
    FirebaseMessaging.onMessage.listen((m) {
      final alert = BreakingAlert.fromMessage(m);
      if (alert != null) _foreground.add(alert);
    });
    final initial = await messaging.getInitialMessage();
    final launchAlert = initial == null ? null : BreakingAlert.fromMessage(initial);
    if (launchAlert != null) _opened(launchAlert);

    // Alerts are on by default; the first launch asks for permission.
    final prefs = await SharedPreferences.getInstance();
    final wanted = prefs.getBool(_prefKey) ?? true;
    notifyListeners();
    if (wanted) await setEnabled(true, persist: false);
  }

  Future<void> setEnabled(bool value, {bool persist = true}) async {
    if (!_available) return;
    final messaging = FirebaseMessaging.instance;
    try {
      if (value) {
        final settings = await messaging.requestPermission();
        final status = settings.authorizationStatus;
        _blocked = status == AuthorizationStatus.denied;
        if (status != AuthorizationStatus.authorized && status != AuthorizationStatus.provisional) {
          _enabled = false;
          notifyListeners();
          return;
        }
        await messaging.subscribeToTopic(pushTopic);
      } else {
        await messaging.unsubscribeFromTopic(pushTopic);
      }
      _enabled = value;
      if (persist) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(_prefKey, value);
      }
    } catch (e) {
      debugPrint('Push: could not ${value ? 'subscribe' : 'unsubscribe'} ($e)');
    }
    notifyListeners();
  }

  @override
  void dispose() {
    _foreground.close();
    super.dispose();
  }
}
