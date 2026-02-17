import 'package:flutter/material.dart';
import 'direct_message.dart';
import 'group_message.dart';

class GetMessagesView extends StatefulWidget {
  const MessagesGetMessagesViewHomeScreen({super.key});

  @override
  State<GetMessagesView> createState() => _GetMessagesView();
}

class _GetMessagesView extends State<GetMessagesView>
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
      body: getMessagesTabView(),
    );
  }
}
