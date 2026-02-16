import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:http/http.dart' as http;
import 'package:toast/toast.dart';
import 'package:logger/logger.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_thumbnail/video_thumbnail.dart';
import '../post/view_post.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'search.dart';
import 'package:pixl/core/config/config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

final logger = Logger();
final FlutterSecureStorage secureStorage = FlutterSecureStorage();

class ExplorePage extends StatefulWidget {
  const ExplorePage({super.key});

  @override
  State<ExplorePage> createState() => _ExplorePageState();
}

class _ExplorePageState extends State<ExplorePage>
    with SingleTickerProviderStateMixin {
  final List<String> categories = const [
    "All",
    "IGTV",
    "Shop",
    "Style",
    "Sports",
    "Auto",
    "Music",
    "Movies",
  ];

  late TabController _tabController;

  // ✅ Cache Futures so it won't refetch every time you switch tabs
  final Map<String, Future<List<Map<String, dynamic>>>> _futureCache = {};

  Future<List<Map<String, dynamic>>> fetchImagesByAll() async {
    final String apiUrl = Config.buildApiUrl('/posts/get-all-public-posts');
    String? token = await secureStorage.read(key: "jwt_token");
    if (token == null) {
      logger.e("❌ JWT token not found");
      return [];
    }
    final res = await http.get(
      Uri.parse(apiUrl),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    );

    if (res.statusCode != 200) {
      throw Exception("Failed: ${res.statusCode} | ${res.body}");
    }

    final jsonData = jsonDecode(res.body);

    final List<Map<String, dynamic>> posts =
        List<Map<String, dynamic>>.from(jsonData["data"] ?? []);

    return posts;
  }

  Future<List<Map<String, dynamic>>> fetchImagesByCategories(
      String category) async {
    if (category == "All") return fetchImagesByAll();
    final String apiUrl = Config.buildApiUrl(
        '/posts/get-all-public-posts-by-ui-category?category=$category');
    String? token = await secureStorage.read(key: "jwt_token");
    final res = await http.get(
      Uri.parse(apiUrl),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    );

    if (res.statusCode != 200) {
      throw Exception("Failed: ${res.statusCode} | ${res.body}");
    }

    final jsonData = jsonDecode(res.body);

    final List<Map<String, dynamic>> posts =
        List<Map<String, dynamic>>.from(jsonData["data"] ?? []);

    return posts;
  }

  // ✅ get future from cache OR create new one
  Future<List<Map<String, dynamic>>> getFuture(String cat) {
    return _futureCache.putIfAbsent(cat, () => fetchImagesByCategories(cat));
  }

  String? _firstString(dynamic value) {
    if (value is String) return value;
    if (value is List && value.isNotEmpty) {
      final first = value.first;
      if (first is String) return first;
    }
    return null;
  }

  String _normalizeUrl(String url) {
    if (url.startsWith("http")) return url;
    return "http://$url";
  }

  String? _extractPreviewUrl(Map<String, dynamic> post) {
    final mediaValue = post["media"];
    if (mediaValue is! List || mediaValue.isEmpty) return null;

    final media0 = mediaValue.first;
    if (media0 is! Map) return null;

    final mimeType = media0["mimeType"];
    final dynamic candidate = (mimeType == "VIDEO")
        ? (media0["thumbnail"] ?? media0["url"])
        : (media0["url"] ?? media0["thumbnail"]);

    final url = _firstString(candidate);
    if (url == null || url.isEmpty) return null;
    return _normalizeUrl(url);
  }

  @override
  void initState() {
    super.initState();

    _tabController = TabController(length: categories.length, vsync: this);

    // ✅ Load first tab (ALL) once
    getFuture(categories[0]);

    _tabController.addListener(() {
      if (_tabController.indexIsChanging) return;

      final cat = categories[_tabController.index];

      // ✅ fetch only once per category
      getFuture(cat);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ToastContext().init(context);

    return Container(
      color: Colors.white,
      child: Column(
        children: [
          // Custom AppBar
          Container(
            color: Colors.white,
            child: Column(
              children: [
                SizedBox(
                  height: 56,
                  child: SearchBarWidget(),
                ),
                TabBar(
                  controller: _tabController,
                  isScrollable: true,
                  indicatorColor: Colors.black,
                  labelColor: Colors.black,
                  unselectedLabelColor: Colors.grey,
                  tabs: categories.map((c) => Tab(text: c)).toList(),
                  tabAlignment: TabAlignment.start,
                ),
              ],
            ),
          ),

          // TabBarView
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: categories.map((cat) {
                // ✅ IF (before FutureBuilder)
                if (cat == "All") {
                  return FutureBuilder<List<Map<String, dynamic>>>(
                    future: fetchImagesByAll(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      if (snapshot.hasError) {
                        return Center(child: Text("Error: ${snapshot.error}"));
                      }

                      final posts = snapshot.data ?? [];

                      if (posts.isEmpty) {
                        return const Center(child: Text("No Post available"));
                      }

                      return Padding(
                        padding: const EdgeInsets.all(6),
                        child: MasonryGridView.count(
                          crossAxisCount: 3,
                          mainAxisSpacing: 3,
                          crossAxisSpacing: 3,
                          itemCount: posts.length,
                          itemBuilder: (context, index) {
                            final post = posts[index];

                            final imageUrl = _extractPreviewUrl(post);
                            if (imageUrl == null) return const SizedBox();

                            return ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                clipBehavior: Clip.antiAlias,
                                child: GestureDetector(
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => ViewPost(
                                              post: post, canEdit: false),
                                        ),
                                      );
                                    },
                                    child: CachedNetworkImage(
                                      imageUrl: imageUrl,
                                      fit: BoxFit.cover,
                                      placeholder: (context, url) =>
                                          const Center(
                                              child:
                                                  CircularProgressIndicator()),
                                      errorWidget: (context, url, error) =>
                                          const Icon(Icons.broken_image),
                                    )));
                          },
                        ),
                      );
                    },
                  );
                }
                return FutureBuilder<List<Map<String, dynamic>>>(
                  future: getFuture(cat),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    if (snapshot.hasError) {
                      return Center(child: Text("Error: ${snapshot.error}"));
                    }

                    final posts = snapshot.data ?? [];

                    if (posts.isEmpty) {
                      return const Center(child: Text("No Post available"));
                    }

                    return Padding(
                      padding: const EdgeInsets.all(6),
                      child: MasonryGridView.count(
                        crossAxisCount: 3,
                        mainAxisSpacing: 3,
                        crossAxisSpacing: 3,
                        itemCount: posts.length,
                        itemBuilder: (context, index) {
                          final post = posts[index];

                          final imageUrl = _extractPreviewUrl(post);
                          if (imageUrl == null) return const SizedBox();

                          return ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            clipBehavior: Clip.antiAlias,
                            child: GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        ViewPost(post: post, canEdit: false),
                                  ),
                                );
                              },
                              child: Image.network(
                                imageUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  color: Colors.grey.shade200,
                                  child: const Icon(Icons.broken_image),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
