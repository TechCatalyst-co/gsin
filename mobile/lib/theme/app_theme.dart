
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Design tokens from the Global SI News brand style guide, mirroring
/// client/src/styles.css. Dark (Midnight Navy) is the default; the light
/// palette is the Pearl White variant. Flat color only, no gradients.
class AppPalette extends ThemeExtension<AppPalette> {
  const AppPalette({
    required this.paper,
    required this.paperDeep,
    required this.surface,
    required this.ink,
    required this.ink2,
    required this.slate,
    required this.faint,
    required this.line,
    required this.lineStrong,
    required this.signal,
    required this.signalInk,
    required this.signalSoft,
    required this.link,
    required this.gold,
    required this.flare,
    required this.flareSoft,
    required this.isDark,
  });

  /// Page background (Midnight Navy / Pearl White).
  final Color paper;

  /// A step deeper than the page, for the launch screen and the radar strip.
  final Color paperDeep;

  /// Cards and panels.
  final Color surface;

  /// Primary text.
  final Color ink;

  /// Secondary text.
  final Color ink2;

  /// Muted labels.
  final Color slate;

  /// Faintest text (timestamps, readout).
  final Color faint;
  final Color line;
  final Color lineStrong;

  /// Royal Blue: the one action color. Links, buttons, Tier 1, the sweep.
  final Color signal;
  final Color signalInk;
  final Color signalSoft;

  /// Link blue on the current background.
  final Color link;

  /// Signature Gold: the wordmark and insight labels only.
  final Color gold;

  /// Errors only.
  final Color flare;
  final Color flareSoft;
  final bool isDark;

  static const dark = AppPalette(
    paper: Color(0xFF0B1F3B),
    paperDeep: Color(0xFF071630),
    surface: Color(0xFF10294E),
    ink: Color(0xFFF8FAFC),
    ink2: Color(0xFFC7D2E3),
    slate: Color(0xFF8FA3C2),
    faint: Color(0xFF5F7496),
    line: Color(0xFF22385C),
    lineStrong: Color(0xFF35507A),
    signal: Color(0xFF2E7DFF),
    signalInk: Color(0xFFFFFFFF),
    signalSoft: Color(0xFF16335F),
    link: Color(0xFF5B9BFF),
    gold: Color(0xFFD4AF37),
    flare: Color(0xFFE5484D),
    flareSoft: Color(0xFF3A1F26),
    isDark: true,
  );

  static const light = AppPalette(
    paper: Color(0xFFF8FAFC),
    paperDeep: Color(0xFFEEF2F7),
    surface: Color(0xFFFFFFFF),
    ink: Color(0xFF0B1F3B),
    ink2: Color(0xFF2A3F5F),
    slate: Color(0xFF5F7496),
    faint: Color(0xFF8FA3C2),
    line: Color(0xFFE5E7EB),
    lineStrong: Color(0xFFC7D2E3),
    signal: Color(0xFF2E7DFF),
    signalInk: Color(0xFFFFFFFF),
    signalSoft: Color(0xFFE3EDFF),
    link: Color(0xFF1F63D6),
    gold: Color(0xFFB8962E),
    flare: Color(0xFFD1343A),
    flareSoft: Color(0xFFFBE4E5),
    isDark: false,
  );

  /// Tier colors: T1 Royal Blue, T2 a lighter blue, T3/T4 quiet.
  Color tierColor(int tier) => switch (tier) {
        1 => signal,
        2 => link,
        3 => slate,
        _ => faint,
      };

  @override
  AppPalette copyWith() => this;

  @override
  AppPalette lerp(ThemeExtension<AppPalette>? other, double t) =>
      (other is AppPalette && t > 0.5) ? other : this;
}

extension PaletteX on BuildContext {
  AppPalette get palette =>
      Theme.of(this).extension<AppPalette>() ?? AppPalette.dark;
}

/// Headline/UI face (Montserrat) and reading face (Inter), per the style guide.
TextStyle display({double? size, FontWeight weight = FontWeight.w700, Color? color, double? height, double? letterSpacing}) =>
    GoogleFonts.montserrat(fontSize: size, fontWeight: weight, color: color, height: height, letterSpacing: letterSpacing);

TextStyle reading({double? size, Color? color, double? height, FontWeight weight = FontWeight.w400}) =>
    GoogleFonts.inter(fontSize: size, color: color, height: height ?? 1.5, fontWeight: weight);

