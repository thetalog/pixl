import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:pixl/core/config/config.dart';
import 'package:toast/toast.dart';

final _logger = Logger();
const _secureStorage = FlutterSecureStorage();

class DirectMessageTab extends StatefulWidget {
  const DirectMessageTab({super.key});

  @override
  State<DirectMessageTab> createState() => _DirectMessageTabState();
}

class _DirectMessageTabState extends State<DirectMessageTab> {
  final TextEditingController _receiverUsernameController =
      TextEditingController();
  final TextEditingController _directMessageController =
      TextEditingController();

  bool _sending = false;

  @override
  void dispose() {
    _receiverUsernameController.dispose();
    _directMessageController.dispose();
    super.dispose();
  }

  Future<String?> _getToken() async {
    return _secureStorage.read(key: 'jwt_token');
  }

  Map<String, dynamic>? _safeDecode(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) return decoded;
      if (decoded is Map) return decoded.cast<String, dynamic>();
    } catch (_) {}
    return null;
  }

  Future<http.StreamedResponse> _multipartPost({
    required String path,
    required Map<String, dynamic> postData,
  }) async {
    final token = await _getToken();
    if (token == null || token.isEmpty) {
      throw Exception('JWT token not found');
    }

    final uri = Uri.parse(Config.buildApiUrl(path));
    final req = http.MultipartRequest('POST', uri);
    req.headers['Authorization'] = 'Bearer $token';
    req.fields['postData'] = jsonEncode(postData);
    return req.send();
  }

  Future<void> _send() async {
    if (_sending) return;

    final receiver = _receiverUsernameController.text.trim();
    final msg = _directMessageController.text.trim();

    if (receiver.isEmpty) {
      Toast.show('Receiver username required');
      return;
    }
    if (msg.isEmpty) {
      Toast.show('Message required');
      return;
    }

    setState(() => _sending = true);
    try {
      final streamed = await _multipartPost(
        path: '/message/direct/send-message',
        postData: {
          'receiverUsername': receiver,
          'message': msg,
        },
      );

      final body = await streamed.stream.bytesToString();
      if (streamed.statusCode == 200) {
        Toast.show('Message sent');
        _directMessageController.clear();
      } else {
        _logger.e('Direct send failed: ${streamed.statusCode} $body');
        final decoded = _safeDecode(body);
        Toast.show(decoded?['message']?.toString() ?? 'Send failed');
      }
    } catch (e) {
      _logger.e('Direct send error: $e');
      Toast.show('Send failed');
    } finally {
      if (!mounted) return;
      setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ToastContext().init(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _receiverUsernameController,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Receiver username',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _directMessageController,
            minLines: 2,
            maxLines: 6,
            textInputAction: TextInputAction.send,
            onSubmitted: (_) => _send(),
            decoration: const InputDecoration(
              labelText: 'Message',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _sending ? null : _send,
            icon: _sending
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.send),
            label: const Text('Send'),
          ),
        ],
      ),
    );
  }
}
