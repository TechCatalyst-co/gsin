import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'auth/auth_state.dart';
import 'brand.dart';
import 'models/news_item.dart';
import 'push/push_service.dart';
import 'screens/account_screen.dart';
import 'screens/change_password_screen.dart';
import 'screens/intelligence_screen.dart';
import 'screens/login_screen.dart';
import 'screens/newsroom_screen.dart';
import 'screens/radar_screen.dart';
import 'screens/register_screen.dart';
import 'screens/saved_screen.dart';
import 'screens/signal_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/story_screen.dart';
import 'screens/topics_screen.dart';
import 'screens/watchlist_screen.dart';
import 'theme/app_theme.dart';
import 'widgets/common.dart';
import 'widgets/radar_strip.dart';

class GsinApp extends StatefulWidget {
  const GsinApp({super.key, required this.auth, required this.push, required this.theme});

  final AuthState auth;
  final PushService push;
  final ThemeController theme;

  @override
  State<GsinApp> createState() => _GsinAppState();
}

class _GsinAppState extends State<GsinApp> with WidgetsBindingObserver {
  final _messenger = GlobalKey<ScaffoldMessengerState>();
  StreamSubscription<PushAlert>? _foregroundAlerts;
  PushAlert? _pendingAlert;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    widget.auth.addListener(_openPendingAlert);
    widget.push.onOpen = _openAlert;
    _foregroundAlerts = widget.push.foregroundAlerts.listen(_showForegroundAlert);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    widget.auth.removeListener(_openPendingAlert);
    widget.push.onOpen = null;
    _foregroundAlerts?.cancel();
    super.dispose();
  }

  // A tapped alert opens its story (or brief) on top of the Signal tab. On a
  // cold start the launch sequence is still running, so it waits for auth.
  void _openAlert(PushAlert alert) {
    _pendingAlert = alert;
    _openPendingAlert();
  }

  void _openPendingAlert() {
    final alert = _pendingAlert;
    if (alert == null || widget.auth.status == AuthStatus.unknown) return;
    _pendingAlert = null;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_router.state.matchedLocation == '/splash') _router.go('/');
      _router.push(alert.route);
    });
  }

  void _showForegroundAlert(PushAlert alert) {
    _messenger.currentState?.showSnackBar(SnackBar(
      content: Text(alert.isBrief ? (alert.title ?? 'A new brief is out') : 'Breaking: ${alert.title ?? 'new story'}', maxLines: 2, overflow: TextOverflow.ellipsis),
      duration: const Duration(seconds: 8),
      action: SnackBarAction(label: alert.isBrief ? 'Open' : 'Read', onPressed: () => _openAlert(alert)),
    ));
  }

  // Returning to the app re-fetches /me so role or preference changes made
  // on the web show up without a manual refresh.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && widget.auth.status == AuthStatus.authed) {
      widget.auth.refresh();
    }
  }

  static String _decode(String s) {
    try {
      return Uri.decodeComponent(s);
    } catch (_) {
      return s;
    }
  }

  late final GoRouter _router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: widget.auth,
    // Reading is public: only the forced password change and staff-only
    // screens redirect. The launch screen leaves on its own once the sequence
    // has finished and the stored session has been restored.
    redirect: (context, state) {
      final loc = state.matchedLocation;
      final auth = widget.auth;
      if (loc == '/splash') return null;
      if (auth.status == AuthStatus.unknown) return '/splash';
      final user = auth.user;
      if (user != null && user.mustChangePassword && loc != '/change-password') return '/change-password';
      if (loc == '/change-password' && user == null) return '/login';
      if (loc.startsWith('/newsroom') && !(user?.capabilities.curate ?? false)) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: '/change-password', builder: (context, state) => const ChangePasswordScreen()),
      GoRoute(
        path: '/story/:ref',
        builder: (context, state) => StoryScreen(
          ref: _decode(state.pathParameters['ref']!),
          preview: state.extra is NewsItem ? state.extra as NewsItem : null,
        ),
      ),
      GoRoute(
        path: '/topic/:name',
        builder: (context, state) {
          final raw = _decode(state.pathParameters['name']!);
          // Accept either the desk name or its slug (deep links from the web).
          final name = categoryFromSlug(raw)?.name ?? raw;
          return FeedScreen(category: name);
        },
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) => FeedScreen(
          search: state.uri.queryParameters['q'],
          tag: state.uri.queryParameters['tag'],
        ),
      ),
      GoRoute(
        path: '/intelligence/:date/:type',
        builder: (context, state) => IntelligenceScreen(
          date: state.pathParameters['date'],
          type: state.pathParameters['type'],
          standalone: true,
        ),
      ),
      GoRoute(
        path: '/intelligence/:date',
        builder: (context, state) => IntelligenceScreen(date: state.pathParameters['date'], standalone: true),
      ),
      GoRoute(path: '/saved', builder: (context, state) => Scaffold(appBar: AppBar(title: const Text('Saved')), body: const SavedScreen())),
      GoRoute(path: '/newsroom', builder: (context, state) => const NewsroomScreen()),
      ShellRoute(
        builder: (context, state, child) => _HomeShell(location: state.matchedLocation, child: child),
        routes: [
          GoRoute(path: '/', pageBuilder: (context, state) => _tab(state, const SignalScreen())),
          GoRoute(path: '/radar', pageBuilder: (context, state) => _tab(state, const RadarScreen())),
          GoRoute(path: '/intelligence', pageBuilder: (context, state) => _tab(state, const IntelligenceScreen())),
          GoRoute(path: '/watchlist', pageBuilder: (context, state) => _tab(state, const WatchlistScreen())),
          GoRoute(path: '/account', pageBuilder: (context, state) => _tab(state, const AccountScreen())),
        ],
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    final mode = context.watch<ThemeController>().mode;
    return MaterialApp.router(
      title: Brand.name,
      theme: buildAppTheme(Brightness.light),
      darkTheme: buildAppTheme(Brightness.dark),
      themeMode: mode,
      routerConfig: _router,
      scaffoldMessengerKey: _messenger,
      debugShowCheckedModeBanner: false,
    );
  }
}

