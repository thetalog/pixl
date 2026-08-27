import 'package:flutter/material.dart';

class CommentsPreview extends StatelessWidget {
  const CommentsPreview({Key? key, required this.comments}) : super(key: key);

  final List<dynamic> comments;

  @override
  Widget build(BuildContext context) {
    final shownComments =
        comments.length > 2 ? comments.take(2).toList() : comments;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...shownComments.map((comment) {
          final text = comment["text"]?.toString() ?? "";
          final profilePic = comment["profilePic"]?.toString() ?? "";

          if (text.trim().isEmpty) return const SizedBox.shrink();

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              children: [
                SizedBox(
                  width: 17,
                  height: 17,
                  child: CircleAvatar(
                    backgroundImage:
                        profilePic.isNotEmpty ? NetworkImage(profilePic) : null,
                    child: profilePic.isEmpty
                        ? const Icon(Icons.person, size: 14)
                        : null,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    text,
                    style:
                        const TextStyle(fontSize: 14, color: Color(0xFF200E32)),
                  ),
                ),
              ],
            ),
          );
        }),
        if (comments.length > 2)
          const Padding(
            padding: EdgeInsets.only(left: 40),
            child: Text(
              "Show More Comments",
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
      ],
    );
  }
}
