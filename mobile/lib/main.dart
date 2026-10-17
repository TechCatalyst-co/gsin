import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'api/api_client.dart';
import 'app.dart';
import 'auth/auth_state.dart';
import 'push/push_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final api = ApiClient();
  final auth = AuthState(api)..init();
  final push = PushService()..init();

  runApp(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider.value(value: push),
      ],
      child: GsinApp(auth: auth, push: push),
    ),
  );
}
