import 'package:flutter/material.dart';
import 'package:toast/toast.dart';
import "package:http/http.dart" as http;
import "dart:convert";
import "package:logger/logger.dart";
import 'package:pixl/config.dart';

final logger = Logger();

class ShowAllComments extends StatefulWidget {
  const ShowAllComments({super.key, required this.post});
  final Map<String, dynamic> post;
  @override
  State<ShowAllComments> createState() => _ShowAllCommentsState();
}

class _ShowAllCommentsState extends State<ShowAllComments> {
  late List<dynamic> comments;
  TextEditingController commentController = TextEditingController();
  int skip = 0;
  int take = 20;
  dynamic data = [];
  int countRefreshWidgets = 0;
  bool isLoading = false;
  bool noMoreData = false;
  void fetchAllComments() async {
    if (isLoading || noMoreData) return;

    isLoading = true;

    final postId = widget.post["id"];
    skip = data.length;

    final res = await http.get(
      Uri.parse(
        Config.buildApiUrl('/posts/comments?reelId=$postId&skip=$skip&take=$take'),
      ),
      headers: {
        "Authorization":
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Ikplc3NpY2ExQGV4YW1wbGUuY29tIiwibmFtZSI6Ikplc3NpY2ExIiwidXNlck5hbWUiOiJKZXNzaWNhMSIsImV4cCI6MTc3MjM1NjE1NywiaWF0IjoxNzY5NzY0MTU3fQ.GpGYQ-Ry0strJFklpUjgexEyPfhUGDp09mUUc9lYe6A",
      },
    );

    final decodedData = jsonDecode(res.body);
    final List newComments = decodedData["data"] ?? [];

    setState(() {
      data.addAll(newComments);
    });

    // If fewer than requested returned → no more data
    if (newComments.length < take) {
      noMoreData = true;
    }

    isLoading = false;
  }

  @override
  void initState() {
    super.initState();
    fetchAllComments();
  }

  @override
  Widget build(BuildContext context) {
    ToastContext().init(context);

    return Scaffold(
      appBar: AppBar(title: const Text("All Comments")),
      body: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: commentController,
                  decoration: const InputDecoration(
                    hintText: "Write a comment...",
                  ),
                ),
              ),
              ElevatedButton(
                onPressed: () async {
                  final postId = widget.post["id"];
                  final res = await http.post(
                      Uri.parse(
                          Config.buildApiUrl('/posts/$postId/comment')),
                      headers: {
                        "Authorization":
                            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Ikplc3NpY2ExQGV4YW1wbGUuY29tIiwibmFtZSI6Ikplc3NpY2ExIiwidXNlck5hbWUiOiJKZXNzaWNhMSIsImV4cCI6MTc3MjAwNjM3MiwiaWF0IjoxNzY5NDE0MzcyfQ._66M3Q2slqBuxBwVm6C1l2s583Q_itfVcsc3Cp89YvQ",
                      },
                      body: {
                        "commentText": commentController.text
                      });

                  final decodedData = jsonDecode(res.body);
                  final String message = decodedData["message"] ?? [];
                  setState(() {
                    fetchAllComments();
                    ++countRefreshWidgets;
                    commentController.text = "";
                  });
                  Toast.show(message);
                },
                child: const Text("Submit"),
              )
            ],
          ),

          const SizedBox(height: 10),

          // ✅ IMPORTANT FIX
          Expanded(
            child: NotificationListener<ScrollNotification>(
              onNotification: (scrollInfo) {
                if (!isLoading &&
                    !noMoreData &&
                    scrollInfo.metrics.pixels >=
                        scrollInfo.metrics.maxScrollExtent - 200) {
                  fetchAllComments();
                }
                return false;
              },
              child: ListView.builder(
                itemCount: data.length,
                itemBuilder: (context, index) {
                  final comment = data[index];
                  final text = comment["text"] ?? "";
                  final profilePic = comment["user"]?["profilePic"] ?? "";

                  return ListTile(
                    title: Text("$index + $text"),
                    leading: CircleAvatar(
                      backgroundImage: profilePic.isNotEmpty
                          ? NetworkImage(profilePic)
                          : null,
                      child:
                          profilePic.isEmpty ? const Icon(Icons.person) : null,
                    ),
                  );
                },
              ),
            ),
          )
        ],
      ),
    );
  }
}
