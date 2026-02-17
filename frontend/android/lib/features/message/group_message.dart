import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:pixl/core/config/config.dart';
import 'package:toast/toast.dart';

final _logger = Logger();
const _secureStorage = FlutterSecureStorage();

class GroupMessageTab extends StatefulWidget {
  const GroupMessageTab({super.key});

  @override
  State<GroupMessageTab> createState() => _GroupMessageTabState();
}

class _GroupMessageTabState extends State<GroupMessageTab> {
  final TextEditingController _groupNameController = TextEditingController();
  final TextEditingController _groupMembersController = TextEditingController();
  PlatformFile? _groupDp;
  bool _creatingGroup = false;
  String? _createdGroupId;

  final TextEditingController _groupIdController = TextEditingController();
  final TextEditingController _groupMessageController = TextEditingController();
  bool _sendingGroup = false;

  @override
  void dispose() {
    _groupNameController.dispose();
    _groupMembersController.dispose();
    _groupIdController.dispose();
    _groupMessageController.dispose();
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
    PlatformFile? singleFile,
    String singleFileFieldName = 'file',
  }) async {
    final token = await _getToken();
    if (token == null || token.isEmpty) {
      throw Exception('JWT token not found');
    }

    final uri = Uri.parse(Config.buildApiUrl(path));
    final req = http.MultipartRequest('POST', uri);
    req.headers['Authorization'] = 'Bearer $token';
    req.fields['postData'] = jsonEncode(postData);

    if (singleFile != null) {
      if (singleFile.bytes == null) {
        throw Exception('Selected file is not available in memory');
      }
      req.files.add(
        http.MultipartFile.fromBytes(
          singleFileFieldName,
          singleFile.bytes!,
          filename: singleFile.name,
        ),
      );
    }

    return req.send();
  }

  List<String> _parseUsernames(String raw) {
    return raw
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
  }

  Future<void> _pickGroupDp() async {
    final res = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
      allowMultiple: false,
    );
    if (res == null || res.files.isEmpty) return;

    setState(() {
      _groupDp = res.files.first;
    });
  }

  Future<void> _createGroup() async {
    if (_creatingGroup) return;

    final groupName = _groupNameController.text.trim();
    final members = _parseUsernames(_groupMembersController.text);

    if (groupName.isEmpty) {
      Toast.show('Group name required');
      return;
    }
    if (_groupDp == null) {
      Toast.show('Group display picture required');
      return;
    }
    if (members.isEmpty) {
      Toast.show('Add at least one username');
      return;
    }

    setState(() => _creatingGroup = true);
    try {
      final streamed = await _multipartPost(
        path: '/message/group/create-group',
        postData: {
          'groupName': groupName,
          'addedUsernames': members,
        },
        singleFile: _groupDp,
        singleFileFieldName: 'file',
      );

      final body = await streamed.stream.bytesToString();
      final decoded = _safeDecode(body);

      if (streamed.statusCode == 200) {
        final groupId = decoded?['groupId']?.toString();
        Toast.show(decoded?['message']?.toString() ?? 'Group created');

        setState(() {
          _createdGroupId = groupId;
          if (groupId != null && groupId.isNotEmpty) {
            _groupIdController.text = groupId;
          }
        });
      } else {
        _logger.e('Create group failed: ${streamed.statusCode} $body');
        Toast.show(decoded?['message']?.toString() ?? 'Create group failed');
      }
    } catch (e) {
      _logger.e('Create group error: $e');
      Toast.show('Create group failed');
    } finally {
      if (!mounted) return;
      setState(() => _creatingGroup = false);
    }
  }

  Future<void> _sendGroupMessage() async {
    if (_sendingGroup) return;

    final groupId = _groupIdController.text.trim();
    final msg = _groupMessageController.text.trim();

    if (groupId.isEmpty) {
      Toast.show('Group ID required');
      return;
    }
    if (msg.isEmpty) {
      Toast.show('Message required');
      return;
    }

    setState(() => _sendingGroup = true);
    try {
      final streamed = await _multipartPost(
        path: '/message/send-message',
        postData: {
          'groupId': groupId,
          'message': msg,
        },
      );

      final body = await streamed.stream.bytesToString();
      final decoded = _safeDecode(body);

      if (streamed.statusCode == 200) {
        Toast.show(decoded?['message']?.toString() ?? 'Message sent');
        _groupMessageController.clear();
      } else {
        _logger.e('Group send failed: ${streamed.statusCode} $body');
        Toast.show(decoded?['message']?.toString() ?? 'Send failed');
      }
    } catch (e) {
      _logger.e('Group send error: $e');
      Toast.show('Send failed');
    } finally {
      if (!mounted) return;
      setState(() => _sendingGroup = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ToastContext().init(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Create Group',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _groupNameController,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Group name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _groupMembersController,
            minLines: 1,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Added usernames (comma separated)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _creatingGroup ? null : _pickGroupDp,
                  icon: const Icon(Icons.image),
                  label: Text(_groupDp?.name ?? 'Pick group picture'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _creatingGroup ? null : _createGroup,
            child: _creatingGroup
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Create Group'),
          ),
          if (_createdGroupId != null && _createdGroupId!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Created groupId: $_createdGroupId',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          const Divider(height: 32),
          Text(
            'Send Group Message',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _groupIdController,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Group ID',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _groupMessageController,
            minLines: 2,
            maxLines: 6,
            textInputAction: TextInputAction.send,
            onSubmitted: (_) => _sendGroupMessage(),
            decoration: const InputDecoration(
              labelText: 'Message',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _sendingGroup ? null : _sendGroupMessage,
            icon: _sendingGroup
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
