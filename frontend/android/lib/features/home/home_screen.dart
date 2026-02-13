import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../stories/widgets/story_bar.dart';
import '../../state/stories_provider.dart';
import '../../state/posts_provider.dart';
import '../post/comments/show_all_comments.dart';
import 'package:pixl/core/config/config.dart';

final FlutterSecureStorage secureStorage = FlutterSecureStorage();
final logger = Logger();

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final Set<String> likedPosts = {};
  final Set<int> _expandedTaggedUsers = {};

  void _toggleTaggedUsers(int index) {
    setState(() {
      if (_expandedTaggedUsers.contains(index)) {
        _expandedTaggedUsers.remove(index);
      } else {
        _expandedTaggedUsers.add(index);
      }
    });
  }

  /// ❤️ Like / Unlike
  Future<void> _toggleLike(Map<String, dynamic> post) async {
    final postId = post["id"];
    final token = await secureStorage.read(key: "jwt_token");

    final res = await http.patch(
      Uri.parse(Config.buildApiUrl('/posts/like-or-unlike/$postId')),
      headers: {
        "Authorization": "Bearer $token",
      },
    );

    final decoded = jsonDecode(res.body);

    setState(() {
      if (decoded["message"] == "Liked") {
        likedPosts.add(postId);
      } else {
        likedPosts.remove(postId);
      }
    });
  }

  /// 🔘 Action Row
  Widget postActions(Map<String, dynamic> post) {
    final comments = post["comments"] as List? ?? [];
    final liked = likedPosts.contains(post["id"]);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ShowAllComments(post: post),
                ),
              );
            },
            child: const Icon(Icons.comment, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 4),
          Text(
            comments.length.toString(),
            style: const TextStyle(color: Colors.white),
          ),
          const SizedBox(width: 12),
          const Icon(Icons.share, color: Colors.white, size: 20),
          const Spacer(),
          GestureDetector(
            onTap: () => _toggleLike(post),
            child: SvgPicture.asset(
              liked
                  ? "assets/icons/HeartLiked.svg"
                  : "assets/icons/HeartUnliked.svg",
              width: 20,
              colorFilter: ColorFilter.mode(Colors.white, BlendMode.srcIn),
            ),
          ),
        ],
      ),
    );
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
            // STORIES BAR
            SizedBox(
              height: 50,
              child: storiesAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                    child: Text(e.toString(),
                        style: const TextStyle(color: Colors.white))),
                data: (stories) => StoriesBar(allStories: stories),
              ),
            ),

            // POSTS FEED
            Expanded(
              child: postsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                    child: Text(e.toString(),
                        style: const TextStyle(color: Colors.white))),
                data: (posts) => ListView.builder(
                  itemCount: posts.length,
                  itemBuilder: (context, index) {
                    final post = posts[index];
                    final expanded = _expandedTaggedUsers.contains(index);

                    final taggedUsers = post['taggedUsers'] as List? ?? [];
                    final media = post['media'] as List? ?? [];

                    return Card(
                      color: Colors.grey[900],
                      margin: const EdgeInsets.all(8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // USER HEADER
                          ListTile(
                            leading: CircleAvatar(
                              backgroundImage:
                                  post['user']['profilePic'] != null
                                      ? NetworkImage(post['user']['profilePic'])
                                      : null,
                              child: post['user']['profilePic'] == null
                                  ? const Icon(Icons.person)
                                  : null,
                            ),
                            title: Text(post['user']['userName'],
                                style: const TextStyle(color: Colors.white)),
                            subtitle: Text(post['location'] ?? '',
                                style: const TextStyle(color: Colors.white70)),
                          ),

                          // IMAGE + TAGS
                          if (media.isNotEmpty)
                            Stack(
                              children: [
                                Image.network(
                                  media[0]['url'],
                                  height: 300,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                ),

                                // TAG COUNT BUTTON
                                if (taggedUsers.isNotEmpty)
                                  Positioned(
                                    top: 10,
                                    right: 10,
                                    child: GestureDetector(
                                      onTap: () => _toggleTaggedUsers(index),
                                      child: Container(
                                        width: 36,
                                        height: 36,
                                        decoration: const BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.blue,
                                        ),
                                        child: Center(
                                          child: Text(
                                            taggedUsers.length.toString(),
                                            style: const TextStyle(
                                                color: Colors.white),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),

                                // TAGGED USERS LIST
                                if (expanded && taggedUsers.isNotEmpty)
                                  Positioned(
                                    top: 55,
                                    right: 10,
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.end,
                                      children: taggedUsers
                                          .map(
                                            (u) => Container(
                                              margin: const EdgeInsets.only(
                                                  bottom: 6),
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 8,
                                                      vertical: 4),
                                              decoration: BoxDecoration(
                                                color: Colors.black
                                                    .withOpacity(.75),
                                                borderRadius:
                                                    BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                u.toString(),
                                                style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 12),
                                              ),
                                            ),
                                          )
                                          .toList(),
                                    ),
                                  ),
                              ],
                            ),

                          // CAPTION
                          if (post['caption'] != null)
                            Padding(
                              padding: const EdgeInsets.all(8),
                              child: Text(post['caption'],
                                  style: const TextStyle(color: Colors.white)),
                            ),

                          postActions(post),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
