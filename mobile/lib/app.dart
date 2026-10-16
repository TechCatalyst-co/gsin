import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'auth/auth_state.dart';
import 'brand.dart';
import 'models/news_item.dart';
import 'screens/account_screen.dart';
import 'screens/brief_screen.dart';
import 'screens/change_password_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/newsroom_screen.dart';
import 'screens/register_screen.dart';
import 'screens/saved_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/story_screen.dart';
import 'screens/topics_screen.dart';
import 'theme/app_theme.dart';
import 'widgets/common.dart';

class GsinApp extends StatefulWidget {
  const GsinApp({super.key, required this.auth});

  final AuthState auth;

  @override
  State<GsinApp> createState() => _GsinAppState();
}

class _GsinAppState extends State<GsinApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Returning from the browser (web checkout) re-fetches /me so a just-bought
  // Premium membership unlocks without a manual refresh.
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
    // Reading is public: only the splash, the forced password change, and
    // staff-only screens redirect.
    redirect: (context, state) {
      final loc = state.matchedLocation;
      final auth = widget.auth;
      if (auth.status == AuthStatus.unknown) return loc == '/splash' ? null : '/splash';
      if (loc == '/splash') return '/';
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
          ref: state.pathParameters['ref']!,
          preview: state.extra is NewsItem ? state.extra as NewsItem : null,
        ),
      ),
      GoRoute(
        path: '/topic/:name',
        builder: (context, state) => FeedScreen(category: _decode(state.pathParameters['name']!)),
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) => FeedScreen(
          search: state.uri.queryParameters['q'],
          tag: state.uri.queryParameters['tag'],
        ),
      ),
      GoRoute(path: '/newsroom', builder: (context, state) => const NewsroomScreen()),
      ShellRoute(
        builder: (context, state, child) => _HomeShell(location: state.matchedLocation, child: child),
        routes: [
          GoRoute(path: '/', pageBuilder: (context, state) => _tab(state, const HomeScreen())),
          GoRoute(path: '/topics', pageBuilder: (context, state) => _tab(state, const TopicsScreen())),
          GoRoute(path: '/brief', pageBuilder: (context, state) => _tab(state, const BriefScreen())),
          GoRoute(path: '/saved', pageBuilder: (context, state) => _tab(state, const SavedScreen())),
          GoRoute(path: '/account', pageBuilder: (context, state) => _tab(state, const AccountScreen())),
        ],
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: Brand.name,
      theme: buildAppTheme(Brightness.light),
      darkTheme: buildAppTheme(Brightness.dark),
      themeMode: ThemeMode.system,
      routerConfig: _router,
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
    (path: '/', icon: Icons.bolt_outlined, active: Icons.bolt, label: 'Top'),
    (path: '/topics', icon: Icons.grid_view_outlined, active: Icons.grid_view, label: 'Topics'),
    (path: '/brief', icon: Icons.wb_sunny_outlined, active: Icons.wb_sunny, label: 'Brief'),
    (path: '/saved', icon: Icons.bookmark_border, active: Icons.bookmark, label: 'For you'),
    (path: '/account', icon: Icons.person_outline, active: Icons.person, label: 'Account'),
  ];

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthState>().user;
    var index = _tabs.indexWhere((t) => t.path != '/' && location.startsWith(t.path));
    if (index < 0) index = 0;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: InkWell(onTap: () => context.go('/'), child: const Wordmark(size: 19)),
        actions: [
          if (user?.capabilities.curate ?? false)
            IconButton(tooltip: 'Newsroom', icon: const Icon(Icons.tune), onPressed: () => context.push('/newsroom')),
          IconButton(tooltip: 'Search', icon: const Icon(Icons.search), onPressed: () => context.go('/topics')),
        ],
      ),
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => context.go(_tabs[i].path),
        destinations: [
          for (final t in _tabs)
            NavigationDestination(icon: Icon(t.icon), selectedIcon: Icon(t.active), label: t.label),
        ],
      ),
    );
  }
}
