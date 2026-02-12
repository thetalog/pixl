import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'widgets/story_progress_bar.dart';
import 'package:pixl/core/config/config.dart';

final logger = Logger();
const _secureStorage = FlutterSecureStorage();

class StoryViewer extends StatefulWidget {
  final List<Map<String, dynamic>> stories;

  const StoryViewer({
    Key? key,
    required this.stories,
  }) : super(key: key);

  @override
  State<StoryViewer> createState() => _StoryViewerState();
}

class _StoryViewerState extends State<StoryViewer> {
  late PageController _controller;
  final Set<String> _seenStories = {};
  int currentStory = 0;

  Future<void> _markStorySeen(String storyId) async {
    if (_seenStories.contains(storyId)) return;

    _seenStories.add(storyId);

    try {
      final token = await _secureStorage.read(key: 'jwt_token');
      if (token == null) {
        logger.e("❌ JWT token not found");
        return;
      }

      final uri = Uri.parse(
        Config.buildApiUrl('/posts/seen-stories'),
      ).replace(queryParameters: {'storyId': storyId});

      await http.post(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      setState(() {
        widget.stories[currentStory]['isSeen'] = true;
      });
    } catch (e) {
      logger.e(
        'Seen API failed $e',
      );
    }
  }

  @override
  void initState() {
    super.initState();
    _controller = PageController();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _markStorySeen(widget.stories[0]['id']);
    });
  }

  void _nextStory() {
    if (currentStory < widget.stories.length - 1) {
      setState(() => currentStory++);
      _markStorySeen(widget.stories[currentStory]['id']);
    }
  }

  void _previousStory() {
    if (currentStory > 0) {
      setState(() => currentStory--);
      _markStorySeen(widget.stories[currentStory]['id']);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profilePic = widget.stories[currentStory]['user']['profilePic'];
    final screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (details) {
          if (details.globalPosition.dx > screenWidth / 2) {
            _nextStory();
          } else {
            _previousStory();
          }
        },
        child: Stack(
          children: [
            StoryProgressBar(
              storiesLength: widget.stories.length,
              currentStoryIndex: currentStory,
            ),
            Positioned.fill(
              child: Image.network(
                widget.stories[currentStory]['media']['url'],
                fit: BoxFit.contain,
              ),
            ),
            Positioned(
              top: 50,
              left: 16,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: Colors.grey.shade800,
                    backgroundImage:
                        profilePic != null ? NetworkImage(profilePic) : null,
                    child: profilePic == null
                        ? const Icon(Icons.person, color: Colors.white)
                        : null,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    widget.stories[currentStory]['user']['userName'],
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
