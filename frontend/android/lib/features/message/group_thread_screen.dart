import 'package:cached_network_image/cached_network_image.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:pixl/features/message/message_api.dart';
import 'package:pixl/state/auth_provider.dart';
import 'package:toast/toast.dart';

class GroupThreadScreen extends ConsumerStatefulWidget {
  const GroupThreadScreen({
    super.key,
    required this.groupId,
    required this.groupName,
    this.groupDisplayPicture,
  });

  final String groupId;
  final String groupName;
  final String? groupDisplayPicture;

  @override
  ConsumerState<GroupThreadScreen> createState() => _GroupThreadScreenState();
}

class _GroupThreadScreenState extends ConsumerState<GroupThreadScreen> {
  final _scrollController = ScrollController();
  final _textController = TextEditingController();

  bool _loading = true;
  bool _sending = false;
  List<dynamic> _messages = const [];
  List<PlatformFile> _attachments = const [];

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _textController.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    ToastContext().init(context);

    try {
      await MessageApi.markGroupSeen(groupId: widget.groupId);
    } catch (_) {}

    await _reload();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
    });
  }

  Future<void> _reload() async {
    setState(() => _loading = true);
    try {
      final body = await MessageApi.getGroupMessages(
        groupId: widget.groupId,
        skip: 0,
        take: 200,
      );
      final messages =
          (body['messages'] is List) ? (body['messages'] as List) : const [];
      if (!mounted) return;
      setState(() {
        _messages = messages;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      Toast.show(e.toString());
    }
  }

  Future<void> _pickAttachments() async {
    final res = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
      allowMultiple: true,
    );
    if (res == null || res.files.isEmpty) return;

    setState(() {
      _attachments = res.files.where((f) => f.bytes != null).toList();
    });
  }

  Future<void> _send() async {
    if (_sending) return;

    final text = _textController.text.trim();
    if (text.isEmpty && _attachments.isEmpty) {
      return;
    }

    setState(() => _sending = true);
    try {
      await MessageApi.sendGroupMessage(
        groupId: widget.groupId,
        message: text.isEmpty ? ' ' : text,
        files: _attachments,
      );

      if (!mounted) return;
      _textController.clear();
      setState(() {
        _attachments = const [];
      });
      await _reload();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!_scrollController.hasClients) return;
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      });
    } catch (e) {
      Toast.show(e.toString());
    } finally {
      if (!mounted) return;
      setState(() => _sending = false);
    }
  }

  String _formatTime(dynamic iso) {
    final raw = iso?.toString();
    if (raw == null || raw.isEmpty) return '';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return '';
    return DateFormat('h:mm a').format(dt.toLocal());
  }

  Widget _avatar() {
    final url = widget.groupDisplayPicture;
    if (url == null || url.isEmpty) {
      return const CircleAvatar(child: Icon(Icons.group));
    }
    return CircleAvatar(
      backgroundImage: CachedNetworkImageProvider(url),
      onBackgroundImageError: (_, __) {},
    );
  }

  @override
  Widget build(BuildContext context) {
    ToastContext().init(context);

    final myUsernameAsync = ref.watch(profileProvider);
    final myUsername = myUsernameAsync.valueOrNull ?? '';

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            _avatar(),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                widget.groupName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _reload,
                    child: ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 12),
                      itemCount: _messages.length,
                      itemBuilder: (context, index) {
                        final m = _messages[index];
                        final senderUsername =
                            m['sender']?['userName']?.toString() ?? '';
                        final isMine = senderUsername.isNotEmpty &&
                            senderUsername == myUsername;

                        final retracted = (m['retracted'] == true);
                        final text = retracted
                            ? 'Message unsent'
                            : (m['message']?.toString() ?? '');
                        final time = _formatTime(m['createdAt']);

                        final bubbleColor = isMine
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context)
                                .colorScheme
                                .surfaceContainerHighest;
                        final textColor = isMine
                            ? Theme.of(context).colorScheme.onPrimary
                            : Theme.of(context).colorScheme.onSurface;

                        return Align(
                          alignment: isMine
                              ? Alignment.centerRight
                              : Alignment.centerLeft,
                          child: Container(
                            constraints: BoxConstraints(
                              maxWidth:
                                  MediaQuery.of(context).size.width * 0.78,
                            ),
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: bubbleColor,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (!isMine && senderUsername.isNotEmpty) ...[
                                  Text(
                                    senderUsername,
                                    style: TextStyle(
                                      color: textColor.withValues(alpha: 0.85),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                ],
                                Text(
                                  text,
                                  style: TextStyle(
                                    color: textColor,
                                    fontStyle: retracted
                                        ? FontStyle.italic
                                        : FontStyle.normal,
                                  ),
                                ),
                                if (time.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    time,
                                    style: TextStyle(
                                      color: textColor.withValues(alpha: 0.7),
                                      fontSize: 11,
                                    ),
                                  ),
                                ]
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
          if (_attachments.isNotEmpty)
            SizedBox(
              height: 76,
              child: ListView.separated(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                scrollDirection: Axis.horizontal,
                itemCount: _attachments.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final f = _attachments[i];
                  return Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.memory(
                          f.bytes!,
                          width: 60,
                          height: 60,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 0,
                        right: 0,
                        child: IconButton(
                          visualDensity: VisualDensity.compact,
                          icon: const Icon(Icons.close, size: 18),
                          onPressed: () {
                            setState(() {
                              _attachments = List.of(_attachments)..removeAt(i);
                            });
                          },
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  IconButton(
                    onPressed: _sending ? null : _pickAttachments,
                    icon: const Icon(Icons.add_photo_alternate_outlined),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: const InputDecoration(
                        hintText: 'Message…',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(24)),
                        ),
                        isDense: true,
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: _sending ? null : _send,
                    icon: _sending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
