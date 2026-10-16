/// Error thrown for any non-2xx API response, mirroring the web client's
/// fetch wrapper (client/src/api.js).
class ApiException implements Exception {
  ApiException(this.status, this.message, [this.data]);

  final int status;
  final String message;
  final Map<String, dynamic>? data;

  @override
  String toString() => message;
}
