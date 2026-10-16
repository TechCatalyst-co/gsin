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

const _statusLabel = {
  'active': 'Active',
  'trialing': 'Trial',
  'past_due': 'Payment past due',
  'canceled': 'Canceled',
  'unpaid': 'Unpaid',
  'inactive': 'Free account',
};

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
        child: Text('Stories are gathered from public sources and summarized by an automated newsroom, then curated by editors.',
            style: TextStyle(color: p.slate, fontSize: 13)),
      ),
    ];

    if (user == null) {
      return ListView(children: [
        EmptyState(
          title: 'Read free. Sign in for more.',
          body: 'A free account lets you save stories and follow topics. Premium adds the Daily Brief, analysis and posting.',
          action: Wrap(spacing: 10, runSpacing: 8, children: [
            FilledButton(onPressed: () => context.push('/register'), child: const Text('Create account')),
            OutlinedButton(onPressed: () => context.push('/login'), child: const Text('Sign in')),
          ]),
        ),
        ...footer,
      ]);
    }

    final membership = user.isStaff
        ? 'Staff (${user.role})'
        : user.isPremium
            ? 'Premium (${_statusLabel[user.subscriptionStatus] ?? user.subscriptionStatus})'
            : (_statusLabel[user.subscriptionStatus] ?? 'Free account');

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
          ListTile(title: const Text('Membership'), trailing: Text(membership, style: TextStyle(color: p.ink2))),
          if (user.currentPeriodEnd != null && user.hasAccess)
            ListTile(
              title: const Text('Renews'),
              trailing: Text(MaterialLocalizations.of(context).formatMediumDate(user.currentPeriodEnd!), style: TextStyle(color: p.ink2)),
            ),
          if (!user.isPremium && showUpgradeLinks)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: PremiumPitch(
                title: 'Premium',
                body: 'The Daily Brief, extended analysis, and posting in discussions for ${Brand.premiumPrice}/month.',
                upgradeUrl: user.upgradeUrl,
              ),
            ),
          if (user.hasAccess && showUpgradeLinks)
            ListTile(
              title: const Text('Manage billing'),
              subtitle: const Text('Opens your account on the web'),
              trailing: const Icon(Icons.open_in_new, size: 18),
              onTap: () => openExternal('$webBaseUrl/account'),
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
