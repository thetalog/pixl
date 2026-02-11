import 'package:flutter/material.dart';
import 'package:toast/toast.dart';
import "package:http/http.dart" as http;
import "dart:convert";
import 'package:pixl/config.dart';

class ShowAllComments extends StatefulWidget {
  const ShowAllComments({super.key, required this.post});

  final Map<String, dynamic> post;

  @override
  State<ShowAllComments> createState() => _ShowAllCommentsState();
}

class _ShowAllCommentsState extends State<ShowAllComments> {
  late List<dynamic> comments;
  TextEditingController commentController = TextEditingController();
  dynamic data = [];
  int countRefreshWidgets = 0;
  void fetchAllComments() async {
    final postId = widget.post["id"];
    final res = await http.get(
      Uri.parse(Config.buildApiUrl('/posts/$postId/comments')),
      headers: {
        "Authorization":
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Ikplc3NpY2ExQGV4YW1wbGUuY29tIiwibmFtZSI6Ikplc3NpY2ExIiwidXNlck5hbWUiOiJKZXNzaWNhMSIsImV4cCI6MTc3MjAwNjM3MiwiaWF0IjoxNzY5NDE0MzcyfQ._66M3Q2slqBuxBwVm6C1l2s583Q_itfVcsc3Cp89YvQ",
      },
    );

    final decodedData = jsonDecode(res.body);
    setState(() {
      data = decodedData["data"] ?? [];
    });
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
                          Config.buildApiUrl('/posts/$postId/comment?reelId=$postId')),
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
            child: data?.isEmpty
                ? const Center(child: Text("No comments yet"))
                : ListView.builder(
                    itemCount: data.length,
                    itemBuilder: (context, index) {
                      final comment = data[index];
                      final text = comment["text"]?.toString() ?? "";
                      final profilePic =
                          comment["user"]?["profilePic"]?.toString() ?? "";

                      return ListTile(
                        title: Text(text),
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
