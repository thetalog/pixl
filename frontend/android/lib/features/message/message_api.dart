import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:pixl/core/config/config.dart';

const _secureStorage = FlutterSecureStorage();

class MessageApi {
  static Future<String> _requireToken() async {
    final token = await _secureStorage.read(key: 'jwt_token');
    if (token == null || token.isEmpty) {
      throw Exception('JWT token not found');
    }
    return token;
  }

  static Uri _uri(String path, [Map<String, String>? query]) {
    final base = Uri.parse(Config.buildApiUrl(path));
    if (query == null) return base;
    return base.replace(queryParameters: {
      ...base.queryParameters,
      ...query,
    });
  }

  static Map<String, dynamic> _decodeJsonMap(String body) {
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) return decoded;
    if (decoded is Map) return decoded.cast<String, dynamic>();
    throw Exception('Unexpected response');
  }

  static List<dynamic> _decodeJsonList(dynamic value) {
    if (value is List) return value;
    return const [];
  }

  static Future<List<dynamic>> getDirectConversations(
      {int skip = 0, int take = 50}) async {
    final token = await _requireToken();
    final res = await http.get(
      _uri('/message/direct/conversations', {
        'skip': '$skip',
        'take': '$take',
      }),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    final body = _decodeJsonMap(res.body);
    if (res.statusCode != 200) {
      throw Exception(
          body['message']?.toString() ?? 'Fetch conversations failed');
    }

    return _decodeJsonList(body['conversations']);
  }

  static Future<List<dynamic>> getGroupConversations(
      {int skip = 0, int take = 50}) async {
    final token = await _requireToken();
    final res = await http.get(
      _uri('/message/group/conversations', {
        'skip': '$skip',
        'take': '$take',
      }),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    final body = _decodeJsonMap(res.body);
    if (res.statusCode != 200) {
      throw Exception(
          body['message']?.toString() ?? 'Fetch group conversations failed');
    }

    return _decodeJsonList(body['conversations']);
  }

  static Future<List<dynamic>> getDirectMessages({
    required String targetUsername,
    int skip = 0,
    int take = 200,
  }) async {
    final token = await _requireToken();
    final res = await http.get(
      _uri('/message/direct/messages', {
        'targetUsername': targetUsername,
        'skip': '$skip',
        'take': '$take',
      }),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    final body = _decodeJsonMap(res.body);
    if (res.statusCode != 200) {
      throw Exception(body['message']?.toString() ?? 'Fetch messages failed');
    }

    return _decodeJsonList(body['messages']);
  }

  static Future<Map<String, dynamic>> getGroupMessages({
    required String groupId,
    int skip = 0,
    int take = 200,
  }) async {
    final token = await _requireToken();
    final res = await http.get(
      _uri('/message/group/messages', {
        'groupId': groupId,
        'skip': '$skip',
        'take': '$take',
      }),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    final body = _decodeJsonMap(res.body);
    if (res.statusCode != 200) {
      throw Exception(
          body['message']?.toString() ?? 'Fetch group messages failed');
    }

    return body;
  }

  static Future<void> markDirectSeen({required String senderUsername}) async {
    final token = await _requireToken();
    final res = await http.patch(
      _uri('/message/direct/seen-direct-message'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'senderUsername': senderUsername}),
    );

    if (res.statusCode != 200) {
      final body = _decodeJsonMap(res.body);
      throw Exception(body['message']?.toString() ?? 'Seen failed');
    }
  }

  static Future<void> markGroupSeen({required String groupId}) async {
    final token = await _requireToken();
    final res = await http.patch(
      _uri('/message/group/seen-message'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'groupId': groupId}),
    );

    if (res.statusCode != 200) {
      final body = _decodeJsonMap(res.body);
      throw Exception(body['message']?.toString() ?? 'Seen failed');
    }
  }

  static Future<void> reactDirectMessage({
    required String senderUsername,
    required String messageId,
    required String emoji,
  }) async {
    final token = await _requireToken();
    final res = await http.put(
      _uri('/message/direct/react-direct-message'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'senderUsername': senderUsername,
        'messageId': messageId,
        'emoji': emoji,
      }),
    );

    if (res.statusCode != 200) {
      final body = _decodeJsonMap(res.body);
      throw Exception(body['message']?.toString() ?? 'React failed');
    }
  }

  static Future<void> sendDirectMessage({
    required String receiverUsername,
    required String message,
    List<PlatformFile> files = const [],
  }) async {
    final token = await _requireToken();
    final req =
        http.MultipartRequest('POST', _uri('/message/direct/send-message'));
    req.headers['Authorization'] = 'Bearer $token';
    req.fields['postData'] = jsonEncode({
      'receiverUsername': receiverUsername,
      'message': message,
    });

    for (final file in files) {
      if (file.bytes == null) continue;
      req.files.add(
        http.MultipartFile.fromBytes(
          'files',
          file.bytes!,
          filename: file.name,
        ),
      );
    }

    final streamed = await req.send();
    final bodyStr = await streamed.stream.bytesToString();
    if (streamed.statusCode != 200) {
      final body = _decodeJsonMap(bodyStr);
      throw Exception(body['message']?.toString() ?? 'Send failed');
    }
  }

  static Future<void> retractDirectMessage({
    required String receiverUsername,
    required String messageId,
  }) async {
    final token = await _requireToken();
    final res = await http.delete(
      _uri('/message/direct/retract-direct-message'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'receiverUsername': receiverUsername,
        'messageId': messageId,
      }),
    );

    if (res.statusCode != 200) {
      final body = _decodeJsonMap(res.body);
      throw Exception(body['message']?.toString() ?? 'Unsend failed');
    }
  }

  static Future<void> sendGroupMessage({
    required String groupId,
    required String message,
    List<PlatformFile> files = const [],
  }) async {
    final token = await _requireToken();
    final req = http.MultipartRequest('POST', _uri('/message/send-message'));
    req.headers['Authorization'] = 'Bearer $token';
    req.fields['postData'] = jsonEncode({
      'groupId': groupId,
      'message': message,
    });

    for (final file in files) {
      if (file.bytes == null) continue;
      req.files.add(
        http.MultipartFile.fromBytes(
          'files',
          file.bytes!,
          filename: file.name,
        ),
      );
    }

    final streamed = await req.send();
    final bodyStr = await streamed.stream.bytesToString();
    if (streamed.statusCode != 200) {
      final body = _decodeJsonMap(bodyStr);
      throw Exception(body['message']?.toString() ?? 'Send failed');
    }
  }

  static Future<void> retractGroupMessage({
    required String groupId,
    required String messageId,
  }) async {
    final token = await _requireToken();
    final res = await http.delete(
      _uri('/message/group/retract-message'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'groupId': groupId,
        'messageId': messageId,
      }),
    );

    if (res.statusCode != 200) {
      final body = _decodeJsonMap(res.body);
      throw Exception(body['message']?.toString() ?? 'Unsend failed');
    }
  }
}
