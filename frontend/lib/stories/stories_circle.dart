import 'package:flutter/material.dart';

class StoriesCircle extends StatelessWidget {
  final List<Map<String, dynamic>> stories;
  final String? profilePic; // ✅ nullable

  const StoriesCircle({
    Key? key,
    required this.stories,
    required this.profilePic,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final bool hasUnseen = stories.any((story) => story['isSeen'] == false);

    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: hasUnseen
            ? const LinearGradient(
                colors: [Colors.red, Colors.orange],
              )
            : null,
        color: hasUnseen ? null : Colors.grey,
      ),
      child: CircleAvatar(
        radius: 32,
        backgroundColor: Colors.grey.shade800,
        backgroundImage: profilePic != null ? NetworkImage(profilePic!) : null,
        child: profilePic == null
            ? const Icon(Icons.person, color: Colors.white)
            : null,
      ),
    );
  }
}
