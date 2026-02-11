import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:pixl/config.dart';

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
      final response = await http.get(
        Uri.parse(
            Config.buildApiUrl('/users/search?username=${searchController.text}')),
        headers: {
          "Authorization":
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Implc3NpY2FAZXhhbXBsZS5jb20iLCJuYW1lIjoiSmVzc2ljYSIsInVzZXJOYW1lIjoiSmVzc2ljYSIsImV4cCI6MTc3MzIxNDcyNCwiaWF0IjoxNzcwNjIyNzI0fQ.-56hO9aL8oZ8m60yY2g62LuFqNQfmcgYBR4uuP2hGYU",
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
          decoration: const InputDecoration(
            hintText: "Search username",
            border: OutlineInputBorder(),
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
