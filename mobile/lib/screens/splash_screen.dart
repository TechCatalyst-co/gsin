import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../auth/auth_state.dart';
import '../brand.dart';
import '../config.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

/// Launch: the global sweep. A wireframe globe draws itself around the mark,
/// the source cities light up as the sweep passes, packets travel from each
/// city into the hub, and a terminal readout reports the radar coming online.
/// On "ready" the rings pulse, the star glints, a light haptic fires, and the
/// whole thing lifts away into the news. Flat color only: Midnight Navy, Royal
/// Blue, Signature Gold, Pearl White.
///
/// The router keeps /splash until this screen navigates away, which happens
/// once the sequence has finished and the stored session has been restored.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  static const readout = <String>[
    'radar online, ${Brand.sourceCount} sources',
    'freshness gate 7 days, primary sources first',
    'grading, four tiers, strict rubric',
    'ready',
  ];

  late final AnimationController _appear = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
  late final AnimationController _progress = AnimationController(vsync: this, duration: const Duration(milliseconds: 2700));
  late final AnimationController _ready = AnimationController(vsync: this, duration: const Duration(milliseconds: 420));
  late final AnimationController _glint = AnimationController(vsync: this, duration: const Duration(milliseconds: 280), reverseDuration: const Duration(milliseconds: 350));
  late final AnimationController _leave = AnimationController(vsync: this, duration: const Duration(milliseconds: 380));
  late final Ticker _clock;
  final DateTime _bootedAt = DateTime.now();
  double _t = 0;
  int _lines = 0;
  bool _cursorOn = true;
  bool _finished = false;
  bool _left = false;
  final _timers = <Timer>[];

  AuthState? _auth;

  @override
  void initState() {
    super.initState();
    _clock = createTicker((elapsed) => setState(() => _t = elapsed.inMicroseconds / 1e6));
    _auth = context.read<AuthState>()..addListener(_maybeLeave);
    WidgetsBinding.instance.addPostFrameCallback((_) => _start());
  }

  void _start() {
    if (!mounted) return;
    final still = reduceMotion(context);
    if (!still) _clock.start();
    _appear.forward();
    _timers.add(Timer(const Duration(milliseconds: 200), () => _progress.forward()));

    // Terminal lines: the first after 350 ms, then one every 640 ms.
    var at = 350;
    for (var i = 1; i <= readout.length; i++) {
      final n = i;
      _timers.add(Timer(Duration(milliseconds: at), () {
        if (!mounted) return;
        setState(() => _lines = n);
        if (n == readout.length) _onReady(still);
      }));
      at += 640;
    }
    // Blinking cursor.
    _timers.add(Timer.periodic(const Duration(milliseconds: 520), (_) {
      if (mounted) setState(() => _cursorOn = !_cursorOn);
    }));
  }

  void _onReady(bool still) {
    if (!still) HapticFeedback.lightImpact();
    _ready.forward();
    _glint.forward().then((_) => _timers.add(Timer(const Duration(milliseconds: 320), () {
          if (mounted) _glint.reverse();
        })));
    _timers.add(Timer(Duration(milliseconds: still ? 500 : 900), () {
      _finished = true;
      _maybeLeave();
    }));
  }

  /// Leave once the sequence is over and the session has been restored.
  void _maybeLeave() {
    if (!mounted || _left || !_finished) return;
    final auth = _auth ?? context.read<AuthState>();
    if (auth.status == AuthStatus.unknown) return; // called again when auth notifies
    _left = true;
    _leave.forward().then((_) {
      if (!mounted) return;
      final user = auth.user;
      if (user != null && user.mustChangePassword) {
        context.go('/change-password');
      } else {
        context.go('/');
      }
    });
  }

  @override
  void dispose() {
    _auth?.removeListener(_maybeLeave);
    for (final t in _timers) {
      t.cancel();
    }
    _clock.dispose();
    _appear.dispose();
    _progress.dispose();
    _ready.dispose();
    _glint.dispose();
    _leave.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const p = AppPalette.dark; // the launch is always navy
    final still = reduceMotion(context);
    final size = MediaQuery.sizeOf(context);
    final instrument = math.max(200.0, math.min(360.0, math.min(size.width - 24, size.height - 420)));

    return AnimatedBuilder(
      animation: Listenable.merge([_appear, _progress, _ready, _glint, _leave]),
      builder: (context, _) {
        final appeared = Curves.easeOut.transform(_appear.value);
        final leave = Curves.easeIn.transform(_leave.value);
        final readyT = Curves.elasticOut.transform(_ready.value);
        final glint = Curves.easeOut.transform(_glint.value);
        return Scaffold(
          backgroundColor: p.paper,
          body: Opacity(
            opacity: 1 - leave,
            child: Transform.scale(
              scale: 1 + 0.04 * leave,
              child: Stack(fit: StackFit.expand, children: [
                Opacity(opacity: appeared, child: CustomPaint(painter: _DotGridPainter(p.signal))),
                if (!still) Opacity(opacity: appeared, child: CustomPaint(painter: _SourceStreamPainter(t: _t, color: p.signal))),
                Center(
                  child: Transform.scale(
                    scale: (0.92 + 0.08 * appeared) * (1 + 0.03 * readyT),
                    child: Opacity(
                      opacity: appeared,
                      child: SizedBox(
                        width: instrument,
                        height: instrument,
                        child: Stack(alignment: Alignment.center, children: [
                          if (!still)
                            CustomPaint(
                              size: Size.square(instrument),
                              painter: _GlobalSweepPainter(t: _t, ready: _ready.value > 0.3, blue: p.signal, navy: p.paper, pearl: p.ink, scale: instrument / 360),
                            ),
                          const BrandMark(size: 120),
                          Transform.translate(
                            offset: const Offset(36, -40),
                            child: Transform.scale(
                              scale: 0.2 + 1.05 * glint,
                              child: Opacity(opacity: glint, child: Text('✦', style: TextStyle(fontSize: 26, color: p.gold))),
                            ),
                          ),
                        ]),
                      ),
                    ),
                  ),
                ),
                // Wordmark and tagline under the instrument.
                Align(
                  alignment: Alignment.center,
                  child: Transform.translate(
                    offset: Offset(0, instrument / 2 + 32 + 10 * (1 - appeared)),
                    child: Opacity(
                      opacity: appeared,
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        const Wordmark(size: 13, showMark: false),
                        const SizedBox(height: 8),
                        Text(Brand.tagline, style: reading(size: 13.5, color: p.ink2, height: 1.2)),
                      ]),
                    ),
                  ),
                ),
                // Terminal readout.
                Align(
                  alignment: Alignment.bottomCenter,
                  child: SafeArea(
                    child: Opacity(
                      opacity: appeared,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(28, 0, 28, 14),
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 560),
                          child: _Readout(
                            lines: _lines,
                            cursorOn: _cursorOn,
                            progress: Curves.linear.transform(_progress.value),
                            start: _bootedAt,
                            sourceCount: Brand.sourceCount,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ]),
            ),
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Readout

class _Readout extends StatelessWidget {
  const _Readout({required this.lines, required this.cursorOn, required this.progress, required this.start, required this.sourceCount});
  final int lines;
  final bool cursorOn;
  final double progress;
  final DateTime start;
  final int sourceCount;

  static String _two(int n) => n < 10 ? '0$n' : '$n';
  String _stamp(int i) {
    final d = start.add(Duration(milliseconds: 350 + i * 640));
    return '${_two(d.hour)}:${_two(d.minute)}:${_two(d.second)}';
  }

  @override
  Widget build(BuildContext context) {
    const p = AppPalette.dark;
    final all = _SplashScreenState.readout;
    final stamp = figures(size: 11, color: p.faint);
    Widget cursor() => Container(width: 7, height: 13, color: cursorOn ? p.signal : Colors.transparent);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(
        height: 84,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (lines == 0) Row(children: [Text(_stamp(0), style: stamp), const SizedBox(width: 12), cursor()]),
          for (var i = 0; i < lines; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 5),
              child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                Text(_stamp(i), style: stamp),
                const SizedBox(width: 12),
                Flexible(
                  child: Text(
                    all[i],
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: reading(size: 13, color: i == all.length - 1 ? p.gold : p.ink, weight: i == all.length - 1 ? FontWeight.w600 : FontWeight.w500, height: 1.2),
                  ),
                ),
                if (i == lines - 1) ...[const SizedBox(width: 10), cursor()],
              ]),
            ),
        ]),
      ),
      const SizedBox(height: 8),
      LayoutBuilder(
        builder: (context, box) => Stack(children: [
          Container(height: 2, width: box.maxWidth, color: p.line),
          Container(height: 2, width: box.maxWidth * math.min(1.0, math.max(0.0, progress)), color: p.signal),
        ]),
      ),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(
          child: Text('$sourceCount sources  /  every 30 minutes  /  primary sources first',
              maxLines: 1, overflow: TextOverflow.ellipsis, style: reading(size: 11, color: p.faint, height: 1.2)),
        ),
        Text(appVersionLabel, style: reading(size: 11, color: p.faint, height: 1.2)),
      ]),
    ]);
  }
}

