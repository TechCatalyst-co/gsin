import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gsin/api/api_client.dart';
import 'package:gsin/auth/auth_state.dart';

const _authResponse = {
  'token': 'jwt-123',
  'user': {'id': 'u1', 'email': 'reader@example.com', 'role': 'member'},
};

class _FakeApi extends ApiClient {
  @override
  Future<Map<String, dynamic>> post(String path, [Map<String, dynamic>? body]) async => _authResponse;
}

/// In-memory keychain; `broken` makes every call throw like a device whose
/// keychain/keystore is unavailable.
class _FakeStorage extends FlutterSecureStorage {
  _FakeStorage({this.broken = false});

  final bool broken;
  final values = <String, String>{};

  void _check() {
    if (broken) throw PlatformException(code: 'keychain', message: 'unavailable');
  }

  @override
  Future<void> write({
    required String key,
    required String? value,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    AppleOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    _check();
    if (value != null) values[key] = value;
  }

  @override
  Future<String?> read({
    required String key,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    AppleOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    _check();
    return values[key];
  }

  @override
  Future<void> delete({
    required String key,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    AppleOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    _check();
    values.remove(key);
  }
}

void main() {
  test('login signs in and persists the token', () async {
    final storage = _FakeStorage();
    final auth = AuthState(_FakeApi(), storage: storage);
    await auth.login('reader@example.com', 'password1');
    expect(auth.isAuthed, isTrue);
    expect(auth.user?.email, 'reader@example.com');
    expect(storage.values['gsin_token'], 'jwt-123');
  });

  test('a keychain failure does not block sign-in or sign-up', () async {
    final auth = AuthState(_FakeApi(), storage: _FakeStorage(broken: true));
    await auth.register('Reader', 'reader@example.com', 'password1');
    expect(auth.isAuthed, isTrue);
    await auth.logout();
    expect(auth.status, AuthStatus.guest);
    await auth.login('reader@example.com', 'password1');
    expect(auth.isAuthed, isTrue);
  });

  test('an unreadable keychain on launch falls back to guest', () async {
    final auth = AuthState(_FakeApi(), storage: _FakeStorage(broken: true));
    await auth.init();
    expect(auth.status, AuthStatus.guest);
  });
}
