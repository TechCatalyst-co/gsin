import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// A floating "back to top" button for long scroll views. Attach it to a
/// [ScrollController] and drop it into a [Stack]; it fades itself in once the
/// list is scrolled past [threshold] and animates back to the top on tap.
class ScrollToTopButton extends StatefulWidget {
  const ScrollToTopButton({
    super.key,
    required this.controller,
    this.threshold = 400,
  });

  final ScrollController controller;
  final double threshold;

  @override
  State<ScrollToTopButton> createState() => _ScrollToTopButtonState();
}

class _ScrollToTopButtonState extends State<ScrollToTopButton> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onScroll);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onScroll);
    super.dispose();
  }

  void _onScroll() {
    final show =
        widget.controller.hasClients && widget.controller.offset > widget.threshold;
    if (show != _visible) setState(() => _visible = show);
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      ignoring: !_visible,
      child: AnimatedScale(
        scale: _visible ? 1 : 0.9,
        duration: const Duration(milliseconds: 180),
        child: AnimatedOpacity(
          opacity: _visible ? 1 : 0,
          duration: const Duration(milliseconds: 180),
          child: Material(
            color: context.palette.ink,
            shape: const CircleBorder(),
            elevation: 3,
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: () => widget.controller.animateTo(
                0,
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOut,
              ),
              child: SizedBox(
                width: 44,
                height: 44,
                child: Icon(Icons.arrow_upward, color: context.palette.paper, size: 22),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
