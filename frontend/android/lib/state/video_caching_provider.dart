import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';

class VideoCache {
  final String id;
  final Uint8List video;

  VideoCache({required this.id, required this.video});
}

final StateProvider<List<Map<String, dynamic>>> videoCachingProvider =
    StateProvider<List<Map<String, dynamic>>>((ref) => [{}]);

final videoLengthProvider = Provider<int>((ref) {
  final cache = ref.watch(videoCachingProvider);
  return cache.length;
});
