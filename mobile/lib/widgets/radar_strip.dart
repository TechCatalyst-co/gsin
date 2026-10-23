import 'dart:async';

import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/gsi_api.dart';
import '../brand.dart';
import '../models/news_item.dart';

/// What the radar is doing, shared by every tab: polled once a minute from
/// GET /news/status and re-rendered every 30 s so the ages stay honest.
class RadarState extends ChangeNotifier {
  RadarState(this._api);
  final ApiClient _api;
  RadarStatus? status;
  Timer? _poll;
  Timer? _tick;

  void start() {
    refresh();
    _poll ??= Timer.periodic(const Duration(seconds: 60), (_) => refresh());
    _tick ??= Timer.periodic(const Duration(seconds: 30), (_) => notifyListeners());
  }

  Future<void> refresh() async {
    try {
      status = await _api.status();
      notifyListeners();
    } catch (_) {
      /* the strip keeps the last reading */
    }
  }

  int get sourceCount => status?.sourceCount ?? Brand.sourceCount;

  @override
  void dispose() {
    _poll?.cancel();
    _tick?.cancel();
    super.dispose();
  }
}