Page<void> _tab(GoRouterState state, Widget child) => NoTransitionPage<void>(key: state.pageKey, child: child);

class _HomeShell extends StatelessWidget {
  const _HomeShell({required this.location, required this.child});

  final String location;
  final Widget child;

  static const _tabs = [
    (path: '/', icon: Icons.graphic_eq, active: Icons.graphic_eq, label: 'Signal'),
    (path: '/radar', icon: Icons.radar, active: Icons.radar, label: 'Radar'),
    (path: '/intelligence', icon: Icons.auto_awesome_outlined, active: Icons.auto_awesome, label: 'Intelligence'),
    (path: '/watchlist', icon: Icons.schedule_outlined, active: Icons.schedule, label: 'Watchlist'),
    (path: '/account', icon: Icons.person_outline, active: Icons.person, label: 'Account'),
  ];

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthState>().user;
    final theme = context.watch<ThemeController>();
    var index = _tabs.indexWhere((t) => t.path != '/' && location.startsWith(t.path));
    if (index < 0) index = 0;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: InkWell(onTap: () => context.go('/'), child: const Wordmark(size: 12.5)),
        actions: [
          if (user?.capabilities.curate ?? false)
            IconButton(tooltip: 'Newsroom', icon: const Icon(Icons.tune), onPressed: () => context.push('/newsroom')),
          IconButton(
            tooltip: theme.isDark ? 'Switch to light' : 'Switch to dark',
            icon: Icon(theme.isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
            onPressed: theme.toggle,
          ),
          IconButton(tooltip: 'Search', icon: const Icon(Icons.search), onPressed: () => context.push('/search')),
        ],
      ),
      body: Column(children: [
        const RadarStrip(),
        Expanded(child: child),
      ]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => context.go(_tabs[i].path),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: [
          for (final t in _tabs)
            NavigationDestination(icon: Icon(t.icon), selectedIcon: Icon(t.active), label: t.label),
        ],
      ),
    );
  }
}
