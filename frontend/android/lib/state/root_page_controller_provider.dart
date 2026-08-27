import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Root horizontal PageView controller used for Home (index 1) <-> CreateStory (index 0).
final rootPageControllerProvider = Provider<PageController>((ref) {
  final controller = PageController(initialPage: 1);
  ref.onDispose(controller.dispose);
  return controller;
});
