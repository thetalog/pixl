import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:logger/logger.dart';

import 'reel_screen.dart';
import '../../state/video_caching_provider.dart';
import '../../state/auth_provider.dart';
import 'package:pixl/core/config/config.dart' as app_config;

final logger = Logger();

class ShowReel extends ConsumerStatefulWidget {
  const ShowReel({Key? key}) : super(key: key);

  @override
  ConsumerState<ShowReel> createState() => _ShowReelState();
}

class _ShowReelState extends ConsumerState<ShowReel> {
  late final PageController _pageController;

  int skip = 0;
  final int take = 3;
  bool isFetching = false;
  bool hasMore = true;
  int _currentIndex = 0;

  String? _token;
  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    final jwt = ref.read(tokenProvider).value;
    _token = 'Bearer $jwt';
    Future.microtask(() {
      ref.read(videoCachingProvider.notifier).state = [];
      fetchReels();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> fetchReels() async {
    if (isFetching || !hasMore) return;
    isFetching = true;

    try {
      final uri = Uri.parse(
        app_config.Config.buildApiUrl(
            '/posts/get-all-public-reels?skip=$skip&take=$take'),
      );

      final response = await http.get(
        uri,
        headers: {
          'Authorization': _token ?? "",
          'Content-Type': 'application/json',
        },
      );

      if (!mounted || response.statusCode != 200) return;

      final decoded = jsonDecode(response.body);
      final List data = decoded['data'] ?? [];

      final current = ref.read(videoCachingProvider);
      final List<Map<String, dynamic>> newReels = [];

      for (final reel in data) {
        final media = reel['media'];

        if (media == null || media is! List || media.isEmpty) {
          logger.w('⚠️ Skipping reel ${reel['id']} — no media');
          continue;
        }

        final url = media[0]['url'];

        if (url == null || url is! String || url.isEmpty) {
          logger.w('⚠️ Skipping reel ${reel['id']} — invalid url');
          continue;
        }

        final file = await DefaultCacheManager().getSingleFile(url);

        newReels.add({
          'id': reel['id'],
          'videoPath': file.path, // ✅ guaranteed non-null
          'data': reel,
        });
      }

      ref.read(videoCachingProvider.notifier).state = [
        ...current,
        ...newReels,
      ];

      setState(() {
        skip += take;
        hasMore = data.length == take;
      });
    } catch (e, s) {
      logger.e(
        'Fetch reels failed $e',
      );
    } finally {
      isFetching = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final reels = ref.watch(videoCachingProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      body: PageView.builder(
        controller: _pageController,
        scrollDirection: Axis.vertical,
        itemCount: reels.length,
        onPageChanged: (index) {
          setState(() => _currentIndex = index);
        },
        itemBuilder: (context, index) {
          final reel = reels[index];

          return ReelScreen(
            key: ValueKey(reel['id']),
            reelData: reel,
            isActive: index == _currentIndex,
          );
        },
      ),
    );
  }
}
