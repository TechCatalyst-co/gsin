/// Resolved server-side (server/utils/capabilities.js) and sent with /auth/me.
class Capabilities {
  const Capabilities({
    this.readNews = true,
    this.viewThreads = true,
    this.accessDailyBrief = false,
    this.readAnalysis = false,
    this.participateInThreads = false,
    this.curate = false,
    this.manageMembers = false,
  });

  final bool readNews;
  final bool viewThreads;
  final bool accessDailyBrief;
  final bool readAnalysis;
  final bool participateInThreads;
  final bool curate;
  final bool manageMembers;

  /// Signed-out readers.
  static const anonymous = Capabilities();

  factory Capabilities.fromJson(Map<String, dynamic> j) => Capabilities(
        readNews: (j['readNews'] as bool?) ?? true,
        viewThreads: (j['viewThreads'] as bool?) ?? true,
        accessDailyBrief: (j['accessDailyBrief'] as bool?) ?? false,
        readAnalysis: (j['readAnalysis'] as bool?) ?? false,
        participateInThreads: (j['participateInThreads'] as bool?) ?? false,
        curate: (j['curate'] as bool?) ?? false,
        manageMembers: (j['manageMembers'] as bool?) ?? false,
      );
}

/// Mirrors User.toPublic() in server/models/User.js.
class User {
  const User({
    required this.id,
    this.name,
    required this.email,
    required this.role,
    required this.subscriptionStatus,
    this.currentPeriodEnd,
    required this.hasAccess,
    required this.isPremium,
    required this.followedCategories,
    required this.capabilities,
    this.upgradeUrl,
    this.mustChangePassword = false,
  });

  final String id;
  final String? name;
  final String email;
  final String role;
  final String subscriptionStatus;
  final DateTime? currentPeriodEnd;
  final bool hasAccess;
  final bool isPremium;
  final List<String> followedCategories;
  final Capabilities capabilities;
  final String? upgradeUrl;
  final bool mustChangePassword;

  bool get isStaff => role == 'editor' || role == 'admin';

  User copyWith({List<String>? followedCategories}) => User(
        id: id,
        name: name,
        email: email,
        role: role,
        subscriptionStatus: subscriptionStatus,
        currentPeriodEnd: currentPeriodEnd,
        hasAccess: hasAccess,
        isPremium: isPremium,
        followedCategories: followedCategories ?? this.followedCategories,
        capabilities: capabilities,
        upgradeUrl: upgradeUrl,
        mustChangePassword: mustChangePassword,
      );

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: j['id'] as String,
        name: j['name'] as String?,
        email: j['email'] as String,
        role: (j['role'] as String?) ?? 'member',
        subscriptionStatus: (j['subscriptionStatus'] as String?) ?? 'inactive',
        currentPeriodEnd: j['currentPeriodEnd'] != null
            ? DateTime.tryParse(j['currentPeriodEnd'] as String)
            : null,
        hasAccess: (j['hasAccess'] as bool?) ?? false,
        isPremium: (j['isPremium'] as bool?) ?? false,
        followedCategories: ((j['followedCategories'] as List?) ?? const [])
            .whereType<String>()
            .toList(),
        capabilities: j['capabilities'] is Map<String, dynamic>
            ? Capabilities.fromJson(j['capabilities'] as Map<String, dynamic>)
            : Capabilities.anonymous,
        upgradeUrl: j['upgradeUrl'] as String?,
        mustChangePassword: (j['mustChangePassword'] as bool?) ?? false,
      );
}
