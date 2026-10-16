import 'package:flutter/material.dart';

/// One place to rename or re-theme the outlet in the app. Mirrors
/// client/src/brand.js.
abstract class Brand {
  static const name = 'Global Super Intelligence News';
  static const short = 'GSIN';
  static const tagline =
      'News on artificial intelligence and the road to superintelligence, from around the world.';
  static const premiumPrice = r'$8';
}

class Category {
  const Category(this.name, this.slug, this.hue);
  final String name;
  final String slug;
  final Color hue;
}

const categories = <Category>[
  Category('Frontier Models', 'frontier-models', Color(0xFF3B3BF5)),
  Category('Research', 'research', Color(0xFF0E8F86)),
  Category('Safety & Alignment', 'safety-alignment', Color(0xFFC2410C)),
  Category('Policy & Regulation', 'policy-regulation', Color(0xFF7C3AED)),
  Category('Industry & Funding', 'industry-funding', Color(0xFFB45309)),
  Category('Compute & Hardware', 'compute-hardware', Color(0xFF475569)),
  Category('Open Source', 'open-source', Color(0xFF15803D)),
  Category('Superintelligence', 'superintelligence', Color(0xFFBE185D)),
  Category('Robotics', 'robotics', Color(0xFF0369A1)),
];

const _neutral = Color(0xFF8A90A8);

/// Unknown categories (n8n may send any string) get a neutral dot.
Category categoryMeta(String? name) {
  for (final c in categories) {
    if (c.name == name) return c;
  }
  final n = (name == null || name.isEmpty) ? 'Other' : name;
  return Category(n, n.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-'), _neutral);
}
