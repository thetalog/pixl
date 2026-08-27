import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
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

  List<XFile> _selectedImages = [];

  final TextEditingController _captionController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _tagsController = TextEditingController();

  List<String> _taggedUsers = [];

  /// 📸 Pick multiple images (max 5)
  Future<void> pickImage() async {
    try {
      final images = await _picker.pickMultiImage();

      if (images.isNotEmpty) {
        if (images.length > 5) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Maximum 5 images allowed")),
          );
          return;
        }

        setState(() {
          _selectedImages = images;
        });
      }
    } catch (e) {
      logger.e("Picker error: $e");
    }
  }

  /// 🚀 Submit post
  Future<void> postButtonListener() async {
    if (_selectedImages.isEmpty) return;

    final request = http.MultipartRequest(
      "POST",
      Uri.parse(Config.buildApiUrl('/posts/create-post')),
    );

    final token = await secureStorage.read(key: "jwt_token");
    if (token == null) {
      logger.e("JWT token missing");
      return;
    }

    request.headers["Authorization"] = "Bearer $token";

    request.fields["caption"] = _captionController.text;
    request.fields["location"] = _locationController.text;

    final tags = _tagsController.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();

    request.fields["tags"] = jsonEncode(tags);
    request.fields["taggedUsers"] = jsonEncode(_taggedUsers);

    logger.i(
      'Uploading ${_selectedImages.length} image(s) to ${request.url} as field "file"',
    );

    /// Upload ALL images
    for (final image in _selectedImages) {
      request.files.add(
        await http.MultipartFile.fromPath(
          "file",
          image.path,
        ),
      );
    }

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);

    logger.i("Response: ${response.statusCode}");
    logger.i(response.body);

    if (!mounted) return;

    if (response.statusCode == 200 || response.statusCode == 201) {
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Upload failed")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Expanded(child: Text("Create Post")),
            SizedBox(
              width: 40,
              height: 40,
              child: ElevatedButton(
                onPressed: pickImage,
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.zero,
                  backgroundColor: const Color(0xFF4F7CAC),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                child: const Icon(Icons.add, color: Colors.white),
              ),
            )
          ],
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            children: [
              const SizedBox(height: 10),
              if (_selectedImages.isNotEmpty)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: postButtonListener,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3E62FF),
                      ),
                      child: const Text("POST",
                          style: TextStyle(color: Colors.white)),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text("Cancel"),
                    ),
                  ],
                ),
              const SizedBox(height: 10),
              if (_selectedImages.isNotEmpty)
                Column(
                  children: [
                    /// Image preview
                    SizedBox(
                      height: 250,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _selectedImages.length,
                        itemBuilder: (context, index) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(
                                File(_selectedImages[index].path),
                                width: 200,
                                fit: BoxFit.cover,
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 8),
                    Text("${_selectedImages.length}/5 selected"),

                    const SizedBox(height: 16),

                    Padding(
                      padding: const EdgeInsets.all(4),
                      child: TextField(
                        controller: _captionController,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: 'Caption',
                          prefixIcon: Icon(Icons.comment),
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.all(4),
                      child: TextField(
                        controller: _locationController,
                        decoration: const InputDecoration(
                          labelText: 'Location',
                          prefixIcon: Icon(Icons.location_on),
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.all(4),
                      child: TextField(
                        controller: _tagsController,
                        decoration: const InputDecoration(
                          labelText: 'Tags (comma separated)',
                          prefixIcon: Icon(Icons.tag),
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.all(4),
                      child: TagUser(
                        onUsersSelected: (users) {
                          setState(() {
                            _taggedUsers = users;
                          });
                        },
                      ),
                    ),
                  ],
                )
              else
                const Padding(
                  padding: EdgeInsets.only(top: 50),
                  child: Text("No image selected"),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
