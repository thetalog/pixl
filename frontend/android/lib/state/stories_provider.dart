import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:pixl/core/config/config.dart';
import 'package:logger/logger.dart';

final logger = Logger();
const _secureStorage = FlutterSecureStorage();

final storiesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final token = await _secureStorage.read(key: 'jwt_token');

  if (token == null) {
    logger.e("❌ JWT token not found");
    return [];
  }

  final uri = Uri.parse(Config.buildApiUrl('/posts/get-all-followed-stories'));

  final response = await http.get(
    uri,
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  debugPrint('Stories status: ${response.statusCode}');
  debugPrint('Stories body: ${response.body}');
  if (response.statusCode != 200) {
    logger.e('Failed to load stories: ${response.statusCode}');
    return [];
  }

  final decoded = json.decode(response.body);
  return List<Map<String, dynamic>>.from(decoded['data']);
});
