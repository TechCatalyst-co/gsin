import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_state.dart';
import '../brand.dart';
import '../config.dart';
import '../push/push_service.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  Future<void> _toggleTopic(BuildContext context, String name) async {
    final auth = context.read<AuthState>();
    final current = auth.user?.followedCategories ?? const <String>[];
    final next = current.contains(name) ? current.where((c) => c != name).toList() : [...current, name];
    auth.setFollowedCategories(next);
    try {
      await context.read<ApiClient>().put('/me/categories', {'categories': next});
    } on ApiException catch (e) {
      auth.setFollowedCategories(current);
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _setBriefEmails(BuildContext context, bool value) async {
    final auth = context.read<AuthState>();
    final previous = auth.user?.briefEmails ?? true;
    auth.setBriefEmails(value);
    try {
      await context.read<ApiClient>().put('/me/preferences', {'briefEmails': value});
    } on ApiException catch (e) {
      auth.setBriefEmails(previous);
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final auth = context.watch<AuthState>();
    final user = auth.user;

    final push = context.watch<PushService>();
    final theme = context.watch<ThemeController>();
    final alerts = [
      const SectionLabel('Alerts and appearance'),
      if (push.available) ...[
        SwitchListTile(
          title: const Text('Breaking news alerts'),
          subtitle: Text(push.blocked
              ? 'Notifications are off for ${Brand.name} in your phone settings'
              : 'One notification when a Tier 1 story breaks, never more than three in a burst'),
          value: push.enabled,
          onChanged: (v) => push.setEnabled(v),
        ),
        SwitchListTile(
          title: const Text('Brief alerts'),
          subtitle: const Text('Morning Briefing at 6:50 AM PT and the Evening Daily Brief at 5:25 PM PT'),
          value: push.briefEnabled,
          onChanged: (v) => push.setBriefEnabled(v),
        ),
      ] else
        ListTile(
          title: const Text('Push alerts'),
          subtitle: const Text('Not configured on this build. Breaking stories and both briefs still appear in the app.'),
          leading: Icon(Icons.notifications_off_outlined, color: p.slate),
        ),
      SwitchListTile(
        title: const Text('Dark control room'),
        subtitle: Text(theme.isDark ? 'Midnight Navy, the default' : 'Pearl White'),
        value: theme.isDark,
        onChanged: (v) => theme.setMode(v ? ThemeMode.dark : ThemeMode.light),
      ),
      ListTile(
        title: const Text('Saved stories'),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push('/saved'),
      ),
    ];

    final footer = [
      const SizedBox(height: 24),
      ListTile(title: const Text('Privacy'), trailing: const Icon(Icons.open_in_new, size: 18), onTap: () => openExternal('$webBaseUrl/privacy')),
      ListTile(title: const Text('Terms'), trailing: const Icon(Icons.open_in_new, size: 18), onTap: () => openExternal('$webBaseUrl/terms')),
      ListTile(title: const Text('How stories are graded'), trailing: const Icon(Icons.open_in_new, size: 18), onTap: () => openExternal('$webBaseUrl/about')),
      Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          '${Brand.name} is free to read. The radar sweeps ${Brand.sourceCount} primary sources every 30 minutes and grades every story against a strict rubric; analysis and forecasts are labelled as such. $appVersionLabel.',
          style: reading(size: 12.5, color: p.slate, height: 1.4),
        ),
      ),
    ];

    if (user == null) {
      return ListView(children: [
        EmptyState(
          title: 'Everything is free to read',
          body: 'Create a free account to join discussions, save stories, follow desks, and get the Morning Briefing by email.',
          action: Wrap(spacing: 10, runSpacing: 8, children: [
            FilledButton(onPressed: () => context.push('/register'), child: const Text('Create free account')),
            OutlinedButton(onPressed: () => context.push('/login'), child: const Text('Sign in')),
          ]),
        ),
        ...alerts,
        ...footer,
      ]);
    }

    return RefreshIndicator(
      color: p.signal,
      onRefresh: auth.refresh,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
            child: Text(user.name?.isNotEmpty == true ? user.name! : 'Account', style: display(size: 30, weight: FontWeight.w800, color: p.ink)),
          ),
          ListTile(title: const Text('Email'), trailing: Text(user.email, style: TextStyle(color: p.ink2))),
          if (user.isStaff)
            ListTile(title: const Text('Role'), trailing: Text(user.role == 'admin' ? 'Admin' : 'Editor', style: TextStyle(color: p.ink2))),
          SwitchListTile(
            title: const Text('Morning Briefing by email'),
            subtitle: const Text('The consolidated brief in your inbox each morning'),
            value: user.briefEmails,
            onChanged: (v) => _setBriefEmails(context, v),
          ),
          ...alerts,
          const SectionLabel('Desks you follow'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(spacing: 8, runSpacing: 8, children: [
              for (final c in categories)
                FilterChip(
                  avatar: Container(width: 10, height: 10, decoration: BoxDecoration(color: c.hue, shape: BoxShape.circle)),
                  label: Text(c.short),
                  showCheckmark: false,
                  selected: user.followedCategories.contains(c.name),
                  onSelected: (_) => _toggleTopic(context, c.name),
                ),
            ]),
          ),
          const SizedBox(height: 16),
          ListTile(title: const Text('Change password'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/change-password')),
          ListTile(
            title: const Text('Request account deletion'),
            trailing: const Icon(Icons.open_in_new, size: 18),
            onTap: () => openExternal('$webBaseUrl/delete-account'),
          ),
          ListTile(
            title: Text('Sign out', style: TextStyle(color: p.flare)),
            onTap: () => context.read<AuthState>().logout(),
          ),
          ...footer,
        ],
      ),
    );
  }
}
