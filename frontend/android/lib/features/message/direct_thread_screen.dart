import 'package:cached_network_image/cached_network_image.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:pixl/features/message/message_api.dart';
import 'package:pixl/state/auth_provider.dart';
import 'package:toast/toast.dart';

class DirectThreadScreen extends ConsumerStatefulWidget {
  const DirectThreadScreen({
    super.key,
    required this.targetUsername,
    this.targetName,
    this.targetProfilePic,
  });

  final String targetUsername;
  final String? targetName;
  final String? targetProfilePic;

  @override
  ConsumerState<DirectThreadScreen> createState() => _DirectThreadScreenState();
}

class _DirectThreadScreenState extends ConsumerState<DirectThreadScreen> {
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

    // Mark seen (best-effort).
    try {
      await MessageApi.markDirectSeen(senderUsername: widget.targetUsername);
    } catch (_) {}

    await _reload();

    // Jump to bottom after first frame.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
    });
  }

  Future<void> _reload() async {
    setState(() => _loading = true);
    try {
      final messages = await MessageApi.getDirectMessages(
        targetUsername: widget.targetUsername,
        skip: 0,
        take: 200,
      );
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
      await MessageApi.sendDirectMessage(
        receiverUsername: widget.targetUsername,
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

  Future<void> _onMessageLongPress(dynamic message,
      {required bool isMine}) async {
    final id = message['id']?.toString() ?? '';
    if (id.isEmpty) return;

    final actions = <_MessageAction>[];

    if (isMine) {
      actions.add(
        _MessageAction(
          label: 'Unsend',
          onTap: () async {
            Navigator.pop(context);
            try {
              await MessageApi.retractDirectMessage(
                receiverUsername: widget.targetUsername,
                messageId: id,
              );
              await _reload();
            } catch (e) {
              Toast.show(e.toString());
            }
          },
        ),
      );
    } else {
      final senderUsername =
          message['sender']?['userName']?.toString() ?? widget.targetUsername;
      actions.add(
        _MessageAction(
          label: '❤️',
          onTap: () async {
            Navigator.pop(context);
            try {
              await MessageApi.reactDirectMessage(
                senderUsername: senderUsername,
                messageId: id,
                emoji: '❤️',
              );
            } catch (e) {
              Toast.show(e.toString());
            }
          },
        ),
      );
    }

    if (actions.isEmpty) return;

    await showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (_) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final a in actions)
                ListTile(
                  title: Text(a.label),
                  onTap: a.onTap,
                ),
            ],
          ),
        );
      },
    );
  }

  String _formatTime(dynamic iso) {
    final raw = iso?.toString();
    if (raw == null || raw.isEmpty) return '';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return '';
    return DateFormat('h:mm a').format(dt.toLocal());
  }

  Widget _avatar() {
    final url = widget.targetProfilePic;
    if (url == null || url.isEmpty) {
      return const CircleAvatar(child: Icon(Icons.person));
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

    final title =
        (widget.targetName != null && widget.targetName!.trim().isNotEmpty)
            ? widget.targetName!.trim()
            : widget.targetUsername;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            _avatar(),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
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

                        final media = (m['mediaUrl'] is List)
                            ? (m['mediaUrl'] as List)
                            : const [];
                        final mediaUrls = media
                            .map((e) => e?.toString() ?? '')
                            .where((u) => u.isNotEmpty)
                            .toList();

                        final bubbleColor = isMine
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context)
                                .colorScheme
                                .surfaceContainerHighest;
                        final textColor = isMine
                            ? Theme.of(context).colorScheme.onPrimary
                            : Theme.of(context).colorScheme.onSurface;

                        final radius = BorderRadius.only(
                          topLeft: const Radius.circular(18),
                          topRight: const Radius.circular(18),
                          bottomLeft: Radius.circular(isMine ? 18 : 4),
                          bottomRight: Radius.circular(isMine ? 4 : 18),
                        );

                        return Align(
                          alignment: isMine
                              ? Alignment.centerRight
                              : Alignment.centerLeft,
                          child: GestureDetector(
                            onLongPress: () =>
                                _onMessageLongPress(m, isMine: isMine),
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
                                borderRadius: radius,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (mediaUrls.isNotEmpty) ...[
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: CachedNetworkImage(
                                        imageUrl: mediaUrls.first,
                                        fit: BoxFit.cover,
                                        placeholder: (context, _) =>
                                            const SizedBox(
                                          height: 160,
                                          child: Center(
                                              child:
                                                  CircularProgressIndicator()),
                                        ),
                                        errorWidget: (context, _, __) =>
                                            const SizedBox(
                                          height: 160,
                                          child: Center(
                                              child: Icon(Icons.broken_image)),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
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

class _MessageAction {
  _MessageAction({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;
}
