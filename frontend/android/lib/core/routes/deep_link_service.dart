import 'dart:async';
import 'package:app_links/app_links.dart';
import 'navigator_key.dart';
import '../../features/post/post_screen.dart';
import 'package:flutter/material.dart';
import '../../features/post/view_post.dart';

class DeepLinkService {
  final AppLinks _appLinks = AppLinks();
  StreamSubscription<Uri>? _sub;

  void startListening() async {
    // ✅ When app is opened from CLOSED state
    final initialUri = await _appLinks.getInitialLink();
    if (initialUri != null) {
      _handleUri(initialUri);
    }

    // ✅ When app is running/background
    _sub = _appLinks.uriLinkStream.listen((Uri uri) {
      _handleUri(uri);
    });
  }

  void _handleUri(Uri uri) {
    print("Deep link opened: $uri");

    final postId = uri.queryParameters['id'];
    final ref = uri.queryParameters['ref'];

    print("postId = $postId");
    print("\x1B[32mref = $ref\x1B[0m");
    // ✅ NAVIGATION HERE
    if (uri.host == "post" && postId != null) {
      navigatorKey.currentState?.push(
        MaterialPageRoute(
          builder: (_) => ViewPost(
            byShareId: postId,
            post: null,
            canEdit: false,
          ),
        ),
      );
    }
  }

  void dispose() {
    _sub?.cancel();
  }
}
