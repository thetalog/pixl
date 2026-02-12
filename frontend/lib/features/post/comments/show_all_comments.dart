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
  late List<dynamic> comments;
  TextEditingController commentController = TextEditingController();
  dynamic data = [];
  int countRefreshWidgets = 0;
  void fetchAllComments() async {
    final postId = widget.post["id"];
    String? token = await secureStorage.read(key: "jwt_token");
    if (token == null) {
      logger.e("❌ JWT token not found");
      return;
    }
    final res = await http.get(
      Uri.parse(Config.buildApiUrl('/posts/$postId/comments')),
      headers: {
        "Authorization": "Bearer $token",
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
                  String? token = await secureStorage.read(key: "jwt_token");
                  final res = await http.post(
                      Uri.parse(Config.buildApiUrl(
                          '/posts/$postId/comment?reelId=$postId')),
                      headers: {
                        "Authorization": "Bearer $token",
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
