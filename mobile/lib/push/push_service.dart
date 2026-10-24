import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';

/// A push alert, from the FCM `data` payload the API sends
/// (server/utils/push.js): a breaking story, or a brief going out.
class PushAlert {
  const PushAlert.breaking({required this.slug, this.title, this.body})
      : type = 'breaking',
        date = null,
        briefType = null;

  const PushAlert.brief({required this.date, required this.briefType, this.title, this.body})
      : type = 'brief',
        slug = null;

  final String type;
  final String? slug;
  final String? date;
  final String? briefType;
  final String? title;
  final String? body;

  bool get isBrief => type == 'brief';

  /// Where a tap on the alert goes.
  String get route => isBrief ? '/intelligence/$date/${briefType ?? 'morning'}' : '/story/${Uri.encodeComponent(slug ?? '')}';

  static PushAlert? fromMessage(RemoteMessage m) {
    final type = m.data['type'];
    if (type == 'breaking') {
      final slug = m.data['slug'];
      if (slug is! String || slug.isEmpty) return null;
      return PushAlert.breaking(slug: slug, title: m.notification?.title, body: m.notification?.body);
    }
    if (type == 'brief') {
      final date = m.data['date'];
      if (date is! String || date.isEmpty) return null;
      return PushAlert.brief(date: date, briefType: m.data['briefType'] as String?, title: m.notification?.title, body: m.notification?.body);
    }
    return null;
  }
}

/// Older name, kept for callers.
typedef BreakingAlert = PushAlert;

/// Push alerts over two FCM topics: breaking stories and the twice-daily brief.
/// Each device subscribes directly, so alerts work without an account and the
/// preferences are per device.
///
/// Push is unavailable (and the toggles hidden) when Firebase isn't configured
/// for the build: no google-services.json / GoogleService-Info.plist.
class PushService extends ChangeNotifier {
  static const _prefBreaking = 'push_breaking';
  static const _prefBrief = 'push_brief';

  bool _available = false;
  bool _enabled = false;
  bool _briefEnabled = false;
  bool _blocked = false;

  /// Firebase is configured and initialized on this build.
  bool get available => _available;

  /// This device is subscribed to breaking-news alerts.
  bool get enabled => _enabled;

  /// This device is subscribed to "the brief is out" alerts.
  bool get briefEnabled => _briefEnabled;

  /// The reader turned notifications off in system settings.
  bool get blocked => _blocked;

  void Function(PushAlert alert)? _onOpen;
  PushAlert? _unhandledOpen;

  /// Called when the reader taps an alert (app in background or closed). An
  /// alert tapped before a handler is set is delivered when one is.
  set onOpen(void Function(PushAlert alert)? handler) {
    _onOpen = handler;
    final pending = _unhandledOpen;
    if (handler != null && pending != null) {
      _unhandledOpen = null;
      handler(pending);
    }
  }

  void _opened(PushAlert alert) {
    final handler = _onOpen;
    if (handler != null) {
      handler(alert);
    } else {
      _unhandledOpen = alert;
    }
  }

  /// Alerts that arrive while the app is open (no system banner is shown).
  final _foreground = StreamController<PushAlert>.broadcast();
  Stream<PushAlert> get foregroundAlerts => _foreground.stream;

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
      final alert = PushAlert.fromMessage(m);
      if (alert != null) _opened(alert);
    });
    FirebaseMessaging.onMessage.listen((m) {
      final alert = PushAlert.fromMessage(m);
      if (alert != null) _foreground.add(alert);
    });
    final initial = await messaging.getInitialMessage();
    final launchAlert = initial == null ? null : PushAlert.fromMessage(initial);
    if (launchAlert != null) _opened(launchAlert);

    // Both alerts are on by default; the first launch asks for permission once.
    final prefs = await SharedPreferences.getInstance();
    final wantBreaking = prefs.getBool(_prefBreaking) ?? true;
    final wantBrief = prefs.getBool(_prefBrief) ?? true;
    notifyListeners();
    if (wantBreaking) await setEnabled(true, persist: false);
    if (wantBrief) await setBriefEnabled(true, persist: false);
  }

  Future<bool> _permission() async {
    final settings = await FirebaseMessaging.instance.requestPermission();
    final status = settings.authorizationStatus;
    _blocked = status == AuthorizationStatus.denied;
    return status == AuthorizationStatus.authorized || status == AuthorizationStatus.provisional;
  }

  Future<void>? _apnsToken;

  /// On iOS, FCM can't subscribe to topics until APNs has handed the device its
  /// token, which arrives asynchronously after permission is granted. Waits for
  /// it (shared across callers), giving up after ~10s.
  Future<void> _awaitApnsToken() {
    if (defaultTargetPlatform != TargetPlatform.iOS) return Future.value();
    return _apnsToken ??= () async {
      final messaging = FirebaseMessaging.instance;
      for (var i = 0; i < 20; i++) {
        if (await messaging.getAPNSToken() != null) return;
        await Future<void>.delayed(const Duration(milliseconds: 500));
      }
      _apnsToken = null; // let a later toggle try again
      throw StateError('no APNs token after 10s (check the Push Notifications capability and signing)');
    }();
  }

  Future<void> setEnabled(bool value, {bool persist = true}) async {
    if (!_available) return;
    final messaging = FirebaseMessaging.instance;
    try {
      if (value) {
        if (!await _permission()) {
          _enabled = false;
          notifyListeners();
          return;
        }
        await _awaitApnsToken();
        await messaging.subscribeToTopic(pushTopic);
      } else {
        await messaging.unsubscribeFromTopic(pushTopic);
      }
      _enabled = value;
      if (persist) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(_prefBreaking, value);
      }
    } catch (e) {
      debugPrint('Push: could not ${value ? 'subscribe' : 'unsubscribe'} ($e)');
    }
    notifyListeners();
  }

  Future<void> setBriefEnabled(bool value, {bool persist = true}) async {
    if (!_available) return;
    final messaging = FirebaseMessaging.instance;
    try {
      if (value) {
        if (!await _permission()) {
          _briefEnabled = false;
          notifyListeners();
          return;
        }
        await _awaitApnsToken();
        await messaging.subscribeToTopic(pushBriefTopic);
      } else {
        await messaging.unsubscribeFromTopic(pushBriefTopic);
      }
      _briefEnabled = value;
      if (persist) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(_prefBrief, value);
      }
    } catch (e) {
      debugPrint('Push: could not ${value ? 'subscribe to' : 'unsubscribe from'} the brief topic ($e)');
    }
    notifyListeners();
  }

  @override
  void dispose() {
    _foreground.close();
    super.dispose();
  }
}
