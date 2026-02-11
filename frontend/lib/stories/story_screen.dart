import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:widgets_to_image/widgets_to_image.dart';

import 'package:pixl/providers/action_provider.dart';
import '../providers/story_text_provider.dart';
import './draggable_text.dart';
import './draggable_image.dart';

class StoryScreen extends ConsumerStatefulWidget {
  const StoryScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<StoryScreen> createState() => _StoryScreen();
}

class _StoryScreen extends ConsumerState<StoryScreen> {
  @override
  Widget build(BuildContext context) {
    final action = ref.read(actionProvider);
    final textMap = ref.watch(storyTextProvider);
    final imagePath = ref.watch(storyImageProvider);

    return WidgetsToImage(
      controller: action.controller,
      child: Stack(
        children: [
          if (imagePath != null) DraggableImage(imageFile: File(imagePath)),
          ...textMap.asMap().entries.map(
                (entry) => DraggableText(
                  key: ValueKey(entry.key),
                  index: entry.key,
                  storyText: entry.value,
                ),
              ),
        ],
      ),
    );
  }
}
