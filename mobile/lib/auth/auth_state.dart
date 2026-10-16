import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../models/user.dart';

enum AuthStatus { unknown, guest, authed }

/// Session state, the Flutter counterpart of client/src/auth/AuthContext.jsx.
/// The JWT lives in the platform keychain/keystore and is injected into the
/// ApiClient as a Bearer header.
class AuthState extends ChangeNotifier {
  AuthState(this._api, {FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  static const _tokenKey = 'gsin_token';

  // Floor on how long the branded splash stays up on launch, so a fast
  // (cached-token) auth check doesn't make it flash. Kept short so it never
  // becomes a noticeable startup delay. Applies to init() only —
  // login/logout/refresh transitions are never delayed.
  static const _minSplash = Duration(milliseconds: 600);

  final ApiClient _api;
  final FlutterSecureStorage _storage;

  AuthStatus _status = AuthStatus.unknown;
  User? _user;

  AuthStatus get status => _status;
  User? get user => _user;

  /// Restore the persisted session on app launch.
  Future<void> init() async {
    final started = DateTime.now();
    final token = await _storage.read(key: _tokenKey);
    if (token == null) {
      await _awaitMinSplash(started);
      _setGuest();
      return;
    }
    _api.token = token;
    try {
      final data = await _api.get('/auth/me');
      final user = User.fromJson(data['user'] as Map<String, dynamic>);
      await _awaitMinSplash(started);
      _user = user;
      _status = AuthStatus.authed;
      notifyListeners();
    } on ApiException catch (e) {
      await _awaitMinSplash(started);
      if (e.status == 401) {
        await handleUnauthorized();
      } else {
        // Server unreachable etc. — keep the token so the next launch can
        // restore the session; browse as a guest meanwhile.
        _setGuest(clearToken: false);
      }
    }
  }

  /// Hold the initial transition until the splash has shown for [_minSplash].
  Future<void> _awaitMinSplash(DateTime started) async {
    final remaining = _minSplash - DateTime.now().difference(started);
    if (remaining > Duration.zero) await Future.delayed(remaining);
  }

  Future<void> login(String email, String password) =>
      _authenticate('/auth/login', {'email': email, 'password': password});

  Future<void> register(String name, String email, String password) =>
      _authenticate('/auth/register', {
        if (name.isNotEmpty) 'name': name,
        'email': email,
        'password': password,
      });

  /// Signed-in readers can post, save and follow; everyone can read.
  bool get isAuthed => _status == AuthStatus.authed && _user != null;

  /// Locally reflect a brief-email preference saved via PUT /me/preferences.
  void setBriefEmails(bool value) {
    final u = _user;
    if (u == null) return;
    _user = u.copyWith(briefEmails: value);
    notifyListeners();
  }

  /// Locally reflect a followed-topics change saved via PUT /me/categories.
  void setFollowedCategories(List<String> categories) {
    final u = _user;
    if (u == null) return;
    _user = u.copyWith(followedCategories: categories);
    notifyListeners();
  }

  Future<void> _authenticate(String path, Map<String, dynamic> body) async {
    // `client: 'mobile'` opts into the longer-lived mobile token.
    final data = await _api.post(path, {...body, 'client': 'mobile'});
    final token = data['token'] as String;
    await _storage.write(key: _tokenKey, value: token);
    _api.token = token;
    _user = User.fromJson(data['user'] as Map<String, dynamic>);
    _status = AuthStatus.authed;
    notifyListeners();
  }

  /// Re-fetch the current user, e.g. after subscribing on the web.
  Future<void> refresh() async {
    try {
      final data = await _api.get('/auth/me');
      _user = User.fromJson(data['user'] as Map<String, dynamic>);
      notifyListeners();
    } on ApiException catch (e) {
      if (e.status == 401) await handleUnauthorized();
      // Other failures leave the current session untouched.
    }
  }

  Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    final data = await _api.post('/auth/change-password', {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
      'client': 'mobile',
    });
    final token = data['token'] as String;
    await _storage.write(key: _tokenKey, value: token);
    _api.token = token;
    _user = User.fromJson(data['user'] as Map<String, dynamic>);
    notifyListeners();
  }

  Future<void> logout() => handleUnauthorized();

  /// Clear the stored session. Reading stays available signed out.
  Future<void> handleUnauthorized() async {
    await _storage.delete(key: _tokenKey);
    _setGuest();
  }

  void _setGuest({bool clearToken = true}) {
    if (clearToken) _api.token = null;
    _user = null;
    _status = AuthStatus.guest;
    notifyListeners();
  }
}