// ---------------------------------------------------------------------------
// Painters

/// Source cities as (latitude, longitude) in degrees. The globe lights these
/// as the sweep passes.
const _sourceCities = <(double, double)>[
  (37.77, -122.42), (47.61, -122.33), (38.90, -77.04), (40.71, -74.01), (42.36, -71.06), (43.65, -79.38),
  (51.51, -0.13), (48.86, 2.35), (52.52, 13.40), (50.85, 4.35), (32.08, 34.78), (25.20, 55.27),
  (28.61, 77.21), (12.97, 77.59), (1.35, 103.82), (39.90, 116.40), (31.23, 121.47), (37.57, 126.98),
  (35.68, 139.69), (-33.87, 151.21), (-23.55, -46.63), (19.43, -99.13), (55.75, 37.62), (59.33, 18.07),
];

class _GlobalSweepPainter extends CustomPainter {
  _GlobalSweepPainter({required this.t, required this.ready, required this.blue, required this.navy, required this.pearl, required this.scale});
  final double t;
  final bool ready;
  final Color blue;
  final Color navy;
  final Color pearl;
  final double scale;

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final sweep = (t % 3.0) / 3.0 * 2 * math.pi - math.pi / 2;
    final spin = (t % 40.0) / 40.0 * 2 * math.pi;
    const tilt = 0.40;
    final r = 148.0 * scale;
    final outer = 160.0 * scale;
    final hub = 66.0 * scale;

