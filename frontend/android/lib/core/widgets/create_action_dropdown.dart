import 'package:flutter/material.dart';
import 'package:pixl/features/post/create_post.dart';
import '../../features/live/kurento_publisher.dart';
import '../../features/live/kurento_viewer.dart';

class CreateActionDropdown extends StatelessWidget {
  const CreateActionDropdown({super.key});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon:
          const Icon(Icons.add, color: Colors.white, size: 26), // ➕ first view

      onSelected: (value) {
        if (value == 'post') {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => CreatePost()),
          );
        }

        if (value == 'live') {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => KurentoPublisherWidget()),
          );
        }

        if (value == 'view') {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => KurentoViewerWidget(
                liveId: '1dc3e042-f7c0-476c-bc6d-385810ddde18',
                serverUrl: '192.168.31.8:9090',
              ),
            ),
          );
        }
      },

      itemBuilder: (context) => [
        const PopupMenuItem(
          value: 'post',
          child: Text('Add Post'),
        ),
        const PopupMenuItem(
          value: 'live',
          child: Text('Go Live'),
        ),
        const PopupMenuItem(
          value: 'view',
          child: Text('View Stream'),
        ),
      ],
    );
  }
}
