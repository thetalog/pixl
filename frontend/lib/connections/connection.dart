import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../providers/auth_provider.dart';
import '../providers/mapping_follow_user.dart';
import 'package:pixl/config.dart';

enum FollowStatus {
  PENDING,
  ACCEPTED,
  REJECTED,
  UNFOLLOWED,
  BLOCKED,
  UNBLOCKED
}

enum ActionStatus {
  PENDING,
  ACCEPTED,
  REJECTED,
  UNFOLLOW,
  BLOCK,
  UNBLOCK,
  NONE,
  REQUEST
}

class Connection extends ConsumerStatefulWidget {
  const Connection({Key? key, required this.targetUsername}) : super(key: key);

  final String targetUsername;

  @override
  ConsumerState<Connection> createState() => _ConnectionState();
}

class _ConnectionState extends ConsumerState<Connection> {
  String followButtonText = "Undefined";
  String requestStatus = "Pending";
  var mappingFollowUserAsync;
  var tokenAsync;
  @override
  void initState() {
    tokenAsync = ref.read(tokenProvider);
    mappingFollowUserAsync = ref.read(mappingFollowUserProvider);
    final url = Uri.parse(
      Config.buildApiUrl('/follow/get-follow-status?targetUsername=${widget.targetUsername}'),
    );
    Future<void> _getFollowStatus() async {
      final response = await http.get(
        url,
        headers: {
          "Authorization": "Bearer $tokenAsync",
          "Content-Type": "application/json",
        },
      );

      final decodedBody = jsonDecode(response.body);

      final details = decodedBody["details"];

      setState(() {
        if (details == null) {
          followButtonText = "Undefined";
        } else if (details == "Target User Does not Exist") {
          followButtonText = "User Not Exist";
        } else {
          followButtonText = details.toString();
          requestStatus = details.toString();
        }
      });
    }

    _getFollowStatus();
    super.initState();
  }

  void onPressed() async {
    ActionStatus action = ActionStatus.NONE;
    String targetUsername = mappingFollowUserAsync.targetUser;
    String followAction = mappingFollowUserAsync.action;
    final url = Uri.parse(
      Config.buildApiUrl('/follow/actions?target-username=$targetUsername&action=$followAction'),
    );
    if (requestStatus == ActionStatus.ACCEPTED) {
      action = ActionStatus.UNFOLLOW;
    } else if (requestStatus == ActionStatus.REJECTED) {
      action = ActionStatus.REQUEST;
    } else if (requestStatus == ActionStatus.BLOCK) {
      action = ActionStatus.UNBLOCK;
    } else if (requestStatus == ActionStatus.UNFOLLOW) {
      action = ActionStatus.REQUEST;
    } else if (requestStatus == ActionStatus.PENDING) {
      action = ActionStatus.NONE;
    } else if (requestStatus == ActionStatus.UNBLOCK) {
      action = ActionStatus.REQUEST;
    }
    final response = await http.get(
      url,
      headers: {
        "Authorization": "Bearer $tokenAsync",
        "Content-Type": "application/json",
      },
    );
    final decodedBody = jsonDecode(response.body);

    final details = decodedBody["details"];
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ElevatedButton(
          onPressed: onPressed,
          child: Text(followButtonText),
        ),
      ],
    );
  }
}
