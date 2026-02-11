import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'comments_preview.dart';
import 'show_all_comments.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:video_player/video_player.dart';
import 'media_carousel.dart';
import 'package:logger/logger.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:pixl/config.dart';
import './edit_post_sheet.dart';

final logger = Logger();

class ViewPost extends StatefulWidget {
  ViewPost({Key? key, this.post, this.byShareId, required this.canEdit})
      : super(key: key);
  final String? byShareId;
  Map<String, dynamic>? post;
  final bool canEdit;

  @override
  State<ViewPost> createState() => _ViewPostState();
}

class _ViewPostState extends State<ViewPost> {
  bool isLiked = false;
  int commentLengthCount = 0;
  late VideoPlayerController _controller;
  late final PageController _pageController = PageController(initialPage: 0);
  final _secureStorage = const FlutterSecureStorage();

  Future<void> _loadData() async {
    try {
      logger.i(
          "_loadData called - byShareId: ${widget.byShareId}, post id: ${widget.post?["id"]}");

      final postId = (widget.byShareId != null && widget.byShareId!.isNotEmpty)
          ? widget.byShareId
          : widget.post?["id"]?.toString();

      if (postId == null || postId.isEmpty) {
        logger.e(
            "No postId or byShareId provided - byShareId: ${widget.byShareId}, post: ${widget.post}");
        return;
      }

      logger.i("Fetching post with ID: $postId");

      final String apiUrl =
          Config.buildApiUrl('/posts/get-single-public-posts');
      final token = await _secureStorage.read(key: 'jwt_token');

      if (token == null) {
        throw Exception("No JWT token found");
      }

      final res = await http.get(
        Uri.parse(apiUrl).replace(
            queryParameters: {"postId": widget.post?["id"]?.toString()}),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
        },
      );

      logger.i("Response status: ${res.statusCode}");

      if (res.statusCode != 200) {
        throw Exception("Failed: ${res.statusCode} | ${res.body}");
      }

      final jsonData = jsonDecode(res.body);
      logger.i("Fresh post data loaded: ${jsonData}");
      setState(() {
        widget.post = jsonData["data"];
      });
    } catch (e) {
      logger.e("Error loading post data: $e");
    }
  }

  @override
  void initState() {
    super.initState();
    _loadData();
    // _controller = VideoPlayerController.networkUrl(
    //   Uri.parse(
    //     'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4',
    //   ),
    // )..initialize().then((_) {
    //     // Ensure the first frame is shown after the video is initialized, even before the play button has been pressed.
    //     setState(() {});
    //   });
  }

  @override
  void dispose() {
    _pageController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final comments = widget.post?["comments"] ?? [];

    return Scaffold(
        appBar: AppBar(
          title: const Text('View Post'),
        ),
        body: Column(children: [
          Container(
            width: double.infinity,
            height: 500,
            child: widget.post == null
                ? const Center(child: CircularProgressIndicator())
                : MediaCarousel(
                    media: widget.post!["media"],
                    controller: _pageController,
                  ),
          ),
          Container(
              width: double.infinity,
              height: 40,
              alignment: Alignment.center,
              padding: EdgeInsets.symmetric(horizontal: 2),
              color: const Color(0xFFF8F8F8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Expanded(
                    flex: 9,
                    child: Flex(direction: Axis.horizontal, children: [
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: Row(
                          children: [
                            InkWell(
                              onTap: () {
                                Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => ShowAllComments(
                                          post: widget.post ?? {}),
                                    ));
                              },
                              child: const Icon(Icons.comment,
                                  size: 20, color: Color(0xFF200E32)),
                            ),
                            const SizedBox(width: 3),
                            Text(
                              comments.isEmpty
                                  ? "No Comments yet"
                                  : comments.length.toString(),
                              style: const TextStyle(
                                color: Color(0xFF200E32),
                                fontWeight: FontWeight.w500,
                              ),
                            )
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      InkWell(
                        onTap: () {},
                        child: const Icon(Icons.share,
                            size: 20, color: Color(0xFF200E32)),
                      ),
                      if (widget.canEdit)
                        IconButton(
                          icon: const Icon(Icons.edit, size: 20),
                          onPressed: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.vertical(
                                    top: Radius.circular(16)),
                              ),
                              builder: (_) => EditPostSheet(
                                post: widget.post!,
                                onUpdated: _loadData,
                              ),
                            );
                          },
                        ),
                    ]),
                  ),
                  Expanded(
                    flex: 1,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center, // ✅ right
                      children: [
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              isLiked = !isLiked;
                            });
                          },
                          child: Image.asset(
                              isLiked
                                  ? "assets/icons/HeartLiked.png"
                                  : "assets/icons/HeartUnliked.png",
                              width: 20,
                              height: 20),
                        )
                      ],
                    ),
                  ),
                ],
              )),
          Container(
              decoration: BoxDecoration(
            border: Border(
                bottom: BorderSide(
                    color: const Color.fromARGB(232, 240, 240, 240), width: 1)),
          )),
          CommentsPreview(comments: widget.post?["comments"] ?? [])
        ]));
  }
}
