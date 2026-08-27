import 'package:flutter/material.dart';

class PostScreen extends StatelessWidget {
  final String postId;
  final String? ref;

  const PostScreen({
    super.key,
    required this.postId,
    this.ref,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Post")),
      body: Center(
        child: Text("PostId: $postId\nRef: $ref"),
      ),
    );
  }
}
