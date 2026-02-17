import 'package:flutter/material.dart';
import 'package:toast/toast.dart';
import "package:http/http.dart" as http;
import "dart:convert";
import 'package:pixl/core/config/config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

final logger = Logger();
final FlutterSecureStorage secureStorage = FlutterSecureStorage();

class ShowAllComments extends StatefulWidget {
  const ShowAllComments({super.key, required this.post});

  final Map<String, dynamic> post;

  @override
  State<ShowAllComments> createState() => _ShowAllCommentsState();
}

class _ShowAllCommentsState extends State<ShowAllComments> {
  final TextEditingController commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<dynamic> data = [];
  bool _loading = true;
  bool _submitting = false;
  bool _didChange = false;

  bool get _isReelContext {
    // ReelScreen passes reel maps that include these keys.
    return widget.post.containsKey("mimeType") ||
        widget.post.containsKey("mediaUrl") ||
        widget.post.containsKey("videoPath") ||
        widget.post["type"]?.toString().toUpperCase() == "REEL";
  }

  List<dynamic> _extractComments(dynamic decoded) {
    if (decoded is List) return decoded;

    if (decoded is Map) {
      dynamic root = decoded["data"] ?? decoded["comments"];
      if (root is List) return root;
      if (root is Map) {
        dynamic inner = root["data"] ?? root["comments"] ?? root["items"];
        if (inner is List) return inner;
      }
    }

    return const [];
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> fetchAllComments({
    bool scrollToBottom = false,
    bool cacheBust = false,
  }) async {
    final postId = widget.post["id"];
    String? token = await secureStorage.read(key: "jwt_token");
    if (token == null) {
      logger.e("❌ JWT token not found");
      if (!mounted) return;
      setState(() => _loading = false);
      return;
    }

    try {
      final basePath =
          _isReelContext ? "/posts/reel-comments" : "/posts/comments";
      Uri uri = Uri.parse(Config.buildApiUrl(basePath));

      final qp = <String, String>{
        "skip": "0",
        "take": "50",
        if (cacheBust) "t": DateTime.now().millisecondsSinceEpoch.toString(),
      };

      if (_isReelContext) {
        qp["reelId"] = postId.toString();
      } else {
        qp["postId"] = postId.toString();
      }

      uri = uri.replace(queryParameters: qp);

      final res = await http.get(
        uri,
        headers: {
          "Authorization": "Bearer $token",
        },
      );

      if (res.statusCode != 200) {
        logger.e("❌ Fetch comments failed: ${res.statusCode} ${res.body}");
        if (!mounted) return;
        setState(() => _loading = false);
        return;
      }

      final decodedData = jsonDecode(res.body);
      final next = _extractComments(decodedData);

      if (!mounted) return;
      setState(() {
        data = next;
        _loading = false;
      });

      if (scrollToBottom) {
        _scrollToBottom();
      }
    } catch (e) {
      logger.e("❌ Fetch comments error: $e");
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _submitComment() async {
    if (_submitting) return;
    final text = commentController.text.trim();
    if (text.isEmpty) {
      Toast.show("Comment can't be empty");
      return;
    }

    final postId = widget.post["id"];
    final String? token = await secureStorage.read(key: "jwt_token");
    if (token == null) {
      logger.e("❌ JWT token not found");
      Toast.show("Please login again");
      return;
    }

    setState(() => _submitting = true);
    try {
      final String endpointPath = _isReelContext
          ? "/posts/$postId/reel-comment"
          : "/posts/$postId/comment";

      final res = await http.post(
        Uri.parse(Config.buildApiUrl(endpointPath)),
        headers: {
          "Authorization": "Bearer $token",
        },
        body: {
          "commentText": text,
        },
      );

      final decodedData = jsonDecode(res.body);
      final String message =
          (decodedData is Map ? decodedData["message"] : null)?.toString() ??
              (res.statusCode == 200 ? "Comment added" : "Comment failed");

      if (res.statusCode == 200) {
        _didChange = true;

        // Optimistic UI update (so the user immediately sees the comment)
        setState(() {
          data = [
            ...data,
            {
              "text": text,
              "user": {
                "userName": "You",
                "profilePic": "",
              },
              "_optimistic": true,
            }
          ];
        });
        _scrollToBottom();

        commentController.clear();

        // Re-fetch with cache-busting + small retries (backend can be eventually consistent)
        for (int i = 0; i < 3; i++) {
          await fetchAllComments(scrollToBottom: true, cacheBust: true);
          final bool found = data.isNotEmpty &&
              (data.last["text"]?.toString() == text ||
                  data.any((c) => c is Map && c["text"]?.toString() == text));
          if (found) break;
          await Future.delayed(const Duration(milliseconds: 300));
        }
      }

      Toast.show(message);
    } catch (e) {
      logger.e("❌ Send comment error: $e");
      Toast.show("Comment failed");
    } finally {
      if (!mounted) return;
      setState(() => _submitting = false);
    }
  }

  @override
  void initState() {
    super.initState();
    fetchAllComments();
  }

  @override
  Widget build(BuildContext context) {
    ToastContext().init(context);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        Navigator.of(context).pop(_didChange);
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text("All Comments"),
          leading: BackButton(
            onPressed: () {
              Navigator.of(context).pop(_didChange);
            },
          ),
        ),
        body: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: commentController,
                        minLines: 1,
                        maxLines: 4,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _submitComment(),
                        decoration: InputDecoration(
                          hintText: "Write a comment...",
                          isDense: true,
                          border: const OutlineInputBorder(),
                          enabled: !_submitting,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    IconButton.filled(
                      onPressed: _submitting ? null : _submitComment,
                      icon: _submitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.send),
                      tooltip: "Send",
                    ),
                  ],
                ),
              ),
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : data.isEmpty
                        ? const Center(child: Text("No comments yet"))
                        : ListView.separated(
                            controller: _scrollController,
                            itemCount: data.length,
                            separatorBuilder: (_, __) =>
                                const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final comment = data[index];
                              final text = comment["text"]?.toString() ?? "";
                              final profilePic =
                                  comment["user"]?["profilePic"]?.toString() ??
                                      "";
                              final userName =
                                  comment["user"]?["userName"]?.toString() ??
                                      "";

                              return ListTile(
                                leading: CircleAvatar(
                                  backgroundImage: profilePic.isNotEmpty
                                      ? NetworkImage(profilePic)
                                      : null,
                                  child: profilePic.isEmpty
                                      ? const Icon(Icons.person)
                                      : null,
                                ),
                                title: Text(
                                  userName.isEmpty ? "Comment" : userName,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleSmall
                                      ?.copyWith(fontWeight: FontWeight.w600),
                                ),
                                subtitle: Text(text),
                              );
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
