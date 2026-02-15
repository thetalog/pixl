import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../stories_circle.dart';
import '../story_viewer.dart';

final logger = Logger();

class StoriesBar extends StatelessWidget {
  final List<Map<String, dynamic>> allStories;

  const StoriesBar({
    Key? key,
    required this.allStories,
  }) : super(key: key);

  Map<String, List<Map<String, dynamic>>> _groupByUser() {
    final Map<String, List<Map<String, dynamic>>> grouped = {};

    for (final story in allStories) {
      final userId = story['user']['id'];
      grouped.putIfAbsent(userId, () => []);
      grouped[userId]!.add(story);
    }

    return grouped;
  }

  @override
  Widget build(BuildContext context) {
    final groupedStories = _groupByUser();
    final users = groupedStories.keys.toList();
    if (users.isEmpty) {
      return Center(
          child: Text("No stories available",
              style: TextStyle(color: const Color.fromARGB(255, 0, 0, 0))));
    }
    return SizedBox(
      height: 110,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: users.length,
        itemBuilder: (context, index) {
          final userStories = groupedStories[users[index]]!;
          final profilePic = userStories.first['user']['profilePic'];
          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => StoryViewer(
                    stories: userStories,
                  ),
                ),
              );
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Column(
                children: [
                  StoriesCircle(
                    stories: userStories,
                    profilePic: profilePic,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    userStories.first['user']['userName'],
                    style: const TextStyle(fontSize: 12, color: Colors.white),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