    // Orthographic projection of a point on the unit sphere → screen point + depth.
    (Offset, double) project(double lat, double lon) {
      final phi = lat * math.pi / 180, lam = lon * math.pi / 180 + spin;
      final x = math.cos(phi) * math.sin(lam), y0 = math.sin(phi), z0 = math.cos(phi) * math.cos(lam);
      final y = y0 * math.cos(tilt) - z0 * math.sin(tilt);
      final z = y0 * math.sin(tilt) + z0 * math.cos(tilt);
      return (Offset(c.dx + x * r, c.dy - y * r), z);
    }

    Path polyline(List<(Offset, double)> pts, {required bool front}) {
      final p = Path();
      var pen = false;
      for (final (pt, z) in pts) {
        final vis = front ? z >= 0 : z < 0;
        if (vis) {
          if (pen) {
            p.lineTo(pt.dx, pt.dy);
          } else {
            p.moveTo(pt.dx, pt.dy);
            pen = true;
          }
        } else {
          pen = false;
        }
      }
      return p;
    }

    final lines = <List<(Offset, double)>>[];
    for (var m = 0; m < 180; m += 30) {
      lines.add([for (var lat = -90.0; lat <= 90.0; lat += 4.0) project(lat, m.toDouble())]);
    }
    for (var lat = -60.0; lat <= 60.0; lat += 30.0) {
      lines.add([for (var lon = 0.0; lon <= 360.0; lon += 4.0) project(lat, lon)]);
    }
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (final l in lines) {
      canvas.drawPath(polyline(l, front: false), stroke..color = blue.withValues(alpha: 0.10));
    }
    for (final l in lines) {
      canvas.drawPath(polyline(l, front: true), stroke..color = blue.withValues(alpha: 0.34));
    }
    canvas.drawCircle(c, r, stroke..color = blue.withValues(alpha: 0.5));

    // Outer instrument ring + ticks that brighten behind the sweep.
    canvas.drawCircle(c, outer, stroke..color = blue.withValues(alpha: ready ? 0.9 : 0.55));
    for (var k = 0; k < 72; k++) {
      final a = k / 72 * 2 * math.pi - math.pi / 2;
      var d = (sweep - a) % (2 * math.pi);
      if (d < 0) d += 2 * math.pi;
      final glow = math.max(0.0, 1 - d / (math.pi * 0.5));
      final r0 = outer + 5 * scale, r1 = outer + (k % 6 == 0 ? 14 : 9) * scale;
      canvas.drawLine(
        c + Offset(math.cos(a), math.sin(a)) * r0,
        c + Offset(math.cos(a), math.sin(a)) * r1,
        stroke..color = blue.withValues(alpha: 0.16 + 0.74 * glow),
      );
    }

