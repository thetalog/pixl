import 'dart:typed_data';

import 'package:http_parser/http_parser.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:widgets_to_image/widgets_to_image.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:image/image.dart' as img;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:pixl/core/config/config.dart';

const _secureStorage = FlutterSecureStorage();

final actionProvider = Provider<ActionNotifier>((ref) {
  final controller = WidgetsToImageController();
  return ActionNotifier(controller);
});

class ActionNotifier {
  final WidgetsToImageController controller;

  ActionNotifier(this.controller);
  Future<bool> _requestGalleryPermission() async {
    final PermissionState ps = await PhotoManager.requestPermissionExtend();

    if (ps.isAuth) {
      return true;
    }

    if (ps.hasAccess) {
      // Limited access (still OK for saving)
      return true;
    }

    // ❌ Permanently denied or restricted
    await PhotoManager.openSetting();
    return false;
  }

  Future<void> captureAndSave() async {
    final hasPermission = await _requestGalleryPermission();
    if (!hasPermission) {
      print("❌ Gallery permission denied");
      return;
    }

    final Uint8List? bytes = await controller.capture();
    if (bytes == null) {
      print("❌ Capture failed");
      return;
    }

    // ✅ Save JPG temporarily
    final tempDir = await getTemporaryDirectory();
    final fileName = "pixl_story_${DateTime.now().millisecondsSinceEpoch}.jpg";
    final filePath = path.join(tempDir.path, fileName);
    final file = File(filePath);
    final decoded = img.decodeImage(bytes);
    if (decoded == null) {
      print("❌ Image decode failed");
      return;
    }

    final jpgBytes = img.encodeJpg(decoded, quality: 90);
    await file.writeAsBytes(jpgBytes);

    // ✅ Optional JSON data (same as Postman "data")
    final Map<String, dynamic> data = {
      "caption": "Hello from Flutter",
      "taggedUsers": [],
      "location": null,
      "tags": []
    };

    // ✅ Multipart request
    final uri = Uri.parse(
      Config.buildApiUrl('/posts/create-stories'),
    );

    final request = http.MultipartRequest("POST", uri);

    // 🔐 Auth header from secure storage
    final token = await _secureStorage.read(key: 'jwt_token');
    if (token == null) {
      print("❌ No JWT token found");
      return;
    }
    request.headers["Authorization"] = "Bearer $token";

    // 📎 File field (matches Postman key: file)
    request.files.add(
      await http.MultipartFile.fromPath(
        "file",
        file.path,
        contentType: MediaType("image", "jpeg"),
      ),
    );

    // 📦 Optional data field
    request.fields["data"] = jsonEncode(data);

    final response = await request.send();

    if (response.statusCode == 200 || response.statusCode == 201) {
      print("✅ Story uploaded successfully");
    } else {
      final body = await response.stream.bytesToString();
      print("❌ Upload failed: ${response.statusCode}");
      print(body);
    }
  }
}
