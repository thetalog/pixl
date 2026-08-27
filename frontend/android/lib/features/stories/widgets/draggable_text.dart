import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../state/story_text_provider.dart';
import '../../../shared/models/story_text.dart';

class DraggableText extends ConsumerStatefulWidget {
  final StoryText storyText;
  final int index;

  const DraggableText({
    super.key,
    required this.storyText,
    required this.index,
  });

  @override
  ConsumerState<DraggableText> createState() => _DraggableTextState();
}

class _DraggableTextState extends ConsumerState<DraggableText> {
  late Offset _initialTextPosition;
  late Offset _initialFocalPoint;
  late double _initialScale;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: widget.storyText.position.dx,
      top: widget.storyText.position.dy,
      child: GestureDetector(
        onScaleStart: (details) {
          _initialTextPosition = widget.storyText.position;
          _initialFocalPoint = details.focalPoint;
          _initialScale = widget.storyText.scale;
        },
        onScaleUpdate: (details) {
          // 1:1 movement using global focal point delta
          Offset newPosition =
              _initialTextPosition + (details.focalPoint - _initialFocalPoint);

          // 🔒 CLAMP TO CANVAS (Stack bounds)
          final Size canvasSize =
              (context.findAncestorWidgetOfExactType<Stack>() != null)
                  ? MediaQuery.of(context).size
                  : MediaQuery.of(context).size;

          const double padding = 20;

          newPosition = Offset(
            newPosition.dx.clamp(
              -padding,
              canvasSize.width - padding,
            ),
            newPosition.dy.clamp(
              -padding,
              canvasSize.height - padding,
            ),
          );

          final double newScale =
              (_initialScale * details.scale).clamp(0.5, 4.0);

          ref
              .read(storyTextProvider.notifier)
              .updatePosition(widget.index, newPosition);

          ref
              .read(storyTextProvider.notifier)
              .updateScale(widget.index, newScale);
        },
        child: Transform.scale(
          scale: widget.storyText.scale,
          child: Text(
            widget.storyText.text,
            style: TextStyle(
              color: widget.storyText.color,
              fontSize: 30,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }
}
