import 'package:flutter/material.dart';

class MediaCarousel extends StatelessWidget {
  final List media;
  final PageController controller;

  const MediaCarousel({
    super.key,
    required this.media,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return PageView(
        controller: controller,
        scrollDirection: Axis.horizontal,
        children: List.generate(media.length, (index) {
          return Image.network(
            media[index]["mimeType"] == "VIDEO"
                ? media[index]["thumbnail"]
                : media[index]["mimeType"] == "IMAGE"
                    ? media[index]["url"]
                    : "",
            fit: BoxFit.cover,
          );
        }));
  }
}
