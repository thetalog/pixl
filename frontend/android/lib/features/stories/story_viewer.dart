import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:video_player/video_player.dart';
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
  final Set<String> _seenStories = {};
  int currentStory = 0;

  VideoPlayerController? _videoController;
  Future<void>? _videoInit;
  bool _videoError = false;

  Map<String, dynamic>? _currentMedia() {
    final dynamic raw = widget.stories[currentStory]["media"];
    if (raw is Map) return raw.cast<String, dynamic>();
    if (raw is List && raw.isNotEmpty && raw.first is Map) {
      return (raw.first as Map).cast<String, dynamic>();
    }
    return null;
  }

  String _currentMimeType() {
    final media = _currentMedia();
    return media?["mimeType"]?.toString() ?? "";
  }

  String _currentVideoUrl() {
    final media = _currentMedia();
    if (media == null) return "";
    if (_currentMimeType().toUpperCase() != "VIDEO") return "";
    return media["url"]?.toString() ?? "";
  }

  String _currentDisplayUrl() {
    final media = _currentMedia();
    if (media == null) return "";

    final mimeType = _currentMimeType().toUpperCase();
    if (mimeType == "VIDEO") {
      return media["thumbnail"]?.toString() ?? "";
    }

    return media["url"]?.toString() ?? "";
  }

  void _setupMediaForCurrentStory() {
    final mimeType = _currentMimeType().toUpperCase();

    _videoError = false;
    _videoInit = null;
    _videoController?.dispose();
    _videoController = null;

    if (mimeType != "VIDEO") {
      if (mounted) setState(() {});
      return;
    }

    final url = _currentVideoUrl();
    if (url.isEmpty) {
      _videoError = true;
      if (mounted) setState(() {});
      return;
    }

    final controller = VideoPlayerController.networkUrl(Uri.parse(url));
    _videoController = controller;

    _videoInit = controller
        .initialize()
        .timeout(const Duration(seconds: 15))
        .then((_) async {
      await controller.setLooping(true);
      await controller.play();
      if (!mounted) return;
      setState(() {});
    }).catchError((_) {
      if (!mounted) return;
      setState(() {
        _videoError = true;
      });
    });

    if (mounted) setState(() {});
  }

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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.stories.isEmpty) return;
      _markStorySeen(widget.stories[0]['id']?.toString() ?? "");
    });
    _setupMediaForCurrentStory();
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  void _nextStory() {
    if (currentStory < widget.stories.length - 1) {
      setState(() => currentStory++);
      _setupMediaForCurrentStory();
      _markStorySeen(widget.stories[currentStory]['id']?.toString() ?? "");
    }
  }

  void _previousStory() {
    if (currentStory > 0) {
      setState(() => currentStory--);
      _setupMediaForCurrentStory();
      _markStorySeen(widget.stories[currentStory]['id']?.toString() ?? "");
    }
  }

  @override
  Widget build(BuildContext context) {
    final profilePic = widget.stories[currentStory]['user']['profilePic'];
    final screenWidth = MediaQuery.of(context).size.width;
    final displayUrl = _currentDisplayUrl();
    final mimeType = _currentMimeType().toUpperCase();

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onVerticalDragEnd: (details) {
          final velocity = details.primaryVelocity ?? 0;
          if (velocity > 900) {
            Navigator.of(context).maybePop();
          }
        },
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
              child: mimeType == "VIDEO"
                  ? (_videoError
                      ? const Center(
                          child: Text(
                            "Video story failed to load",
                            style: TextStyle(color: Colors.white),
                          ),
                        )
                      : (_videoInit == null || _videoController == null)
                          ? const Center(
                              child: CircularProgressIndicator(),
                            )
                          : FutureBuilder<void>(
                              future: _videoInit,
                              builder: (context, snapshot) {
                                if (snapshot.connectionState !=
                                    ConnectionState.done) {
                                  return const Center(
                                    child: CircularProgressIndicator(),
                                  );
                                }

                                if (!_videoController!.value.isInitialized) {
                                  return const Center(
                                    child: Text(
                                      "Video story unavailable",
                                      style: TextStyle(color: Colors.white),
                                    ),
                                  );
                                }

                                return Center(
                                  child: AspectRatio(
                                    aspectRatio:
                                        _videoController!.value.aspectRatio,
                                    child: VideoPlayer(_videoController!),
                                  ),
                                );
                              },
                            ))
                  : (displayUrl.isEmpty
                      ? const Center(
                          child: Text(
                            "Story media unavailable",
                            style: TextStyle(color: Colors.white),
                          ),
                        )
                      : Image.network(
                          displayUrl,
                          fit: BoxFit.contain,
                          loadingBuilder: (context, child, progress) {
                            if (progress == null) return child;
                            return const Center(
                              child: CircularProgressIndicator(),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) {
                            return const Center(
                              child: Text(
                                "Story failed to load",
                                style: TextStyle(color: Colors.white),
                              ),
                            );
                          },
                        )),
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
