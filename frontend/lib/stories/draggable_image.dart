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

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: position.dx,
      top: position.dy,
      child: GestureDetector(
        onPanUpdate: (details) {
          setState(() {
            position += details.delta;
          });
        },
        child: Image.file(
          widget.imageFile,
          width: 120,
          fit: BoxFit.cover,
        ),
      ),
    );
  }
}
