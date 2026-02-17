import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:pixl/features/message/direct_thread_screen.dart';
import 'package:pixl/features/message/group_thread_screen.dart';
import 'package:pixl/features/message/message_api.dart';
import 'package:pixl/state/auth_provider.dart';
import 'package:toast/toast.dart';

class MessagesHomeScreen extends ConsumerStatefulWidget {
  const MessagesHomeScreen({super.key});

  @override
  ConsumerState<MessagesHomeScreen> createState() => _MessagesHomeScreenState();
}

class _MessagesHomeScreenState extends ConsumerState<MessagesHomeScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  bool _loadingDirect = true;
  bool _loadingGroups = true;
  List<dynamic> _directConversations = const [];
  List<dynamic> _groupConversations = const [];
  String _query = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _reloadAll();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _reloadAll() async {
    await Future.wait([
      _reloadDirect(),
      _reloadGroups(),
    ]);
  }

  Future<void> _reloadDirect() async {
    setState(() => _loadingDirect = true);
    try {
      final rows = await MessageApi.getDirectConversations(skip: 0, take: 50);
      if (!mounted) return;
      setState(() {
        _directConversations = rows;
        _loadingDirect = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingDirect = false);
      Toast.show(e.toString());
    }
  }

  Future<void> _reloadGroups() async {
    setState(() => _loadingGroups = true);
    try {
      final rows = await MessageApi.getGroupConversations(skip: 0, take: 50);
      if (!mounted) return;
      setState(() {
        _groupConversations = rows;
        _loadingGroups = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingGroups = false);
      Toast.show(e.toString());
    }
  }

  String _formatListTime(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final local = dt.toLocal();
    final now = DateTime.now();
    final sameDay = local.year == now.year &&
        local.month == now.month &&
        local.day == now.day;
    return sameDay
        ? DateFormat('h:mm a').format(local)
        : DateFormat('MMM d').format(local);
  }

  bool _matchesQuery(String text) {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return true;
    return text.toLowerCase().contains(q);
  }

  Future<void> _promptNewChat() async {
    final controller = TextEditingController();
    final username = await showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('New message'),
          content: TextField(
            controller: controller,
            autofocus: true,
            decoration: const InputDecoration(
              labelText: 'Username',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, controller.text.trim()),
              child: const Text('Chat'),
            ),
          ],
        );
      },
    );

    if (!mounted) return;
    if (username == null || username.isEmpty) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DirectThreadScreen(targetUsername: username),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    ToastContext().init(context);

    final myUsernameAsync = ref.watch(profileProvider);
    final myUsername = myUsernameAsync.valueOrNull;

    final filteredDirect = _directConversations.where((row) {
      final user = row is Map ? (row['user'] as Map?) : null;
      final username = user?['userName']?.toString() ?? '';
      final name = user?['name']?.toString() ?? '';
      final title = name.trim().isNotEmpty ? name.trim() : username;
      return _matchesQuery('$title $username');
    }).toList();

    final filteredGroups = _groupConversations.where((row) {
      final group = row is Map ? (row['group'] as Map?) : null;
      final groupName = group?['name']?.toString() ?? 'Group';
      return _matchesQuery(groupName);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(myUsername?.isNotEmpty == true ? myUsername! : 'Messages'),
        actions: [
          IconButton(
            onPressed: _promptNewChat,
            icon: const Icon(Icons.edit_square),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Chats'),
            Tab(text: 'Groups'),
          ],
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
            child: TextField(
              onChanged: (v) => setState(() => _query = v),
              decoration: const InputDecoration(
                hintText: 'Search',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(14)),
                ),
                isDense: true,
              ),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                RefreshIndicator(
                  onRefresh: _reloadDirect,
                  child: _loadingDirect
                      ? ListView(
                          children: [
                            SizedBox(height: 28),
                            Center(child: CircularProgressIndicator()),
                          ],
                        )
                      : ListView.separated(
                          itemCount: filteredDirect.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final row = filteredDirect[index];
                            final user = row['user'] as Map?;
                            final latest = row['latestMessage'] as Map?;

                            final username =
                                user?['userName']?.toString() ?? '';
                            final name = user?['name']?.toString() ?? '';
                            final avatarUrl =
                                user?['profilePic']?.toString() ?? '';

                            final title =
                                name.trim().isNotEmpty ? name.trim() : username;

                            final retracted = latest?['retracted'] == true;
                            final msg = retracted
                                ? 'Message unsent'
                                : (latest?['message']?.toString() ?? '');
                            final media = (latest?['mediaUrl'] is List)
                                ? (latest?['mediaUrl'] as List)
                                : const [];
                            final preview = msg.trim().isNotEmpty
                                ? msg.trim()
                                : (media.isNotEmpty ? 'Attachment' : '');
                            final time = _formatListTime(
                                latest?['createdAt']?.toString());

                            return ListTile(
                              leading: CircleAvatar(
                                backgroundImage: avatarUrl.isNotEmpty
                                    ? CachedNetworkImageProvider(avatarUrl)
                                    : null,
                                child: avatarUrl.isEmpty
                                    ? const Icon(Icons.person)
                                    : null,
                              ),
                              title: Text(title,
                                  maxLines: 1, overflow: TextOverflow.ellipsis),
                              subtitle: Text(
                                preview,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: time.isEmpty
                                  ? null
                                  : Text(
                                      time,
                                      style:
                                          Theme.of(context).textTheme.bodySmall,
                                    ),
                              onTap: () {
                                if (username.isEmpty) return;
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => DirectThreadScreen(
                                      targetUsername: username,
                                      targetName: name,
                                      targetProfilePic: avatarUrl,
                                    ),
                                  ),
                                ).then((_) => _reloadDirect());
                              },
                            );
                          },
                        ),
                ),
                RefreshIndicator(
                  onRefresh: _reloadGroups,
                  child: _loadingGroups
                      ? ListView(
                          children: [
                            SizedBox(height: 28),
                            Center(child: CircularProgressIndicator()),
                          ],
                        )
                      : ListView.separated(
                          itemCount: filteredGroups.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final row = filteredGroups[index];
                            final group = row['group'] as Map?;
                            final latest = row['latestMessage'] as Map?;

                            final groupId = group?['groupId']?.toString() ?? '';
                            final groupName =
                                group?['name']?.toString() ?? 'Group';
                            final avatarUrl =
                                group?['displayPicture']?.toString() ?? '';

                            final retracted = latest?['retracted'] == true;
                            final msg = latest == null
                                ? ''
                                : (retracted
                                    ? 'Message unsent'
                                    : (latest['message']?.toString() ?? ''));
                            final media = (latest?['mediaUrl'] is List)
                                ? (latest?['mediaUrl'] as List)
                                : const [];
                            final preview = msg.trim().isNotEmpty
                                ? msg.trim()
                                : (latest == null
                                    ? 'No messages yet'
                                    : (media.isNotEmpty ? 'Attachment' : ''));
                            final time = _formatListTime(
                                latest?['createdAt']?.toString());

                            return ListTile(
                              leading: CircleAvatar(
                                backgroundImage: avatarUrl.isNotEmpty
                                    ? CachedNetworkImageProvider(avatarUrl)
                                    : null,
                                child: avatarUrl.isEmpty
                                    ? const Icon(Icons.group)
                                    : null,
                              ),
                              title: Text(groupName,
                                  maxLines: 1, overflow: TextOverflow.ellipsis),
                              subtitle: Text(
                                preview,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: time.isEmpty
                                  ? null
                                  : Text(
                                      time,
                                      style:
                                          Theme.of(context).textTheme.bodySmall,
                                    ),
                              onTap: () {
                                if (groupId.isEmpty) return;
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => GroupThreadScreen(
                                      groupId: groupId,
                                      groupName: groupName,
                                      groupDisplayPicture: avatarUrl,
                                    ),
                                  ),
                                ).then((_) => _reloadGroups());
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