/// Readout / instrument figures: Inter with tabular numerals so values don't jitter.
TextStyle figures({double? size, Color? color, FontWeight weight = FontWeight.w500, double? height}) =>
    GoogleFonts.inter(
      fontSize: size,
      color: color,
      fontWeight: weight,
      height: height ?? 1.2,
      fontFeatures: const [FontFeature.tabularFigures()],
    );

/// The reader's theme choice, persisted per device. Dark is the default.
class ThemeController extends ChangeNotifier {
  static const _key = 'gsi-theme';
  ThemeMode _mode = ThemeMode.dark;

  ThemeMode get mode => _mode;
  bool get isDark => _mode != ThemeMode.light;

  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final v = prefs.getString(_key);
      _mode = switch (v) {
        'light' => ThemeMode.light,
        'system' => ThemeMode.system,
        _ => ThemeMode.dark,
      };
    } catch (_) {
      /* keep the default */
    }
    notifyListeners();
  }

  Future<void> setMode(ThemeMode mode) async {
    _mode = mode;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, switch (mode) {
        ThemeMode.light => 'light',
        ThemeMode.system => 'system',
        ThemeMode.dark => 'dark',
      });
    } catch (_) {
      /* best effort */
    }
  }

  Future<void> toggle() => setMode(isDark ? ThemeMode.light : ThemeMode.dark);
}

ThemeData buildAppTheme(Brightness brightness) {
  final p = brightness == Brightness.dark ? AppPalette.dark : AppPalette.light;
  final base = ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: ColorScheme.fromSeed(
      seedColor: p.signal,
      brightness: brightness,
      primary: p.signal,
      onPrimary: p.signalInk,
      secondary: p.gold,
      error: p.flare,
      surface: p.paper,
      onSurface: p.ink,
    ),
    scaffoldBackgroundColor: p.paper,
    extensions: [p],
  );

  final ui = GoogleFonts.interTextTheme(base.textTheme).apply(bodyColor: p.ink, displayColor: p.ink);

  final chipShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(4));
  final btnShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(8));

  return base.copyWith(
    textTheme: ui,
    dividerColor: p.line,
    splashFactory: InkSparkle.splashFactory,
    appBarTheme: AppBarTheme(
      backgroundColor: p.paper,
      foregroundColor: p.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      shape: Border(bottom: BorderSide(color: p.line)),
      titleTextStyle: display(size: 17, color: p.ink),
      iconTheme: IconThemeData(color: p.ink2, size: 22),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: p.signal,
        foregroundColor: p.signalInk,
        textStyle: display(size: 14, weight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
        shape: btnShape,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: p.ink,
        side: BorderSide(color: p.lineStrong),
        textStyle: display(size: 14, weight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: btnShape,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: p.link,
        textStyle: display(size: 14, weight: FontWeight.w600),
        shape: btnShape,
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: p.surface,
      selectedColor: p.signal,
      side: BorderSide(color: p.line),
      shape: chipShape,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      labelStyle: display(size: 12.5, weight: FontWeight.w600, color: p.ink2),
      secondaryLabelStyle: display(size: 12.5, weight: FontWeight.w600, color: p.signalInk),
      checkmarkColor: p.signalInk,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.surface,
      hintStyle: reading(size: 14.5, color: p.slate),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: p.lineStrong),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: p.lineStrong),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: p.signal, width: 1.6),
      ),
      labelStyle: TextStyle(color: p.ink2, fontSize: 14),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: p.paperDeep,
      indicatorColor: p.signalSoft,
      surfaceTintColor: Colors.transparent,
      height: 64,
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(color: states.contains(WidgetState.selected) ? p.signal : p.slate, size: 22),
      ),
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => display(size: 11, weight: FontWeight.w600, color: states.contains(WidgetState.selected) ? p.ink : p.slate),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: p.surface,
      contentTextStyle: reading(size: 14, color: p.ink),
      actionTextColor: p.link,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide(color: p.lineStrong)),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: p.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      titleTextStyle: display(size: 18, color: p.ink),
      contentTextStyle: reading(size: 15, color: p.ink2),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: p.surface,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(14))),
      showDragHandle: true,
      dragHandleColor: p.lineStrong,
    ),
    listTileTheme: ListTileThemeData(
      iconColor: p.slate,
      textColor: p.ink,
      titleTextStyle: reading(size: 15.5, color: p.ink, weight: FontWeight.w500),
      subtitleTextStyle: reading(size: 13, color: p.slate),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.signalInk : p.slate),
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.signal : p.line),
      trackOutlineColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.signal : p.lineStrong),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: p.signal, linearTrackColor: p.line),
    dividerTheme: DividerThemeData(color: p.line, thickness: 1, space: 1),
  );
}
