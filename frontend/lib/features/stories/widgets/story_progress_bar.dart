import 'package:flutter/material.dart';

class StoryProgressBar extends StatelessWidget {
  final int storiesLength;
  final int currentStoryIndex;

  const StoryProgressBar({
    Key? key,
    required this.storiesLength,
    required this.currentStoryIndex,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 20,
      left: 8,
      right: 8,
      child: Row(
        children: List.generate(storiesLength, (index) {
          return Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              height: 4,
              decoration: BoxDecoration(
                color:
                    index <= currentStoryIndex ? Colors.white : Colors.white30,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }
}
