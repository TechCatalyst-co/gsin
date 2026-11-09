import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api_client.dart';
import '../api/gsi_api.dart';
import '../push/push_service.dart';

/// The bell: push alerts that went out (from GET /news/alerts), and whether
/// any are newer than the last time this device opened the list. "Seen" is a
/// single timestamp per device, like the push preferences.
class AlertsState extends ChangeNotifier {
  AlertsState(this._api);
  final ApiClient _api;

  static const _prefSeen = 'alerts_last_seen';

  List<PushAlert> items = const [];
  bool loading = false;
  bool failed = false;
  DateTime? _seen;

  /// Something arrived since the list was last opened.
  bool get unread => hasUnread(items, _seen);

  @visibleForTesting
  static bool hasUnread(List<PushAlert> items, DateTime? seen) {
    final newest = items.isEmpty ? null : items.first.at;
    if (newest == null) return false;
    return seen == null || newest.isAfter(seen);
  }

  Future<void> start() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final ms = prefs.getInt(_prefSeen);
      if (ms != null) _seen = DateTime.fromMillisecondsSinceEpoch(ms, isUtc: true);
    } catch (_) {
      /* no prefs: everything counts as new */
    }
    await refresh();
  }

  Future<void> refresh() async {
    loading = true;
    notifyListeners();
    try {
      items = await _api.alerts();
      failed = false;
    } catch (_) {
      failed = true; // keep the last list
    }
    loading = false;
    notifyListeners();
  }

  /// The list was opened: everything in it is now seen.
  Future<void> markSeen() async {
    final newest = items.isEmpty ? null : items.first.at;
    if (newest == null || !unread) return;
    _seen = newest;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_prefSeen, newest.millisecondsSinceEpoch);
    } catch (_) {}
  }
}
