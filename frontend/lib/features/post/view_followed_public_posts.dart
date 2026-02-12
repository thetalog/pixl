import "package:flutter/material.dart";
import "package:http/http.dart" as http;
import "dart:convert";
import "comments/show_all_comments.dart";
import 'package:pixl/core/config/config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

final logger = Logger();

final FlutterSecureStorage secureStorage = FlutterSecureStorage();

class ViewFollowedPublicPosts extends StatefulWidget {
  const ViewFollowedPublicPosts({super.key});

  @override
  State<ViewFollowedPublicPosts> createState() =>
      _ViewFollowedPublicPostsState();
}

class _ViewFollowedPublicPostsState extends State<ViewFollowedPublicPosts> {
  List<Map<String, dynamic>> posts = [];
  bool loading = true;

  /// ✅ Like state per post (index based)
  final Set<String> likedPosts = {};

  Future<void> fetchAllPosts() async {
    try {
      String? token = await secureStorage.read(key: "jwt_token");
      if (token == null) {
        logger.e("❌ JWT token not found");
        return;
      }
      final res = await http.get(
        Uri.parse(Config.buildApiUrl('/posts/get-followed-posts')),
        headers: {
          "Authorization": "Bearer $token",
        },
      );

      final decodedData = jsonDecode(res.body);

      final List<dynamic> data = decodedData["data"] ?? [];

      setState(() {
        posts = data.map((e) => Map<String, dynamic>.from(e)).toList();
        for (var post in posts) {
          if (post["reactions"]?.length != 0) {
            likedPosts.add(post["id"]);
          }
        }
        loading = false;
      });
    } catch (e) {
      setState(() => loading = false);
      print("Error: $e");
    }
  }

  @override
  void initState() {
    super.initState();
    fetchAllPosts();
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (posts.isEmpty) {
      return const Center(child: Text("No posts found"));
    }

    return Scaffold(
        body: ListView.builder(
      itemCount: posts.length,
      itemBuilder: (context, index) {
        final post = posts[index];

        // ✅ comments safe
        final comments = post["comments"] as List? ?? [];
        final commentCount = comments.length;

        // ✅ media safe
        final mediaList = post["media"] as List? ?? [];
        final urlList =
            mediaList.isNotEmpty ? (mediaList[0]["url"] as List? ?? []) : [];

        final imageUrl = urlList.isNotEmpty ? urlList[0].toString() : "";

        final isValidNetworkUrl =
            imageUrl.startsWith("http://") || imageUrl.startsWith("https://");

        // ✅ Skip invalid urls (undefined/file:///)
        if (imageUrl.isEmpty || !isValidNetworkUrl) {
          return const SizedBox();
        }

        final liked = likedPosts.contains(post["id"]);

        return Column(
          children: [
            Container(
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: EdgeInsets.only(left: 4, top: 4, bottom: 4),
                      child: Text(
                        post["user"]["userName"],
                        style: TextStyle(
                            color: const Color.fromARGB(255, 109, 109, 109)),
                      ),
                      decoration: BoxDecoration(
                          color: const Color.fromARGB(255, 210, 255, 249),
                          borderRadius: BorderRadius.only(
                              topLeft: Radius.circular(12),
                              topRight: Radius.circular(12))),
                    ),
                    flex: 4,
                  ),
                  Expanded(
                    child: SizedBox(),
                    flex: 6,
                  ),
                ],
              ),
            ),
            Card(
              child: SizedBox(
                height: 320, // ✅ change as you want
                width: double.infinity,
                child: Image.network(
                  imageUrl,
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return const Center(child: CircularProgressIndicator());
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return const Center(child: Text("Image failed to load"));
                  },
                ),
              ),
            ),

            // ✅ Actions Row
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Expanded(
                  flex: 9,
                  child: Row(
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: Row(
                          children: [
                            InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        ShowAllComments(post: post),
                                  ),
                                );
                              },
                              child: const Icon(
                                Icons.comment,
                                size: 20,
                                color: Color(0xFF200E32),
                              ),
                            ),
                            const SizedBox(width: 3),
                            Text(
                              commentCount.toString(),
                              style: const TextStyle(
                                color: Color(0xFF200E32),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      InkWell(
                        onTap: () {},
                        child: const Icon(
                          Icons.share,
                          size: 20,
                          color: Color(0xFF200E32),
                        ),
                      ),
                    ],
                  ),
                ),

                // ✅ Like button
                Expanded(
                  flex: 1,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      GestureDetector(
                        onTap: () async {
                          String? token =
                              await secureStorage.read(key: "jwt_token");
                          String postId = post["id"];
                          final res = await http.patch(
                            Uri.parse(Config.buildApiUrl(
                                '/posts/like-or-unlike/$postId')),
                            headers: {
                              "Authorization": "Bearer $token",
                            },
                          );

                          final decodedData = jsonDecode(res.body);
                          setState(() {
                            if (decodedData["message"] == "Unliked") {
                              likedPosts.remove(post["id"]);
                            } else if (decodedData["message"] == "Liked") {
                              likedPosts.add(post["id"]);
                            }
                          });
                        },
                        child: Image.asset(
                          liked
                              ? "assets/icons/HeartLiked.png"
                              : "assets/icons/HeartUnliked.png",
                          width: 20,
                          height: 20,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),
          ],
        );
      },
    ));
  }
}
