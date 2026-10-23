import 'package:flutter/material.dart';

import '../brand.dart';
import '../theme/app_theme.dart';

/// A collapsible section: one row with a title, a count and, while closed, a
/// one-line teaser. Tap the row to open or close it.
class Fold extends StatefulWidget {
  const Fold({super.key, required this.title, required this.children, this.count, this.teaser, this.dot, this.initiallyOpen = false});

  final String title;
  final int? count;
  final String? teaser;
  final Color? dot;
  final bool initiallyOpen;
  final List<Widget> children;

  @override
  State<Fold> createState() => _FoldState();
}

class _FoldState extends State<Fold> {
  late bool _open = widget.initiallyOpen;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: p.line)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            button: true,
            expanded: _open,
            child: InkWell(
              onTap: () => setState(() => _open = !_open),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 14, 16, 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AnimatedRotation(
                      turns: _open ? 0.25 : 0,
                      duration: const Duration(milliseconds: 180),
                      child: Icon(Icons.chevron_right, size: 22, color: p.slate),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              if (widget.dot != null) ...[
                                Container(
                                  width: 9,
                                  height: 9,
                                  decoration: BoxDecoration(color: widget.dot, shape: BoxShape.circle),
                                ),
                                const SizedBox(width: 8),
                              ],
                              Flexible(
                                child: Text(
                                  widget.title,
                                  style: display(size: 15.5, weight: FontWeight.w700, color: p.ink),
                                ),
                              ),
                              if (widget.count != null) ...[
                                const SizedBox(width: 8),
                                Text(
                                  '${widget.count}',
                                  style: figures(size: 13, color: p.slate, weight: FontWeight.w500),
                                ),
                              ],
                            ],
                          ),
                          if (!_open && widget.teaser != null) ...[
                            const SizedBox(height: 3),
                            Text(
                              widget.teaser!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: reading(size: 13, color: p.slate),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (_open) ...widget.children,
        ],
      ),
    );
  }
}

/// Items grouped by desk, busiest desk first and open; the rest closed with
/// their top headline as a teaser. Long groups show five, then "Show all".
class TopicGroups<T> extends StatelessWidget {
  const TopicGroups({super.key, required this.items, required this.category, required this.title, required this.itemBuilder});

  final List<T> items;
  final String? Function(T) category;
  final String Function(T) title;
  final Widget Function(T item, int index) itemBuilder;

  @override
  Widget build(BuildContext context) {
    final groups = <String, List<T>>{};
    for (final it in items) {
      groups.putIfAbsent(category(it) ?? 'Other', () => []).add(it);
    }
    final sorted = groups.entries.toList()..sort((a, b) => b.value.length.compareTo(a.value.length));
    final p = context.palette;
    return Container(
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: p.line)),
      ),
      child: Column(
        children: [
          for (var n = 0; n < sorted.length; n++)
            _Group<T>(key: ValueKey(sorted[n].key), name: sorted[n].key, items: sorted[n].value, title: title, itemBuilder: itemBuilder, initiallyOpen: n == 0),
        ],
      ),
    );
  }
}

class _Group<T> extends StatefulWidget {
  const _Group({super.key, required this.name, required this.items, required this.title, required this.itemBuilder, required this.initiallyOpen});
  final String name;
  final List<T> items;
  final String Function(T) title;
  final Widget Function(T item, int index) itemBuilder;
  final bool initiallyOpen;

  @override
  State<_Group<T>> createState() => _GroupState<T>();
}

class _GroupState<T> extends State<_Group<T>> {
  static const _preview = 5;
  bool _all = false;

  @override
  Widget build(BuildContext context) {
    final meta = categoryMeta(widget.name);
    final shown = _all ? widget.items : widget.items.take(_preview).toList();
    return Fold(
      title: meta.name,
      count: widget.items.length,
      teaser: widget.items.isEmpty ? null : widget.title(widget.items.first),
      dot: meta.hue,
      initiallyOpen: widget.initiallyOpen,
      children: [
        for (var i = 0; i < shown.length; i++) widget.itemBuilder(shown[i], i),
        if (!_all && widget.items.length > _preview)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
            child: OutlinedButton(onPressed: () => setState(() => _all = true), child: Text('Show all ${widget.items.length}')),
          ),
      ],
    );
  }
}
