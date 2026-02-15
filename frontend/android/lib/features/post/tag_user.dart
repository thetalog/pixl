import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:pixl/core/config/config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

final logger = Logger();

final FlutterSecureStorage secureStorage = FlutterSecureStorage();

class TagUser extends StatefulWidget {
  final Function(List<String>)? onUsersSelected;

  const TagUser({Key? key, this.onUsersSelected}) : super(key: key);

  @override
  State<TagUser> createState() => _TagUserState();
}

class _TagUserState extends State<TagUser> {
  // Fake users (replace with API later)

  final TextEditingController searchController = TextEditingController();
  List<String> allUsers = [];
  Future<void> fetchUsernames() async {
    try {
      String? token = await secureStorage.read(key: "jwt_token");
      if (token == null) {
        logger.e("❌ JWT token not found");
        return;
      }
      final response = await http.get(
        Uri.parse(Config.buildApiUrl(
            '/users/search?username=${searchController.text}')),
        headers: {
          "Authorization": "Bearer $token",
        },
      );
      print("Response status: ${response.statusCode}");
      print("Response body: ${response.body}");

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        print("Decoded JSON: $jsonResponse");

        dynamic data;
        // Check if response is directly a list or wrapped in an object
        if (jsonResponse is List) {
          data = jsonResponse;
        } else if (jsonResponse is Map) {
          data = jsonResponse["data"];
        }

        print("Data: $data, Type: ${data.runtimeType}");

        setState(() {
          if (data is List) {
            // If data is a list of users
            allUsers = data.map((user) => user["userName"] as String).toList();
          } else if (data is Map) {
            // If data is a single user object
            allUsers = [data["userName"] as String];
          } else {
            allUsers = [];
          }
          filteredUsers = allUsers;
        });
      } else {
        print("Failed to fetch users: ${response.statusCode}");
      }
    } catch (e) {
      print("Error fetching usernames: $e");
    }
  }

  List<String> filteredUsers = [];
  List<String> selectedUsers = [];

  void searchUser(String value) {
    if (value.isEmpty) {
      setState(() {
        filteredUsers.clear();
      });
      return;
    }
    fetchUsernames();
  }

  void addUser(String user) {
    if (!selectedUsers.contains(user)) {
      setState(() {
        selectedUsers.add(user);
        searchController.clear();
        filteredUsers.clear();
      });
      widget.onUsersSelected?.call(selectedUsers);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: searchController,
          onChanged: searchUser,
          decoration: InputDecoration(
            labelText: 'UserTags',
            hint: Text("Search username"),
            prefixIcon: const Icon(Icons.supervised_user_circle_rounded),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),

        const SizedBox(height: 10),

        // Search results
        ...filteredUsers.map(
          (user) => ListTile(
            title: Text(user),
            onTap: () => addUser(user),
          ),
        ),

        const SizedBox(height: 10),

        // Selected users
        Wrap(
          spacing: 8,
          children: selectedUsers
              .map(
                (user) => Chip(
                  label: Text(user),
                  onDeleted: () {
                    setState(() {
                      selectedUsers.remove(user);
                    });
                    widget.onUsersSelected?.call(selectedUsers);
                  },
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}
