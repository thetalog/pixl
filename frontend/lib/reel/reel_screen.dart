import 'dart:io';
import 'package:flutter/material.dart';
import 'package:pixl/reel/show_all_comments.dart';
import 'package:toast/toast.dart';
import 'package:video_player/video_player.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:logger/logger.dart';
import 'package:pixl/config.dart';

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
  static const String _token =
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Ikplc3NpY2ExQGV4YW1wbGUuY29tIiwibmFtZSI6Ikplc3NpY2ExIiwidXNlck5hbWUiOiJKZXNzaWNhMSIsImV4cCI6MTc3MjI3Njc2NCwiaWF0IjoxNzY5Njg0NzY0fQ.msXK9PSVJGPUSLWwzRhNPdjRsq2N2dJYf1nPNLyHaf8';

  @override
  void initState() {
    super.initState();

    final path = widget.reelData['videoPath'];

    if (path == null || path is! String) {
      debugPrint('❌ videoPath missing for reel ${widget.reelData['id']}');
      _hasError = true;
      return;
    }

    _controller = VideoPlayerController.file(File(path))
      ..initialize().then((_) {
        if (!mounted) return;
        setState(() {});
        if (widget.isActive) _controller!.play();
        _controller!.setLooping(true);
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

      final response = await http.patch(
        uri,
        headers: {
          'Authorization': _token,
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
    if (_hasError) {
      return const SizedBox.shrink();
    }

    if (_controller == null || !_controller!.value.isInitialized) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    final caption = widget.reelData['data']?['caption'] ?? '';
    final reel = widget.reelData['data'] ?? '';

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
          // 👍 ICON OVERLAY
          Positioned(
            bottom: 120,
            right: 10,
            child: GestureDetector(
              onTap: likeOrUnlikeReel,
              child: Image(
                height: 30,
                image: _isLiked
                    ? AssetImage("assets/icons/HeartLiked.png")
                    : AssetImage("assets/icons/HeartUnliked.png"),
                color: Colors.white,
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
