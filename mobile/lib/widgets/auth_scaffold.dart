import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'common.dart';

/// Shared card layout for the login/register screens, styled after the web
/// .auth-card.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.form,
    required this.switchText,
    required this.switchLinkText,
    required this.onSwitch,
    this.error,
  });

  final String title;
  final String subtitle;
  final Widget form;
  final String switchText;
  final String switchLinkText;
  final VoidCallback onSwitch;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Scaffold(
      appBar: AppBar(
        leading: Navigator.of(context).canPop() ? const BackButton() : null,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: p.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: p.line),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Wordmark(size: 18),
                      const SizedBox(height: 20),
                      Text(title, style: display(size: 26, weight: FontWeight.w800, color: p.ink)),
                      const SizedBox(height: 4),
                      Text(subtitle, style: reading(size: 16, color: p.ink2)),
                      const SizedBox(height: 16),
                      if (error != null) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: p.flareSoft,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(error!,
                              style: TextStyle(color: p.flare, fontSize: 14)),
                        ),
                        const SizedBox(height: 14),
                      ],
                      form,
                      const SizedBox(height: 16),
                      if (switchText.isNotEmpty) Wrap(
                        alignment: WrapAlignment.center,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(switchText,
                              style: TextStyle(color: p.slate, fontSize: 14)),
                          GestureDetector(
                            onTap: onSwitch,
                            child: Text(
                              switchLinkText,
                              style: TextStyle(
                                color: p.signal,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
