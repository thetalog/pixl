import 'dart:ui';
import 'package:flutter/material.dart';

class StoryText {
  final Offset position;
  final double scale;
  final String text;
  final Color color;

  const StoryText({
    required this.position,
    required this.text,
    this.scale = 1.0,
    this.color = Colors.white,
  });

  StoryText copyWith({
    Offset? position,
    double? scale,
    String? text,
    Color? color,
  }) {
    return StoryText(
      position: position ?? this.position,
      scale: scale ?? this.scale,
      text: text ?? this.text,
      color: color ?? this.color,
    );
  }
}
