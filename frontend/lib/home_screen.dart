import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import './stories/story_bar.dart';
import '../providers/stories_provider.dart';
import '../providers/posts_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final Set<int> _expandedTaggedUsers = {};

  void _toggleTaggedUsers(int postIndex) {
    setState(() {
      if (_expandedTaggedUsers.contains(postIndex)) {
        _expandedTaggedUsers.remove(postIndex);
      } else {
        _expandedTaggedUsers.add(postIndex);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final storiesAsync = ref.watch(storiesProvider);
    final postsAsync = ref.watch(postsProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // 🔴⚪ STORIES BAR SECTION
            SizedBox(
              height: 50,
              child: storiesAsync.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(),
                ),
                error: (err, _) => Center(
                  child: Text(
                    err.toString(),
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),
                data: (stories) {
                  if (stories.isEmpty) {
                    return const Center(
                      child: Text(
                        'No stories',
                        style: TextStyle(color: Colors.grey),
                      ),
                    );
                  }
                  return StoriesBar(allStories: stories);
                },
              ),
            ),

            // 🔹 FEED POSTS SECTION
            Expanded(
              child: postsAsync.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(),
                ),
                error: (err, _) => Center(
                  child: Text(
                    err.toString(),
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                data: (posts) {
                  if (posts.isEmpty) {
                    return const Center(
                      child: Text(
                        'No posts from followed users',
                        style: TextStyle(color: Colors.white),
                      ),
                    );
                  }

                  return ListView.builder(
                    itemCount: posts.length,
                    itemBuilder: (context, index) {
                      final post = posts[index];
                      final isExpanded = _expandedTaggedUsers.contains(index);
                      return Card(
                        color: Colors.grey[900],
                        margin: const EdgeInsets.all(8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // User info
                            Padding(
                              padding: const EdgeInsets.all(8),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 20,
                                    backgroundImage:
                                        post['user']['profilePic'] != null
                                            ? NetworkImage(
                                                post['user']['profilePic'])
                                            : null,
                                    child: post['user']['profilePic'] == null
                                        ? const Icon(Icons.person)
                                        : null,
                                  ),
                                  const SizedBox(width: 8),
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        post['user']['userName'] ?? 'Unknown',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        post['location'] ?? '',
                                        style: const TextStyle(
                                          color: Color.fromARGB(
                                              255, 255, 255, 255),
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Stack(
                              children: [
                                // Post image
                                if (post['media'] != null &&
                                    (post['media'] as List).isNotEmpty)
                                  Image.network(
                                    post['media'][0]['url'],
                                    height: 300,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                  ),
                                // Tagged users toggle button
                                if (post['taggedUsers'] != null &&
                                    (post['taggedUsers'] as List).isNotEmpty)
                                  Positioned(
                                    top: 10,
                                    right: 10,
                                    child: GestureDetector(
                                      onTap: () => _toggleTaggedUsers(index),
                                      child: Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.blue.withOpacity(0.8),
                                          border: Border.all(
                                            color: Colors.white,
                                            width: 2,
                                          ),
                                        ),
                                        child: Center(
                                          child: Text(
                                            (post['taggedUsers'] as List)
                                                .length
                                                .toString(),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                // Expanded tagged users list
                                if (isExpanded &&
                                    post['taggedUsers'] != null &&
                                    (post['taggedUsers'] as List).isNotEmpty)
                                  Positioned(
                                    top: 60,
                                    right: 10,
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.end,
                                      children: (post['taggedUsers']
                                              as List<dynamic>)
                                          .map((user) => Container(
                                                margin: const EdgeInsets.only(
                                                    bottom: 5),
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: Colors.black
                                                      .withOpacity(0.7),
                                                  borderRadius:
                                                      BorderRadius.circular(4),
                                                  border: Border.all(
                                                    color: Colors.white,
                                                    width: 1,
                                                  ),
                                                ),
                                                child: Text(
                                                  user ?? 'Unknown',
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              ))
                                          .toList(),
                                    ),
                                  ),
                              ],
                            ),
                            // Caption
                            if (post['caption'] != null &&
                                post['caption'].isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.all(8),
                                child: Text(
                                  post['caption'],
                                  style: const TextStyle(
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            // Tags
                            if (post['userTags'] != null &&
                                (post['userTags'] as List).isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                child: Wrap(
                                  spacing: 8,
                                  children: (post['userTags'] as List<dynamic>)
                                      .map((tag) => Text(
                                            '#$tag',
                                            style: const TextStyle(
                                              color: Colors.blue,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ))
                                      .toList(),
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
