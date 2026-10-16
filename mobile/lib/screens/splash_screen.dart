import 'package:flutter/material.dart';

import '../brand.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

/// Shown on /splash while the stored session restores (see app.dart).
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Scaffold(
      backgroundColor: p.surface,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CurveGlyph(size: 72),
                const SizedBox(height: 20),
                Text(Brand.short, style: display(size: 44, weight: FontWeight.w800, color: p.ink, height: 1)),
                const SizedBox(height: 6),
                Text(Brand.name, textAlign: TextAlign.center, style: display(size: 17, weight: FontWeight.w600, color: p.ink2)),
                const SizedBox(height: 8),
                Text(
                  Brand.tagline,
                  textAlign: TextAlign.center,
                  style: reading(size: 16, color: p.slate),
                ),
                const SizedBox(height: 28),
                SizedBox(
                  width: 26,
                  height: 26,
                  child: CircularProgressIndicator(strokeWidth: 2.4, color: p.signal),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
