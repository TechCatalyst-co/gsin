import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_state.dart';
import '../brand.dart';
import '../config.dart';
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

    final footer = [
      const SizedBox(height: 24),
      ListTile(title: const Text('Privacy'), trailing: const Icon(Icons.open_in_new, size: 18), onTap: () => openExternal('$webBaseUrl/privacy')),
      ListTile(title: const Text('Terms'), trailing: const Icon(Icons.open_in_new, size: 18), onTap: () => openExternal('$webBaseUrl/terms')),
      Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          '${Brand.short} is free and supported by advertising. Stories are gathered from public sources, summarized by an automated newsroom, and curated by editors.',
          style: TextStyle(color: p.slate, fontSize: 13),
        ),
      ),
    ];

    if (user == null) {
      return ListView(children: [
        EmptyState(
          title: 'Everything is free to read',
          body: 'Create a free account to join discussions, save stories, follow topics, and get the Daily Brief by email.',
          action: Wrap(spacing: 10, runSpacing: 8, children: [
            FilledButton(onPressed: () => context.push('/register'), child: const Text('Create free account')),
            OutlinedButton(onPressed: () => context.push('/login'), child: const Text('Sign in')),
          ]),
        ),
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
            title: const Text('Daily Brief email'),
            subtitle: const Text('Send me the brief each morning'),
            value: user.briefEmails,
            onChanged: (v) => _setBriefEmails(context, v),
          ),
          const SectionLabel('Topics you follow'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(spacing: 8, runSpacing: 8, children: [
              for (final c in categories)
                FilterChip(
                  avatar: Container(width: 10, height: 10, decoration: BoxDecoration(color: c.hue, shape: BoxShape.circle)),
                  label: Text(c.name),
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
