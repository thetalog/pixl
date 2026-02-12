import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:pixl/core/config/config.dart';
import 'package:flutter/foundation.dart';

import 'tag_user.dart';

final logger = Logger();

class EditPostSheet extends StatefulWidget {
  const EditPostSheet({
    Key? key,
    required this.post,
    required this.onUpdated,
  }) : super(key: key);

  final Map<String, dynamic> post;
  final VoidCallback onUpdated;

  @override
  State<EditPostSheet> createState() => _EditPostSheetState();
}

class _EditPostSheetState extends State<EditPostSheet> {
  final _captionCtrl = TextEditingController();
  final _tagsCtrl = TextEditingController();

  final _secureStorage = const FlutterSecureStorage();

  bool _loading = false;

  // Existing tagged users from post
  List<String> _taggedUsers = [];

  // Tracks if user actually touched TagUser
  bool _tagUserModified = false;

  @override
  void initState() {
    super.initState();

    _captionCtrl.text = widget.post["caption"] ?? "";
    _tagsCtrl.text = (widget.post["userTags"] ?? []).join(", ");
    _taggedUsers = List<String>.from(widget.post["taggedUsers"] ?? []);
  }

  Future<void> _submit() async {
    if (_loading) return;

    try {
      setState(() => _loading = true);

      final token = await _secureStorage.read(key: 'jwt_token');
      if (token == null) {
        logger.e("❌ JWT token not found");
        return;
      }
      final Map<String, dynamic> body = {};

      // Caption
      if (_captionCtrl.text != widget.post["caption"]) {
        body["caption"] = _captionCtrl.text.trim();
      }

      // Tags
      final userTags = _tagsCtrl.text
          .split(",")
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();

      if (!listEquals(userTags, widget.post["userTags"] ?? [])) {
        body["userTags"] = userTags;
      }

      // Tagged users (ONLY if TagUser was modified)
      if (_tagUserModified &&
          !listEquals(_taggedUsers, widget.post["taggedUsers"] ?? [])) {
        body["taggedUsers"] = _taggedUsers;
      }

      if (body.isEmpty) {
        Navigator.pop(context);
        return;
      }

      final url = Config.buildApiUrl("/posts/${widget.post["id"]}");

      final res = await http.patch(
        Uri.parse(url),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
        },
        body: jsonEncode(body),
      );

      logger.i("Edit post response: ${res.statusCode}");

      if (res.statusCode != 200) {
        throw Exception(res.body);
      }

      widget.onUpdated();
      Navigator.pop(context);
    } catch (e) {
      logger.e("Edit post error: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to update post")),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _captionCtrl.dispose();
    _tagsCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Edit Post",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),

          const SizedBox(height: 12),

          TextField(
            controller: _captionCtrl,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: "Caption",
              border: OutlineInputBorder(),
            ),
          ),

          const SizedBox(height: 12),

          TextField(
            controller: _tagsCtrl,
            decoration: const InputDecoration(
              labelText: "Tags (comma separated)",
              border: OutlineInputBorder(),
            ),
          ),

          const SizedBox(height: 12),

          // Show existing tagged users (since TagUser can't preload)
          if (_taggedUsers.isNotEmpty)
            Wrap(
              spacing: 6,
              children: _taggedUsers.map((u) => Chip(label: Text(u))).toList(),
            ),

          const SizedBox(height: 8),

          // Existing TagUser widget (unchanged)
          TagUser(
            onUsersSelected: (users) {
              _tagUserModified = true;
              _taggedUsers = users;
            },
          ),

          const SizedBox(height: 20),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text("Save changes"),
            ),
          ),
        ],
      ),
    );
  }
}
