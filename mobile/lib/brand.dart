import 'package:flutter/material.dart';

/// One place to rename or re-theme the outlet in the app. Mirrors
/// client/src/brand.js.
abstract class Brand {
  static const name = 'Global SI News';
  static const short = 'GSI';
  static const tagline = 'Real intelligence. A clearer tomorrow.';
  static const description =
      'A graded feed of artificial intelligence and the path to superintelligence, swept from primary sources every 30 minutes.';

  /// Sources the radar sweeps. The live strip replaces this with the API's
  /// `source_count` once it has loaded.
  static const sourceCount = 34;

  /// The two scheduled editions, Pacific time.
  static const morningHourPT = 6;
  static const morningMinutePT = 50;
  static const eveningHourPT = 17;
  static const eveningMinutePT = 25;
}

/// A desk: one of the ten Global SI domains the radar grades into.
class Category {
  const Category(this.name, this.short, this.slug, this.hue);
  final String name;
  final String short;
  final String slug;
  final Color hue;
}

const categories = <Category>[
  Category('Frontier Models & AGI', 'Frontier', 'frontier-models-agi', Color(0xFF2E7DFF)),
  Category('Defense & National Security', 'Defense', 'defense-national-security', Color(0xFF8FA3C2)),
  Category('Cybersecurity', 'Cyber', 'cybersecurity', Color(0xFF5B9BFF)),
  Category('Medical & Life Sciences', 'Medical', 'medical-life-sciences', Color(0xFF7FC4A4)),
  Category('Policy & Regulation', 'Policy', 'policy-regulation', Color(0xFFC7D2E3)),
  Category('Private Sector & Enterprise', 'Private sector', 'private-sector-enterprise', Color(0xFF9FB6FF)),
  Category('Compute & Chips', 'Compute', 'compute-chips', Color(0xFF6B8FD6)),
  Category('Robotics & Autonomy', 'Robotics', 'robotics-autonomy', Color(0xFFB9C7E0)),
  Category('AI Safety & Alignment', 'Safety', 'ai-safety-alignment', Color(0xFFD4AF37)),
  Category('Open Source & Developer Tools', 'Open source', 'open-source-developer-tools', Color(0xFF86B7FF)),
];

const _neutral = Color(0xFF8A90A8);

/// Unknown categories (n8n may send any string) get a neutral dot.
Category categoryMeta(String? name) {
  for (final c in categories) {
    if (c.name == name) return c;
  }
  final n = (name == null || name.isEmpty) ? 'Other' : name;
  final slug = n.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-').replaceAll(RegExp(r'^-|-$'), '');
  return Category(n, n, slug, _neutral);
}

Category? categoryFromSlug(String slug) {
  for (final c in categories) {
    if (c.slug == slug) return c;
  }
  return null;
}

String domainShort(String? name) => categoryMeta(name).short;

/// The grading rubric the radar enforces in code.
const tierName = <int, String>{1: 'Breaking', 2: 'Signal', 3: 'Briefing', 4: 'Logged'};

const tierMeaning = <int, String>{
  1: 'The acting party itself published this within the last 24 hours. A lab shipped it, a government ruled, a court filed.',
  2: 'Announced but not shipped, a major paper, a proposal, big money, or a significant advisory.',
  3: 'Coverage of a tier 1 or 2 action, enterprise deployments, product updates.',
  4: 'Opinion, repeat coverage, or older than seven days.',
};

/// Research desks: the desks grouped the way the Research section shows them.
const researchDesks = <String>[
  'Frontier Models & AGI',
  'AI Safety & Alignment',
  'Compute & Chips',
  'Open Source & Developer Tools',
];
