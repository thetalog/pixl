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
        appBar: AppBar(
            title: Row(
          children: [
            const Expanded(flex: 2, child: Text("Create Post")),
            SizedBox(
              width: 40,
              height: 40,
              child: ElevatedButton(
                onPressed: pickImage,
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.zero, // 🔥 removes default padding
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(4),
                  ),
                  backgroundColor: const Color(0xFF4F7CAC),
                ),
                child: const Center(
                  child: Text(
                    "+",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            )
          ],
        )),
        body: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      (_selectedImage != null)
                          ? ElevatedButton(
                              onPressed: postButtonListener,
                              child: Text("POST",
                                  style: TextStyle(color: Colors.white)),
                              style: ButtonStyle(
                                backgroundColor: WidgetStateProperty.all(
                                    const Color(0xFF3E62FF)),
                                shape: WidgetStateProperty.all(
                                  RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                              ),
                            )
                          : Container(),
                      SizedBox(width: 10),
                      if (_selectedImage != null)
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                          },
                          child: Text(
                            "Cancel",
                            style: TextStyle(color: Colors.white),
                          ),
                          style: ButtonStyle(
                            backgroundColor:
                                WidgetStateProperty.all(const Color(0xF4F7CAC)),
                            shape: WidgetStateProperty.all(
                              RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  if (_selectedImage != null)
                    Column(
                      children: [
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
                        Padding(
                            padding: EdgeInsetsGeometry.all(4),
                            child: TextField(
                              controller: _captionController,
                              maxLines: 3,
                              decoration: InputDecoration(
                                labelText: 'Caption',
                                hint: Text("Write a caption..."),
                                prefixIcon: const Icon(Icons.comment),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            )),
                        Padding(
                          padding: EdgeInsetsGeometry.all(4),
                          child: TextField(
                            controller: _locationController,
                            maxLines: 1,
                            decoration: InputDecoration(
                              labelText: 'Location',
                              hint: Text("Location (optional)"),
                              prefixIcon: const Icon(Icons.location_on),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: EdgeInsetsGeometry.all(4),
                          child: TextField(
                            controller: _tagsController,
                            decoration: InputDecoration(
                              labelText: 'Tags',
                              hint: Text("Tags (comma separated)"),
                              prefixIcon: const Icon(Icons.tag),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            maxLines: 1,
                          ),
                        ),
                        Padding(
                          padding: EdgeInsetsGeometry.all(4),
                          child: TagUser(onUsersSelected: (users) {
                            setState(() {
                              _taggedUsers = users;
                            });
                          }),
                        ),
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
