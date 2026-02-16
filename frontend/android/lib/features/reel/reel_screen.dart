import 'dart:io';
import 'package:flutter/material.dart';
import 'package:pixl/features/post/comments/show_all_comments.dart';
import 'package:toast/toast.dart';
import 'package:video_player/video_player.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:logger/logger.dart';
import 'package:pixl/core/config/config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_svg/flutter_svg.dart';

final FlutterSecureStorage secureStorage = FlutterSecureStorage();

final logger = Logger();

class ReelScreen extends StatefulWidget {
  final Map<String, dynamic> reelData;
  final bool isActive;

  const ReelScreen({
    Key? key,
    required this.reelData,
    required this.isActive,
  }) : super(key: key);

  @override
  State<ReelScreen> createState() => ReelScreenState();
}

class ReelScreenState extends State<ReelScreen> {
  VideoPlayerController? _controller;
  bool _hasError = false;
  bool _isLiked = false;
  bool _expandCaption = false;
  bool _isImage = false;
  String? _imageUrl;

  @override
  void initState() {
    super.initState();

    final mimeType = widget.reelData['mimeType'];
    final mediaUrl = widget.reelData['mediaUrl'];
    final path = widget.reelData['videoPath'];

    if (mimeType == 'IMAGE') {
      if (mediaUrl is String && mediaUrl.isNotEmpty) {
        _isImage = true;
        _imageUrl = mediaUrl;
        return;
      }
      debugPrint('❌ mediaUrl missing for IMAGE reel ${widget.reelData['id']}');
      _hasError = true;
      return;
    }

    if (mediaUrl is String && mediaUrl.isNotEmpty) {
      _controller = VideoPlayerController.networkUrl(Uri.parse(mediaUrl));
    } else if (path is String && path.isNotEmpty) {
      _controller = VideoPlayerController.file(File(path));
    } else {
      debugPrint(
          '❌ No playable source for reel ${widget.reelData['id']} (missing mediaUrl/videoPath)');
      _hasError = true;
      return;
    }

    _controller!.initialize().timeout(const Duration(seconds: 15)).then((_) {
      if (!mounted) return;
      setState(() {});
      if (widget.isActive) _controller!.play();
      _controller!.setLooping(true);
    }).catchError((_) {
      if (!mounted) return;
      setState(() {
        _hasError = true;
      });
    });
  }

  @override
  void didUpdateWidget(covariant ReelScreen oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (_controller == null) return;

    if (widget.isActive) {
      _controller!.play();
    } else {
      _controller!.pause();
    }
  }

  Future<void> likeOrUnlikeReel() async {
    try {
      final id = widget.reelData['id'];
      final uri =
          Uri.parse(Config.buildApiUrl('/posts/reel/like-or-unlike/$id'));
      String? token = await secureStorage.read(key: "jwt_token");
      if (token == null) {
        logger.e("❌ JWT token not found");
        return;
      }
      final response = await http.patch(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      if (!mounted || response.statusCode != 200) return;

      final decoded = jsonDecode(response.body);
      setState(() {
        if (decoded["message"] == "Liked") {
          _isLiked = true;
        } else if (decoded["message"] == "Unliked") {
          _isLiked = false;
        }
      });
    } catch (error) {}
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ToastContext().context = context;

    final caption = widget.reelData['data']?['caption'] ?? '';
    final reel = widget.reelData['data'] ?? '';

    final owner = (widget.reelData['data'] as Map?)
        ?.cast<String, dynamic>()['user'] as Map?;
    final ownerUserName = owner?['userName']?.toString() ?? '';
    final ownerProfilePic = owner?['profilePic']?.toString() ?? '';

    Widget ownerOverlay() {
      return Positioned(
        bottom: 55,
        left: 10,
        right: 80,
        child: Row(
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: Colors.white24,
              backgroundImage: ownerProfilePic.isNotEmpty
                  ? NetworkImage(ownerProfilePic)
                  : null,
              child: ownerProfilePic.isEmpty
                  ? const Icon(Icons.person, size: 16, color: Colors.white)
                  : null,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                ownerUserName.isNotEmpty ? ownerUserName : 'Unknown',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (_hasError) {
      return const Center(
        child: Text(
          'Reel unavailable',
          style: TextStyle(color: Colors.white),
        ),
      );
    }

    if (_isImage && _imageUrl != null) {
      return GestureDetector(
        onDoubleTap: likeOrUnlikeReel,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              _imageUrl!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const Center(
                child: Icon(Icons.broken_image, color: Colors.white),
              ),
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return const Center(
                  child: CircularProgressIndicator(color: Colors.white),
                );
              },
            ),
            ownerOverlay(),
            Positioned(
              bottom: 120,
              right: 10,
              child: GestureDetector(
                onTap: likeOrUnlikeReel,
                child: SvgPicture.asset(
                  _isLiked
                      ? "assets/icons/HeartLiked.svg"
                      : "assets/icons/HeartUnliked.svg",
                  height: 30,
                  width: 30,
                  colorFilter:
                      const ColorFilter.mode(Colors.white, BlendMode.srcIn),
                ),
              ),
            ),
            Positioned(
              bottom: 70,
              right: 10,
              child: GestureDetector(
                onTap: () {
                  Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (BuildContext context) =>
                              ShowAllComments(post: reel)));
                },
                child: const Icon(
                  Icons.comment,
                  size: 30,
                  color: Colors.white,
                ),
              ),
            ),
            Positioned(
              bottom: 20,
              left: 10,
              right: 40,
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _expandCaption = !_expandCaption;
                  });
                },
                child: _expandCaption
                    ? Text(
                        caption,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                        ),
                      )
                    : Text(
                        caption.length > 40
                            ? caption.substring(0, 40) + "..."
                            : caption,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
              ),
            ),
          ],
        ),
      );
    }

    if (_controller == null || !_controller!.value.isInitialized) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    return GestureDetector(
      onTap: () {
        _controller!.value.isPlaying
            ? _controller!.pause()
            : _controller!.play();
      },
      onDoubleTap: likeOrUnlikeReel,
      child: Stack(
        fit: StackFit.expand,
        children: [
          AspectRatio(
            aspectRatio: _controller!.value.aspectRatio,
            child: VideoPlayer(_controller!),
          ),
          ownerOverlay(),
          // 👍 ICON OVERLAY
          Positioned(
            bottom: 120,
            right: 10,
            child: GestureDetector(
              onTap: likeOrUnlikeReel,
              child: SvgPicture.asset(
                _isLiked
                    ? "assets/icons/HeartLiked.svg"
                    : "assets/icons/HeartUnliked.svg",
                height: 30,
                width: 30,
                colorFilter:
                    const ColorFilter.mode(Colors.white, BlendMode.srcIn),
              ),
            ),
          ),
          Positioned(
            bottom: 70,
            right: 10,
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (BuildContext context) =>
                            ShowAllComments(post: reel)));
              },
              child: Icon(
                Icons.comment,
                size: 30,
                color: Colors.white,
              ),
            ),
          ),
          Positioned(
            bottom: 20,
            left: 10,
            right: 40,
            child: GestureDetector(
              onTap: () => {
                setState(() {
                  _expandCaption = !_expandCaption;
                })
              },
              child: _expandCaption
                  ? Text(caption,
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w500))
                  : Text(
                      caption.length > 40
                          ? caption.substring(0, 40) + "..."
                          : caption,
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w500),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
