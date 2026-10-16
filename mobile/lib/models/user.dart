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

  /// Signed-out readers: everything except posting.
  static const anonymous = Capabilities(accessDailyBrief: true, readAnalysis: true);

  factory Capabilities.fromJson(Map<String, dynamic> j) => Capabilities(
        readNews: (j['readNews'] as bool?) ?? true,
        viewThreads: (j['viewThreads'] as bool?) ?? true,
        accessDailyBrief: (j['accessDailyBrief'] as bool?) ?? true,
        readAnalysis: (j['readAnalysis'] as bool?) ?? true,
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
    required this.followedCategories,
    this.briefEmails = true,
    required this.capabilities,
    this.mustChangePassword = false,
  });

  final String id;
  final String? name;
  final String email;
  final String role;
  final List<String> followedCategories;
  final bool briefEmails;
  final Capabilities capabilities;
  final bool mustChangePassword;

  bool get isStaff => role == 'editor' || role == 'admin';

  User copyWith({List<String>? followedCategories, bool? briefEmails}) => User(
        id: id,
        name: name,
        email: email,
        role: role,
        followedCategories: followedCategories ?? this.followedCategories,
        briefEmails: briefEmails ?? this.briefEmails,
        capabilities: capabilities,
        mustChangePassword: mustChangePassword,
      );

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: j['id'] as String,
        name: j['name'] as String?,
        email: j['email'] as String,
        role: (j['role'] as String?) ?? 'member',
        followedCategories: ((j['followedCategories'] as List?) ?? const [])
            .whereType<String>()
            .toList(),
        briefEmails: (j['briefEmails'] as bool?) ?? true,
        capabilities: j['capabilities'] is Map<String, dynamic>
            ? Capabilities.fromJson(j['capabilities'] as Map<String, dynamic>)
            : Capabilities.anonymous,
        mustChangePassword: (j['mustChangePassword'] as bool?) ?? false,
      );
}
