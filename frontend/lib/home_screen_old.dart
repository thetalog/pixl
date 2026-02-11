import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import './stories/story_bar.dart';
import '../providers/stories_provider.dart';
import '../providers/posts_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storiesAsync = ref.watch(storiesProvider);
    final postsAsync = ref.watch(postsProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: storiesAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(),
          ),
          error: (err, _) => Center(
            child: Text(
              err.toString(),
              style: const TextStyle(color: Colors.white),
            ),
          ),
          data: (stories) {
            if (stories.isEmpty) {
              return const Center(
                child: Text(
                  'No stories yet',
                  style: TextStyle(color: Colors.white),
                ),
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 🔴⚪ STORIES BAR
                StoriesBar(allStories: stories),

                // 🔹 FEED POSTS
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
                                        child:
                                            post['user']['profilePic'] == null
                                                ? const Icon(Icons.person)
                                                : null,
                                      ),
                                      const SizedBox(width: 8),
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            post['user']['userName'] ??
                                                'Unknown',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          Text(
                                            post['user']['name'] ?? '',
                                            style: const TextStyle(
                                              color: Colors.grey,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                // Post image
                                if (post['media'] != null &&
                                    (post['media'] as List).isNotEmpty)
                                  Image.network(
                                    post['media'][0]['url'],
                                    height: 300,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
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
                              ],
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
