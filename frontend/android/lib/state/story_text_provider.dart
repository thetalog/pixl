import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:ui';
import '../shared/models/story_text.dart';

class StoryTextNotifier extends StateNotifier<List<StoryText>> {
  StoryTextNotifier() : super([]);

  void addText(StoryText text) {
    state = [...state, text];
  }

  void updatePosition(int index, Offset position) {
    final current = state[index];
    final updated = current.copyWith(
      position: position,
    );

    final newState = [...state];
    newState[index] = updated;
    state = newState;
  }

  void updateScale(int index, double scale) {
    final current = state[index];

    final updated = current.copyWith(
      scale: scale,
    );

    final newState = [...state];
    newState[index] = updated;

    state = newState;
  }

  void clear() => state = [];
}

final storyTextProvider =
    StateNotifierProvider<StoryTextNotifier, List<StoryText>>(
  (ref) => StoryTextNotifier(),
);

final storyImageProvider = StateProvider<String?>((ref) => null);
