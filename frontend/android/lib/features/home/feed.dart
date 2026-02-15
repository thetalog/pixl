import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../state/stories_provider.dart';
import '../../state/posts_provider.dart';
import '../post/comments/show_all_comments.dart';
import '../stories/widgets/story_bar.dart';
import 'package:pixl/core/config/config.dart';
import 'package:logger/logger.dart';

final secureStorage = FlutterSecureStorage();
final logger = Logger();

class Feed extends ConsumerStatefulWidget {
  const Feed({super.key});

  @override
  ConsumerState<Feed> createState() => _FeedState();
}

class _FeedState extends ConsumerState<Feed> {
  final likedPosts = <String>{};

  Future<void> toggleLike(Map<String, dynamic> post) async {
    try {
      final token = await secureStorage.read(key: "jwt_token");

      final res = await http.patch(
        Uri.parse(Config.buildApiUrl('/posts/like-or-unlike/${post["id"]}')),
        headers: {"Authorization": "Bearer $token"},
      );

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        setState(() {
          decoded["message"] == "Liked"
              ? likedPosts.add(post["id"])
              : likedPosts.remove(post["id"]);
        });
      }
    } catch (e) {
      // Handle error, maybe show a snackbar
    }
  }

  @override
  Widget build(BuildContext context) {
    logger.i("debug1");

    final stories = ref.watch(storiesProvider);
    final posts = ref.watch(postsProvider);

    return Column(
      children: [
        SizedBox(
          height: 60,
          child: stories.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text(e.toString()),
            data: (data) => StoriesBar(allStories: data),
          ),
        ),
        Expanded(
          child: posts.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text(e.toString()),
            data: (list) => ListView.builder(
              itemCount: list.length,
              itemBuilder: (_, i) {
                final post = list[i];
                return ListTile(
                  title: Text(
                    post["caption"] ?? "",
                    style: const TextStyle(color: Colors.white),
                  ),
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ShowAllComments(post: post),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
