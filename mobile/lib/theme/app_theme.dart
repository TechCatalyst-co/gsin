import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design tokens mirroring client/src/styles.css. Light values; the dark
/// palette lives in [AppPalette.dark] and is picked via Theme brightness.
class AppPalette extends ThemeExtension<AppPalette> {
  const AppPalette({
    required this.paper,
    required this.surface,
    required this.ink,
    required this.ink2,
    required this.slate,
    required this.line,
    required this.lineStrong,
    required this.signal,
    required this.signalInk,
    required this.signalSoft,
    required this.flare,
    required this.flareSoft,
  });

  final Color paper;
  final Color surface;
  final Color ink;
  final Color ink2;
  final Color slate;
  final Color line;
  final Color lineStrong;
  final Color signal;
  final Color signalInk;
  final Color signalSoft;
  final Color flare;
  final Color flareSoft;

  static const light = AppPalette(
    paper: Color(0xFFF1F3F7),
    surface: Color(0xFFFFFFFF),
    ink: Color(0xFF10153A),
    ink2: Color(0xFF3A4064),
    slate: Color(0xFF5D6482),
    line: Color(0xFFD9DCE7),
    lineStrong: Color(0xFFB9BED0),
    signal: Color(0xFF3B3BF5),
    signalInk: Color(0xFFFFFFFF),
    signalSoft: Color(0xFFE4E4FF),
    flare: Color(0xFFE5391B),
    flareSoft: Color(0xFFFDE8E3),
  );

  static const dark = AppPalette(
    paper: Color(0xFF0D1030),
    surface: Color(0xFF151A42),
    ink: Color(0xFFE8EAF7),
    ink2: Color(0xFFC3C7E2),
    slate: Color(0xFF9298BB),
    line: Color(0xFF262C5A),
    lineStrong: Color(0xFF3A4178),
    signal: Color(0xFF8F8FFF),
    signalInk: Color(0xFF0D1030),
    signalSoft: Color(0xFF23286A),
    flare: Color(0xFFFF6A4D),
    flareSoft: Color(0xFF3A1A24),
  );

  @override
  AppPalette copyWith() => this;

  @override
  AppPalette lerp(ThemeExtension<AppPalette>? other, double t) =>
      (other is AppPalette && t > 0.5) ? other : this;
}

extension PaletteX on BuildContext {
  AppPalette get palette =>
      Theme.of(this).extension<AppPalette>() ?? AppPalette.light;
}

/// Headline/UI face (Bricolage Grotesque) and reading face (Newsreader).
TextStyle display({double? size, FontWeight weight = FontWeight.w700, Color? color, double? height}) =>
    GoogleFonts.getFont('Bricolage Grotesque',
        fontSize: size, fontWeight: weight, color: color, height: height);

TextStyle reading({double? size, Color? color, double? height, FontWeight weight = FontWeight.w400}) =>
    GoogleFonts.getFont('Newsreader',
        fontSize: size, color: color, height: height ?? 1.5, fontWeight: weight);

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
      error: p.flare,
      surface: p.surface,
      onSurface: p.ink,
    ),
    scaffoldBackgroundColor: p.paper,
    extensions: [p],
  );

  final ui = GoogleFonts.getTextTheme('Bricolage Grotesque', base.textTheme)
      .apply(bodyColor: p.ink, displayColor: p.ink);

  final pill = RoundedRectangleBorder(borderRadius: BorderRadius.circular(999));

  return base.copyWith(
    textTheme: ui,
    dividerColor: p.line,
    appBarTheme: AppBarTheme(
      backgroundColor: p.surface,
      foregroundColor: p.ink,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
      shape: Border(bottom: BorderSide(color: p.line)),
      titleTextStyle: display(size: 18, color: p.ink),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: p.signal,
        foregroundColor: p.signalInk,
        textStyle: display(size: 15, weight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: pill,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: p.ink,
        side: BorderSide(color: p.lineStrong),
        textStyle: display(size: 15, weight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: pill,
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: p.surface,
      selectedColor: p.ink,
      side: BorderSide(color: p.line),
      shape: pill,
      labelStyle: display(size: 14, weight: FontWeight.w500, color: p.ink2),
      secondaryLabelStyle: display(size: 14, weight: FontWeight.w600, color: p.paper),
      checkmarkColor: p.paper,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.surface,
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
      backgroundColor: p.surface,
      indicatorColor: p.signalSoft,
      surfaceTintColor: Colors.transparent,
      labelTextStyle: WidgetStatePropertyAll(display(size: 12, weight: FontWeight.w600, color: p.ink2)),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: p.ink,
      contentTextStyle: TextStyle(color: p.paper),
      behavior: SnackBarBehavior.floating,
    ),
  );
}
