import 'package:flutter/material.dart';
import 'direct_message.dart';
import 'group_message.dart';
import 'get_messages_view.dart';

class MessagesHomeScreen extends StatefulWidget {
  const MessagesHomeScreen({super.key});

  @override
  State<MessagesHomeScreen> createState() => _MessagesHomeScreenState();
}

class _MessagesHomeScreenState extends State<MessagesHomeScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
      ),
      body: GetMessagesView(),
    );
  }
}
