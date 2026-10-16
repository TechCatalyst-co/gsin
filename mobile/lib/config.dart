import 'package:flutter/foundation.dart';

/// Base URL of the Singularity Wire API.
///
/// Debug/profile builds default to the local dev server; release builds
/// default to the production API. On the Android emulator the host
/// machine's localhost is 10.0.2.2, so run with:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000
const String _defaultApiBaseUrl = kReleaseMode
    ? 'https://singularity-wire-api.onrender.com'
    : 'http://localhost:4000';

const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: _defaultApiBaseUrl,
);

/// Public web origin, used for share links and the Premium link-out.
const String webBaseUrl = String.fromEnvironment(
  'WEB_BASE_URL',
  defaultValue: kReleaseMode
      ? 'https://singularitywire.example.com'
      : 'http://localhost:5173',
);

/// Versioned API path prefix appended after [apiBaseUrl].
const String apiPathPrefix = '/api/v1';

/// App Store 3.1.1 kill-switch for the "Get Premium on the web" link-out.
/// Build with --dart-define=SHOW_UPGRADE_LINKS=false if App Review objects;
/// Premium screens then explain the benefit without linking out.
const bool showUpgradeLinks = bool.fromEnvironment(
  'SHOW_UPGRADE_LINKS',
  defaultValue: true,
);
