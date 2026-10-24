import 'package:flutter/foundation.dart';

/// Base URL of the Global SI News API (server/).
///
/// Debug/profile builds default to the local dev server; release builds
/// default to the production API on Render. On the Android emulator the host
/// machine's localhost is 10.0.2.2, so run with:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000
const String _defaultApiBaseUrl = kReleaseMode
    ? 'https://gsin-api.onrender.com'
    : 'http://localhost:4000';

const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: _defaultApiBaseUrl,
);

/// Public web origin, used for share links and legal pages.
const String webBaseUrl = String.fromEnvironment(
  'WEB_BASE_URL',
  defaultValue: kReleaseMode
      ? 'https://globalsinews.com'
      : 'http://localhost:5173',
);

/// Versioned API path prefix appended after [apiBaseUrl].
const String apiPathPrefix = '/api/v1';

/// FCM topic for breaking-news alerts. Must match the API's PUSH_TOPIC; use a
/// separate topic (e.g. breaking-dev) for development builds.
const String pushTopic = String.fromEnvironment('PUSH_TOPIC', defaultValue: 'breaking');

/// FCM topic for "the brief is out" pushes (twice a day). Must match the API's
/// PUSH_BRIEF_TOPIC.
const String pushBriefTopic = String.fromEnvironment('PUSH_BRIEF_TOPIC', defaultValue: 'brief');

/// Shown in the launch readout and the Account screen.
const String appVersionLabel = 'v2.0.2';
