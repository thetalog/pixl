import 'dart:io';
import 'package:flutter/material.dart';

class DraggableImage extends StatefulWidget {
  final File imageFile;

  const DraggableImage({super.key, required this.imageFile});

  @override
  State<DraggableImage> createState() => _DraggableImageState();
}

class _DraggableImageState extends State<DraggableImage> {
  Offset position = const Offset(100, 100);
  double scale = 1.0;

  late Offset _initialPosition;
  late Offset _initialFocalPoint;
  late double _initialScale;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: position.dx,
      top: position.dy,
      child: GestureDetector(
        onScaleStart: (details) {
          _initialPosition = position;
          _initialFocalPoint = details.focalPoint;
          _initialScale = scale;
        },
        onScaleUpdate: (details) {
          Offset newPosition =
              _initialPosition + (details.focalPoint - _initialFocalPoint);

          final Size canvasSize = MediaQuery.of(context).size;
          const double padding = 20;

          newPosition = Offset(
            newPosition.dx.clamp(-padding, canvasSize.width - padding),
            newPosition.dy.clamp(-padding, canvasSize.height - padding),
          );

          final double newScale =
              (_initialScale * details.scale).clamp(0.25, 6.0);

          setState(() {
            position = newPosition;
            scale = newScale;
          });
        },
        child: Transform.scale(
          scale: scale,
          child: Image.file(
            widget.imageFile,
            width: 120,
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
  }
}
