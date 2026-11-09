import 'dart:async';

import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/gsi_api.dart';
import '../models/news_item.dart';
import '../theme/app_theme.dart';
import 'common.dart';

/// Urgent stories from the last 24 hours, polled once a minute. Empty while
/// nothing is breaking, and the ticker then takes no space.
class BreakingState extends ChangeNotifier {
  BreakingState(this._api);
  final ApiClient _api;
  List<NewsItem> items = const [];
  Timer? _poll;

  void start() {
    refresh();
    _poll ??= Timer.periodic(const Duration(seconds: 60), (_) => refresh());
  }

  Future<void> refresh() async {
    try {
      items = await _api.feed(urgent: true, hours: 24, sort: 'latest', limit: 5);
      notifyListeners();
    } catch (_) {
      /* keep the last reading */
    }
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }
}

/// The breaking ticker under the top bar: a BREAKING label and the headlines
/// scrolling right to left. A tap opens the headline under the label's edge
/// (the one currently entering view). With reduced motion it shows one
/// headline at a time and swaps every few seconds.
class BreakingTicker extends StatefulWidget implements PreferredSizeWidget {
  const BreakingTicker({super.key, required this.items});
  final List<NewsItem> items;

  static const height = 34.0;

  @override
  Size get preferredSize => Size.fromHeight(items.isEmpty ? 0 : height);

  @override
  State<BreakingTicker> createState() => _BreakingTickerState();
}

class _BreakingTickerState extends State<BreakingTicker> with SingleTickerProviderStateMixin {
  static const _gap = 36.0;
  static const _pxPerSecond = 40.0;

  late final AnimationController _reel = AnimationController(vsync: this);
  Timer? _swap;
  int _shown = 0;
  List<double> _widths = const [];
  double _cycle = 0;

  @override
  void dispose() {
    _reel.dispose();
    _swap?.cancel();
    super.dispose();
  }

  @override
  void didUpdateWidget(BreakingTicker old) {
    super.didUpdateWidget(old);
    if (old.items.length != widget.items.length) _shown = 0;
  }

  TextStyle get _style => reading(size: 13.5, color: Colors.white, weight: FontWeight.w600, height: 1.1);

  String _label(NewsItem i) => '${i.title}  ·  ${timeAgo(i.published)}';

  void _measure(TextDirection dir, TextScaler scaler) {
    _widths = [
      for (final i in widget.items)
        (TextPainter(text: TextSpan(text: _label(i), style: _style), textDirection: dir, textScaler: scaler, maxLines: 1)..layout()).width + _gap,
    ];
    final cycle = _widths.fold<double>(0, (a, b) => a + b);
    if (cycle != _cycle && cycle > 0) {
      _cycle = cycle;
      _reel.duration = Duration(milliseconds: (cycle / _pxPerSecond * 1000).round());
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _reel.repeat();
      });
    }
  }

  /// The story under the reel's left edge right now.
  NewsItem _current() {
    var x = _reel.value * _cycle;
    for (var i = 0; i < _widths.length; i++) {
      if (x < _widths[i]) return widget.items[i];
      x -= _widths[i];
    }
    return widget.items.first;
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.items;
    if (items.isEmpty) {
      _cycle = 0;
      _reel.stop();
      _swap?.cancel();
      _swap = null;
      return const SizedBox.shrink();
    }
    final p = context.palette;
    final still = reduceMotion(context);

    Widget body;
    NewsItem Function() target;
    if (still) {
      _cycle = 0;
      _reel.stop();
      _swap ??= Timer.periodic(const Duration(seconds: 5), (_) {
        if (mounted && widget.items.length > 1) setState(() => _shown = (_shown + 1) % widget.items.length);
      });
      final item = items[_shown % items.length];
      target = () => item;
      body = Align(
        alignment: Alignment.centerLeft,
        child: Text(_label(item), style: _style, maxLines: 1, overflow: TextOverflow.ellipsis),
      );
    } else {
      _swap?.cancel();
      _swap = null;
      _measure(Directionality.of(context), MediaQuery.textScalerOf(context));
      target = _current;
      final row = Row(mainAxisSize: MainAxisSize.min, children: [
        for (final i in items) Padding(padding: const EdgeInsets.only(right: _gap), child: Text(_label(i), style: _style, maxLines: 1)),
      ]);
      body = ClipRect(
        child: AnimatedBuilder(
          animation: _reel,
          builder: (context, child) => OverflowBox(
            alignment: Alignment.centerLeft,
            minWidth: 0,
            maxWidth: double.infinity,
            child: Transform.translate(offset: Offset(-_reel.value * _cycle, 0), child: child),
          ),
          // Two copies so the loop is seamless.
          child: Row(mainAxisSize: MainAxisSize.min, children: [row, row]),
        ),
      );
    }

    return Semantics(
      container: true,
      label: 'Breaking: ${items.map((i) => i.title).join('. ')}',
      button: true,
      excludeSemantics: true,
      child: Material(
        color: p.signal,
        child: InkWell(
          onTap: () => openStory(context, target()),
          child: SizedBox(
            height: BreakingTicker.height,
            child: Row(children: [
              Padding(
                padding: const EdgeInsets.only(left: 16, right: 12),
                child: Row(children: [
                  Container(width: 7, height: 7, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                  const SizedBox(width: 7),
                  Text('BREAKING', style: display(size: 11, weight: FontWeight.w800, color: Colors.white, letterSpacing: 0.8)),
                ]),
              ),
              Expanded(child: body),
              const SizedBox(width: 12),
            ]),
          ),
        ),
      ),
    );
  }
}