    // Source cities on the front hemisphere: packets travel to the hub; the sweep makes them pulse.
    final fill = Paint()..style = PaintingStyle.fill;
    for (var i = 0; i < _sourceCities.length; i++) {
      final (lat, lon) = _sourceCities[i];
      final (pt, z) = project(lat, lon);
      if (z <= 0.05) continue;
      final depth = 0.35 + 0.65 * z;
      final screenAngle = math.atan2(pt.dy - c.dy, pt.dx - c.dx);
      var d = (sweep - screenAngle) % (2 * math.pi);
      if (d < 0) d += 2 * math.pi;
      final pulse = math.max(0.0, 1 - d / (math.pi * 0.7));
      final dir = c - pt;
      final len = math.max(1.0, dir.distance);
      final end = c - dir / len * hub;
      canvas.drawLine(pt, end, stroke..color = blue.withValues(alpha: 0.10 + 0.25 * pulse));
      final phase = ((t * 0.45) + i * 0.37) % 1.0;
      final pk = pt + (end - pt) * phase;
      canvas.drawCircle(pk, 1.5, fill..color = pearl.withValues(alpha: 0.5 * depth));
      final sz = 3 + 4 * pulse;
      canvas.drawCircle(pt, sz / 2, fill..color = pearl.withValues(alpha: (0.35 + 0.65 * pulse) * depth));
      if (pulse > 0.6) {
        final ring = 8 + 10 * (1 - pulse);
        canvas.drawCircle(pt, ring, stroke..color = blue.withValues(alpha: math.min(1.0, pulse - 0.6)));
      }
    }

    // Sweep over everything.
    canvas.drawLine(c, c + Offset(math.cos(sweep), math.sin(sweep)) * outer, Paint()
      ..color = blue
      ..strokeWidth = 1.5);

    // Hub: masks the globe under the mark.
    canvas.drawCircle(c, hub, fill..color = navy);
    canvas.drawCircle(c, hub, stroke..color = blue.withValues(alpha: ready ? 0.9 : 0.55));
  }

  @override
  bool shouldRepaint(covariant _GlobalSweepPainter old) => old.t != t || old.ready != ready;
}

/// A quiet dot matrix over the navy field. Flat, no gradient.
class _DotGridPainter extends CustomPainter {
  _DotGridPainter(this.blue);
  final Color blue;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = blue.withValues(alpha: 0.16);
    const step = 24.0;
    for (var x = 12.0; x < size.width; x += step) {
      for (var y = 12.0; y < size.height; y += step) {
        canvas.drawCircle(Offset(x, y), 0.75, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DotGridPainter old) => old.blue != blue;
}

/// Faint vertical stream of source names along the edges: the wire, running.
class _SourceStreamPainter extends CustomPainter {
  _SourceStreamPainter({required this.t, required this.color});
  final double t;
  final Color color;

  static const _names = [
    'deepmind.google', 'openai.com', 'anthropic.com', 'defense.gov', 'darpa.mil', 'nist.gov', 'arxiv.org', 'nature.com',
    'nvidia.com', 'europa.eu', 'cisa.gov', 'fda.gov', 'whitehouse.gov', 'microsoft.com', 'meta.com', 'defensescoop.com',
    'breakingdefense.com', 'thelancet.com', 'huggingface.co', 'mistral.ai',
  ];
  static final _painters = <TextPainter>[];

  List<TextPainter> _ensure() {
    if (_painters.isEmpty) {
      for (final n in _names) {
        _painters.add(TextPainter(
          text: TextSpan(text: n, style: TextStyle(fontSize: 9, color: color.withValues(alpha: 0.22))),
          textDirection: TextDirection.ltr,
        )..layout());
      }
    }
    return _painters;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final painters = _ensure();
    const lineH = 22.0;
    final total = lineH * painters.length;
    final off = (t * 14) % total;
    void column(double x, double offset, {bool right = false}) {
      for (var i = 0; i < painters.length * 2; i++) {
        final tp = painters[i % painters.length];
        final y = i * lineH - offset;
        if (y < -lineH || y > size.height) continue;
        tp.paint(canvas, Offset(right ? x - tp.width : x, y));
      }
    }
    column(10, off);
    column(size.width - 10, total - off, right: true);
  }

  @override
  bool shouldRepaint(covariant _SourceStreamPainter old) => old.t != t;
}
