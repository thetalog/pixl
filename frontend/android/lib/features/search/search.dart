import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import '../profile/view_profile.dart';
import 'package:pixl/core/config/config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final FlutterSecureStorage secureStorage = FlutterSecureStorage();

final logger = Logger();

class SearchBarWidget extends StatelessWidget {
  const SearchBarWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const SearchPage(),
          ),
        );
      },
      child: Container(
        height: 35,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: const [
            Icon(Icons.search, color: Colors.grey, size: 20),
            SizedBox(width: 8),
            Text(
              "Search username...",
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}

class SearchPage extends StatefulWidget {
  const SearchPage({Key? key}) : super(key: key);

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  List<Map<String, dynamic>> searchesReturned = [];
  final TextEditingController searchController = TextEditingController();
  Timer? _debounce;
  bool isLoading = false;

  Future<void> performSearch() async {
    final username = searchController.text.trim();
    if (username.isEmpty) {
      setState(() => searchesReturned = []);
      return;
    }

    setState(() => isLoading = true);

    final url = Uri.parse(
      Config.buildApiUrl('/users/search?username=$username'),
    );
    String? token = await secureStorage.read(key: "jwt_token");
    if (token == null) {
      logger.e("❌ JWT token not found");
      return;
    }
    try {
      final response = await http.get(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
      );

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        setState(() {
          searchesReturned =
              (decoded as List).map((e) => e as Map<String, dynamic>).toList();
          isLoading = false;
        });
      } else {
        setState(() => isLoading = false);
      }
      final responseBody = response.body;
      logger.i("[DEBUG] $responseBody");
    } catch (e) {
      setState(() => isLoading = false);
      print("Search error: $e");
    }
  }

  @override
  void initState() {
    super.initState();

    searchController.addListener(() {
      if (_debounce?.isActive ?? false) _debounce!.cancel();

      _debounce = Timer(const Duration(milliseconds: 400), () {
        performSearch();
      });
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: TextField(
          controller: searchController,
          autofocus: true,
          decoration: InputDecoration(
            hintText: "Search username...",
            border: InputBorder.none,
            hintStyle: TextStyle(color: Colors.grey),
          ),
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : searchesReturned.isEmpty
              ? Center(
                  child: Text(
                    searchController.text.isEmpty
                        ? "Search for users"
                        : "No users found",
                    style: TextStyle(color: Colors.grey),
                  ),
                )
              : ListView.builder(
                  itemCount: searchesReturned.length,
                  itemBuilder: (context, index) {
                    final user = searchesReturned[index];
                    return ListTile(
                      leading: CircleAvatar(
                        radius: 20,
                        backgroundImage: NetworkImage(
                          user["profilePic"] ??
                              "https://www.gravatar.com/avatar/000000000000000000000000000000?d=mp&f=y",
                        ),
                      ),
                      title: Text(user["userName"] ?? ""),
                      subtitle: Text(user["email"] ?? ""),
                      onTap: () {
                        // Navigate to user profile
                        Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ViewProfile(
                                userName: user["userName"] ?? "",
                                isUpdateEnable: false,
                              ),
                            ));
                      },
                    );
                  },
                ),
    );
  }
}
