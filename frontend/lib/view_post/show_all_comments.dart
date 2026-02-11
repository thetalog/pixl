import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:toast/toast.dart';
import "package:http/http.dart" as http;
import 'package:logger/logger.dart';
import 'package:pixl/config.dart';

final log = Logger();

class ShowAllComments extends StatefulWidget {
  const ShowAllComments({super.key, required this.post});
  final Map<String, dynamic> post;

  @override
  State<ShowAllComments> createState() => _ShowAllCommentsState();
}

class _ShowAllCommentsState extends State<ShowAllComments> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController commentController = TextEditingController();

  List<dynamic> comments = [];
  bool isLoadingMore = false;
  int currentSkipLower = 0;
  Future<void> fetchAllComments({bool loadMore = false}) async {
    final postId = widget.post["id"].toString();

    final uri = Uri.parse(
      Config.buildApiUrl(
          "/posts/comments?postId=$postId&skip=${currentSkipLower.toString()}&take=20"),
    );

    final res = await http.get(uri, headers: {
      "Authorization":
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Ikplc3NpY2ExQGV4YW1wbGUuY29tIiwibmFtZSI6Ikplc3NpY2ExIiwidXNlck5hbWUiOiJKZXNzaWNhMSIsImV4cCI6MTc3MjAzODE1MiwiaWF0IjoxNzY5NDQ2MTUyfQ.cHw-TLLuBrsJiGVhEGBtGqqBuAxF0FePG8sxY7g-big",
    });

    final decodedData = jsonDecode(res.body);
    final newComments = decodedData["data"] ?? [];

    log.i(const JsonEncoder.withIndent("  ").convert(decodedData));

    setState(() {
      if (loadMore) {
        comments.addAll(newComments);
      } else {
        comments = newComments;
      }
    });
  }

  @override
  void initState() {
    super.initState();

    // ✅ Load first time from API
    fetchAllComments();

    _scrollController.addListener(() async {
      if (_scrollController.position.pixels >=
          _scrollController.position.maxScrollExtent) {
        if (isLoadingMore) return;

        setState(() => isLoadingMore = true);

        currentSkipLower += 20;
        await fetchAllComments(loadMore: true);

        setState(() => isLoadingMore = false);
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ToastContext().init(context);

    return Scaffold(
      appBar: AppBar(title: const Text("All Comments")),
      body: Column(
        children: [
          // ✅ Input box
          Padding(
            padding: const EdgeInsets.all(10),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: commentController,
                    decoration: const InputDecoration(
                      hintText: "Write a comment...",
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () async {
                    final postId = widget.post["id"];

                    final res = await http.post(
                      Uri.parse(Config.buildApiUrl('/posts/$postId/comment')),
                      headers: {
                        "Authorization":
                            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Ikplc3NpY2ExQGV4YW1wbGUuY29tIiwibmFtZSI6Ikplc3NpY2ExIiwidXNlck5hbWUiOiJKZXNzaWNhMSIsImV4cCI6MTc3MjAzODE1MiwiaWF0IjoxNzY5NDQ2MTUyfQ.cHw-TLLuBrsJiGVhEGBtGqqBuAxF0FePG8sxY7g-big",
                      },
                      body: {"commentText": commentController.text},
                    );

                    final decodedData = jsonDecode(res.body);
                    final message = decodedData["message"] ?? "Done";

                    commentController.clear();
                    await fetchAllComments(); // ✅ refresh list
                    Toast.show(message);
                  },
                  child: const Text("Submit"),
                ),
              ],
            ),
          ),

          // ✅ Comments List
          Expanded(
            child: comments.isEmpty
                ? const Center(child: Text("No comments yet"))
                : ListView.builder(
                    controller: _scrollController,
                    itemCount: comments.length + 1,
                    itemBuilder: (context, index) {
                      // ✅ bottom loader
                      if (index == comments.length) {
                        return isLoadingMore
                            ? const Padding(
                                padding: EdgeInsets.all(16),
                                child:
                                    Center(child: CircularProgressIndicator()),
                              )
                            : const SizedBox();
                      }

                      final comment = comments[index];
                      final text = comment["text"]?.toString() ?? "";
                      final profilePic =
                          comment["user"]?["profilePic"]?.toString() ?? "";

                      return ListTile(
                        title: Text("$index + text"),
                        leading: CircleAvatar(
                          backgroundImage: profilePic.isNotEmpty
                              ? NetworkImage(profilePic)
                              : null,
                          child: profilePic.isEmpty
                              ? const Icon(Icons.person)
                              : null,
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
