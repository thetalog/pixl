import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:pixl/features/post/tag_user.dart';
import 'package:pixl/core/config/config.dart';
import 'package:logger/logger.dart';

final logger = Logger();

final FlutterSecureStorage secureStorage = FlutterSecureStorage();

class CreatePost extends StatefulWidget {
  const CreatePost({super.key});

  @override
  State<CreatePost> createState() => _CreatePostState();
}

class _CreatePostState extends State<CreatePost> {
  final ImagePicker _picker = ImagePicker();
  XFile? _selectedImage;
  final TextEditingController _captionController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _tagsController = TextEditingController();
  List<String> _taggedUsers = [];

  Future<void> pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);

      if (image != null) {
        setState(() {
          _selectedImage = image;
        });
        print("Picked Image: ${image.path}");
      } else {
        print("Canceled");
      }
    } catch (e) {
      print("Image Picker Error: $e");
    }
  }

  Future<void> postButtonListener() async {
    if (_selectedImage == null) return;

    final request = http.MultipartRequest(
      "POST",
      Uri.parse(Config.buildApiUrl('/posts/create-post')),
    );
    String? token = await secureStorage.read(key: "jwt_token");
    if (token == null) {
      logger.e("❌ JWT token not found");
      return;
    }
    request.headers["Authorization"] = "Bearer $token"; // keep token here

    // Add form fields
    request.fields["caption"] = _captionController.text;
    request.fields["location"] = _locationController.text;

    // Parse tags from comma-separated string
    final List<String> tags = _tagsController.text
        .split(',')
        .map((tag) => tag.trim())
        .where((tag) => tag.isNotEmpty)
        .toList();
    request.fields["tags"] = jsonEncode(tags);

    // Send tagged usernames
    request.fields["taggedUsers"] = jsonEncode(_taggedUsers);

    // send the image file
    request.files.add(
      await http.MultipartFile.fromPath(
        "file", // must match backend field name
        _selectedImage!.path,
      ),
    );

    final streamedRes = await request.send();
    final res = await http.Response.fromStream(streamedRes);

    print("Response: ${res.statusCode}");
    print(jsonDecode(res.body));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: SafeArea(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            children: [
              Container(
                color: Colors.grey[200],
                padding: const EdgeInsets.all(20),
                child: Center(
                  child: Text(
                    "Create Post",
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: pickImage,
                child: const Text("Pick Image"),
              ),
              const SizedBox(height: 20),
              (_selectedImage != null)
                  ? ElevatedButton(
                      onPressed: postButtonListener,
                      child: Text("POST"),
                    )
                  : Container(),
              const SizedBox(height: 20),
              if (_selectedImage != null)
                ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    child: Text("Cancel")),
              const SizedBox(height: 20),
              if (_selectedImage != null)
                Column(
                  children: [
                    TextField(
                      controller: _captionController,
                      decoration: InputDecoration(
                        hintText: "Write a caption...",
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: _locationController,
                      decoration: InputDecoration(
                        hintText: "Location (optional)",
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 1,
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: _tagsController,
                      decoration: InputDecoration(
                        hintText: "Tags (comma separated)",
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 1,
                    ),
                    const SizedBox(height: 20),
                    TagUser(onUsersSelected: (users) {
                      setState(() {
                        _taggedUsers = users;
                      });
                    }),
                    const SizedBox(height: 20),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(
                        File(_selectedImage!.path),
                        height: 250,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                )
              else
                const Text("No image selected"),
            ],
          ),
        ),
      ),
    ));
  }
}
