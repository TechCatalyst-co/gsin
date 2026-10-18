import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'api/api_client.dart';
import 'app.dart';
import 'auth/auth_state.dart';
import 'push/push_service.dart';
import 'theme/app_theme.dart';
import 'widgets/radar_strip.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final api = ApiClient();
  final auth = AuthState(api)..init();
  final push = PushService()..init();
  final theme = ThemeController()..init();
  final radar = RadarState(api)..start();

  runApp(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider.value(value: push),
        ChangeNotifierProvider.value(value: theme),
        ChangeNotifierProvider.value(value: radar),
      ],
      child: GsinApp(auth: auth, push: push, theme: theme),
    ),
  );
}
