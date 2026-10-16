import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config.dart';
import 'api_exception.dart';

/// Thin JSON wrapper around the Global Super Intelligence News API. Auth is carried by an
/// Authorization: Bearer header (unlike the web client, which uses the
/// HttpOnly cookie).
class ApiClient {
  ApiClient({http.Client? httpClient}) : _http = httpClient ?? http.Client();

  final http.Client _http;
  String? _token;

  set token(String? value) => _token = value;

  Future<Map<String, dynamic>> get(String path) => _send('GET', path);

  Future<Map<String, dynamic>> post(
    String path, [
    Map<String, dynamic>? body,
  ]) => _send('POST', path, body);

  Future<Map<String, dynamic>> patch(String path, Map<String, dynamic> body) =>
      _send('PATCH', path, body);

  Future<Map<String, dynamic>> put(String path, Map<String, dynamic> body) =>
      _send('PUT', path, body);

  Future<Map<String, dynamic>> delete(String path) => _send('DELETE', path);

  Future<Map<String, dynamic>> _send(
    String method,
    String path, [
    Map<String, dynamic>? body,
  ]) async {
    final uri = Uri.parse('$apiBaseUrl$apiPathPrefix$path');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };

    http.Response res;
    try {
      res = switch (method) {
        'GET' => await _http.get(uri, headers: headers),
        'PATCH' => await _http.patch(
          uri,
          headers: headers,
          body: jsonEncode(body ?? {}),
        ),
        'PUT' => await _http.put(
          uri,
          headers: headers,
          body: jsonEncode(body ?? {}),
        ),
        'DELETE' => await _http.delete(uri, headers: headers),
        _ => await _http.post(
          uri,
          headers: headers,
          body: jsonEncode(body ?? {}),
        ),
      };
    } on SocketException {
      throw ApiException(
        0,
        'Could not reach the server. Check your connection.',
      );
    } on http.ClientException {
      throw ApiException(
        0,
        'Could not reach the server. Check your connection.',
      );
    }

    Map<String, dynamic>? data;
    try {
      data = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      /* no body */
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw ApiException(
        res.statusCode,
        (data?['error'] as String?) ?? 'Request failed (${res.statusCode})',
        data,
      );
    }
    return data ?? {};
  }
}
