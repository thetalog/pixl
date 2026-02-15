import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../state/stories_provider.dart';
import '../../state/posts_provider.dart';
import '../post/comments/show_all_comments.dart';
import '../post/comments/comments_preview.dart';
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
  final savedPosts = <String>{};

  void _openComments(Map<String, dynamic> post) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ShowAllComments(post: post),
      ),
    );
  }

  Future<void> toggleLike(Map<String, dynamic> post) async {
    final postId = post["id"]?.toString();
    if (postId == null || postId.isEmpty) return;

    try {
      final token = await secureStorage.read(key: "jwt_token");

      final res = await http.patch(
        Uri.parse(Config.buildApiUrl('/posts/like-or-unlike/$postId')),
        headers: {"Authorization": "Bearer $token"},
      );

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        setState(() {
          decoded["message"] == "Liked"
              ? likedPosts.add(postId)
              : likedPosts.remove(postId);
        });
      }
    } catch (e) {
      // Handle error, maybe show a snackbar
    }
  }

  Future<void> toggleSave(Map<String, dynamic> post) async {
    final postId = post["id"]?.toString();
    if (postId == null || postId.isEmpty) return;

    try {
      final token = await secureStorage.read(key: "jwt_token");

      final res = await http.patch(
        Uri.parse(Config.buildApiUrl('/posts/save-or-unsave/$postId')),
        headers: {"Authorization": "Bearer $token"},
      );

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        setState(() {
          decoded["message"] == "Saved"
              ? savedPosts.add(postId)
              : savedPosts.remove(postId);
        });
      }
    } catch (e) {
      // Handle error, maybe show a snackbar
    }
  }

  @override
  Widget build(BuildContext context) {
    final stories = ref.watch(storiesProvider);
    final posts = ref.watch(postsProvider);

    return Container(
      color: const Color(0xFF0D1B2A),
      child: Column(
        children: [
          SizedBox(
            height: 60,
            child: stories.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text(e.toString(),
                  style: const TextStyle(color: Colors.white)),
              data: (data) => StoriesBar(allStories: data),
            ),
          ),
          const Divider(color: Colors.grey),
          Expanded(
            child: posts.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text(e.toString(),
                  style: const TextStyle(color: Colors.white)),
              data: (list) => list.isEmpty
                  ? const Center(
                      child: Text(
                        "No posts available",
                        style: TextStyle(color: Colors.white),
                      ),
                    )
                  : ListView.builder(
                      itemCount: list.length,
                      itemBuilder: (_, i) {
                        final post = list[i];
                        final media = (post["media"] as List?) ?? const [];
                        final Map<String, dynamic>? firstMedia =
                            media.isNotEmpty
                                ? Map<String, dynamic>.from(media.first as Map)
                                : null;

                        final postId = post["id"]?.toString() ?? "";
                        final reactions =
                            (post["reactions"] as List?) ?? const [];
                        final isLiked = postId.isNotEmpty &&
                            (likedPosts.contains(postId) ||
                                reactions.isNotEmpty);

                        final savedBy = (post["savedBy"] as List?) ?? const [];
                        final isSaved = postId.isNotEmpty &&
                            (savedPosts.contains(postId) || savedBy.isNotEmpty);
                        final comments =
                            (post["comments"] as List?) ?? const [];

                        final postUser =
                            (post["user"] as Map?)?.cast<String, dynamic>() ??
                                const <String, dynamic>{};
                        final authorUserName =
                            postUser["userName"]?.toString() ?? "";
                        final authorProfilePic =
                            postUser["profilePic"]?.toString() ?? "";

                        final String? mimeType = firstMedia == null
                            ? null
                            : firstMedia["mimeType"]?.toString();

                        final String? mediaUrl;
                        if (firstMedia == null) {
                          mediaUrl = null;
                        } else {
                          final dynamic rawUrl = mimeType == "VIDEO"
                              ? firstMedia["thumbnail"]
                              : firstMedia["url"];
                          mediaUrl = rawUrl?.toString();
                        }

                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Container(
                            color: const Color(0xFFF8F8F8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 10),
                                  child: Row(
                                    children: [
                                      SizedBox(
                                        width: 28,
                                        height: 28,
                                        child: CircleAvatar(
                                          backgroundImage:
                                              authorProfilePic.isNotEmpty
                                                  ? NetworkImage(
                                                      authorProfilePic,
                                                    )
                                                  : null,
                                          backgroundColor:
                                              const Color(0xFFEFEFEF),
                                          child: authorProfilePic.isEmpty
                                              ? const Icon(
                                                  Icons.person,
                                                  size: 18,
                                                  color: Color(0xFF200E32),
                                                )
                                              : null,
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          authorUserName.isNotEmpty
                                              ? authorUserName
                                              : "Unknown",
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            color: Color(0xFF200E32),
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (mediaUrl != null && mediaUrl.isNotEmpty)
                                  InkWell(
                                    onTap: () => _openComments(post),
                                    child: AspectRatio(
                                      aspectRatio: 1,
                                      child: Image.network(
                                        mediaUrl,
                                        fit: BoxFit.cover,
                                        loadingBuilder:
                                            (context, child, progress) {
                                          if (progress == null) return child;
                                          return const Center(
                                              child:
                                                  CircularProgressIndicator());
                                        },
                                        errorBuilder:
                                            (context, error, stackTrace) {
                                          return const Center(
                                            child: Text(
                                              "Media failed to load",
                                              style: TextStyle(
                                                  color: Color(0xFF200E32)),
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                  ),
                                Container(
                                  width: double.infinity,
                                  height: 40,
                                  alignment: Alignment.center,
                                  padding:
                                      const EdgeInsets.symmetric(horizontal: 8),
                                  color: const Color(0xFFF8F8F8),
                                  child: Row(
                                    children: [
                                      GestureDetector(
                                        onTap: () => toggleLike(post),
                                        child: SvgPicture.asset(
                                          isLiked
                                              ? "assets/icons/HeartLiked.svg"
                                              : "assets/icons/HeartUnliked.svg",
                                          width: 20,
                                          height: 20,
                                          colorFilter: const ColorFilter.mode(
                                            Color(0xFF200E32),
                                            BlendMode.srcIn,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      InkWell(
                                        onTap: () => _openComments(post),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.comment,
                                                size: 20,
                                                color: Color(0xFF200E32)),
                                            const SizedBox(width: 4),
                                            Text(
                                              comments.isEmpty
                                                  ? "0"
                                                  : comments.length.toString(),
                                              style: const TextStyle(
                                                color: Color(0xFF200E32),
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      InkWell(
                                        onTap: () {},
                                        child: const Icon(Icons.send,
                                            size: 20, color: Color(0xFF200E32)),
                                      ),
                                      const Spacer(),
                                      InkWell(
                                        onTap: () => toggleSave(post),
                                        child: Icon(
                                          isSaved
                                              ? Icons.bookmark
                                              : Icons.bookmark_border,
                                          size: 22,
                                          color: const Color(0xFF200E32),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                InkWell(
                                  onTap: () => _openComments(post),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 8),
                                    child: Text(
                                      post["caption"]?.toString() ?? "",
                                      style: const TextStyle(
                                          color: Color(0xFF200E32),
                                          fontSize: 14),
                                    ),
                                  ),
                                ),
                                if (comments.isNotEmpty)
                                  InkWell(
                                    onTap: () => _openComments(post),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 12, vertical: 4),
                                      child:
                                          CommentsPreview(comments: comments),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
