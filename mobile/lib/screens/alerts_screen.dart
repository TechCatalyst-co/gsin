import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../push/push_service.dart';
import '../state/alerts_state.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

/// The bell's list: every push alert that went out, newest first, so one that
/// was missed or swiped away can still be opened. Opening it marks all seen.
class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  @override
  void initState() {
    super.initState();
    final alerts = context.read<AlertsState>();
    alerts.markSeen();
    alerts.refresh().then((_) => alerts.markSeen());
  }

  @override
  Widget build(BuildContext context) {
    final alerts = context.watch<AlertsState>();
    final p = context.palette;
    final items = alerts.items;

    Widget body;
    if (items.isEmpty && alerts.loading) {
      body = const RadarLoading();
    } else if (items.isEmpty && alerts.failed) {
      body = ListView(children: [ErrorBlock(text: 'Couldn’t load alerts.', onRetry: alerts.refresh)]);
    } else if (items.isEmpty) {
      body = ListView(children: [
        EmptyState(
          title: 'No alerts yet',
          body: 'Breaking stories and new briefs show up here when an alert goes out.',
          action: OutlinedButton(onPressed: () => context.go('/account'), child: const Text('Alert settings')),
        ),
      ]);
    } else {
      body = ListView.separated(
        padding: const EdgeInsets.only(bottom: 24),
        itemCount: items.length + 1,
        separatorBuilder: (_, _) => Divider(height: 1, color: p.line),
        itemBuilder: (context, i) {
          if (i == items.length) {
            return ListTile(
              title: Text('Alert settings', style: reading(size: 14, color: p.link, weight: FontWeight.w600)),
              trailing: Icon(Icons.chevron_right, color: p.slate),
              onTap: () => context.go('/account'),
            );
          }
          return _AlertRow(alert: items[i]);
        },
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Alerts')),
      body: RefreshIndicator(onRefresh: alerts.refresh, child: body),
    );
  }
}

class _AlertRow extends StatelessWidget {
  const _AlertRow({required this.alert});
  final PushAlert alert;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return InkWell(
      onTap: () => context.push(alert.route),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: alert.isBrief ? const GsiChip('BRIEF', tier: 2) : const GsiChip('BREAKING', tier: 1),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(alert.title ?? (alert.isBrief ? 'A new brief is out' : 'Breaking story'),
                  style: display(size: 15, weight: FontWeight.w600, color: p.ink, height: 1.3)),
              if ((alert.body ?? '').isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(alert.body!, maxLines: 2, overflow: TextOverflow.ellipsis, style: reading(size: 13.5, color: p.ink2, height: 1.35)),
              ],
              const SizedBox(height: 6),
              Text(timeAgo(alert.at), style: reading(size: 12, color: p.slate)),
            ]),
          ),
        ]),
      ),
    );
  }
}
