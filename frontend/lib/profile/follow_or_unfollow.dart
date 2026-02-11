import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:pixl/config.dart';

final logger = Logger();

class FollowOrUnfollow extends StatefulWidget {
  final String profileVisibility;
  final String targetUsername;
  FollowOrUnfollow(
      {Key? key, required this.profileVisibility, required this.targetUsername})
      : super(key: key);

  @override
  State<FollowOrUnfollow> createState() => _FollowOrUnfollow();
}

class _FollowOrUnfollow extends State<FollowOrUnfollow> {
  int refreshCounter = 0;
  bool isFollow = false;
  bool isRequested = false;
  Future<void> checkFollowStatus() async {
    try {
      final url = Uri.parse(
          Config.buildApiUrl('/follow/get-follow-status?targetUsername=${widget.targetUsername}'));
      final response = await http.get(url, headers: {
        "Authorization":
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Implc3NpY2FAZXhhbXBsZS5jb20iLCJuYW1lIjoiSmVzc2ljYSIsInVzZXJOYW1lIjoiSmVzc2ljYSIsImV4cCI6MTc3MzE2MjkxOSwiaWF0IjoxNzcwNTcwOTE5fQ.709UJ3vIlSa5CeY7lkYUMHcgbw7mfW42FV0LqmJbZDo"
      });
      final responseDecoded = jsonDecode(response.body);
      logger.i("DEBUG Follow Status Response: $responseDecoded");
      if (response.statusCode == 200) {
        setState(() {
          isFollow = responseDecoded["data"]["isFollow"];
          isRequested = responseDecoded["data"]["isRequested"];
        });
      } else {
        logger.e("Error fetching follow status");
      }
    } catch (e) {
      logger.e("Error in checkFollowStatus: $e");
    }
  }

  @override
  void initState() {
    super.initState();
    checkFollowStatus();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      child: ElevatedButton(
          onPressed: () async {
            try {
              if (isRequested && !isFollow) {
                // Cancel Follow Request
                final url = Uri.parse(
                    Config.buildApiUrl('/follow/remove-follow-request?targetUsername=${widget.targetUsername}'));
                final response = await http.patch(url, headers: {
                  "Authorization":
                      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Implc3NpY2FAZXhhbXBsZS5jb20iLCJuYW1lIjoiSmVzc2ljYSIsInVzZXJOYW1lIjoiSmVzc2ljYSIsImV4cCI6MTc3MzE2MjkxOSwiaWF0IjoxNzcwNTcwOTE5fQ.709UJ3vIlSa5CeY7lkYUMHcgbw7mfW42FV0LqmJbZDo"
                });
                final responseDecoded = jsonDecode(response.body);
                if (response.statusCode == 201) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(responseDecoded["message"])));
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Something went wrong!")));
                }
              } else if (!isFollow && !isRequested) {
                final url = Uri.parse(Config.buildApiUrl('/follow/request'));
                final response = await http.post(url, headers: {
                  "Authorization":
                      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Implc3NpY2FAZXhhbXBsZS5jb20iLCJuYW1lIjoiSmVzc2ljYSIsInVzZXJOYW1lIjoiSmVzc2ljYSIsImV4cCI6MTc3MzE2MjkxOSwiaWF0IjoxNzcwNTcwOTE5fQ.709UJ3vIlSa5CeY7lkYUMHcgbw7mfW42FV0LqmJbZDo"
                }, body: {
                  "targetUsername": widget.targetUsername
                });
                final responseDecoded = jsonDecode(response.body);
                logger.i("DEBUG Follow Response: $responseDecoded");
                if (response.statusCode == 201) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(responseDecoded["message"])));
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Something went wrong!")));
                }
              } else if (isFollow) {
                // Unfollow
                final url = Uri.parse(
                    Config.buildApiUrl('/follow/remove-following?targetUsername=${widget.targetUsername}'));
                final response = await http.patch(url, headers: {
                  "Authorization":
                      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Implc3NpY2FAZXhhbXBsZS5jb20iLCJuYW1lIjoiSmVzc2ljYSIsInVzZXJOYW1lIjoiSmVzc2ljYSIsImV4cCI6MTc3MzE2NzcyNSwiaWF0IjoxNzcwNTc1NzI1fQ.PxMFOyGtvujbLLlSRxd3TUPEHPC6zeDjWQBZu90dbm0"
                });
                final responseDecoded = jsonDecode(response.body);
                logger.i("DEBUG Unfollow Response: $responseDecoded");
                if (response.statusCode == 201) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(responseDecoded["message"])));
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Something went wrong!")));
                }
              }
              setState(() {
                refreshCounter++;
              });
            } catch (e) {
              ScaffoldMessenger.of(context)
                  .showSnackBar(SnackBar(content: Text("Error $e")));
            } finally {
              await checkFollowStatus();
            }
          },
          child: isFollow
              ? Text("Unfollow")
              : widget.profileVisibility == "PUBLIC"
                  ? Text("Follow")
                  : isRequested
                      ? Text("Requested")
                      : Text("Request")),
    );
  }
}
