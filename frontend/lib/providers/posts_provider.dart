import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:pixl/config.dart';

const _secureStorage = FlutterSecureStorage();

final postsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final token = await _secureStorage.read(key: 'jwt_token');

  if (token == null) {
    throw Exception('No JWT token found');
  }

  final uri = Uri.parse(Config.buildApiUrl('/posts/get-followed-posts'));

  final response = await http.get(
    uri,
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );

  debugPrint('Posts status: ${response.statusCode}');
  debugPrint('Posts body: ${response.body}');

  if (response.statusCode != 200) {
    throw Exception('Failed to load posts: ${response.statusCode}');
  }

  final decoded = json.decode(response.body);
  return List<Map<String, dynamic>>.from(decoded['data']);
});
