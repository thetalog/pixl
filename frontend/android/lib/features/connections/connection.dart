import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../../state/auth_provider.dart';
import '../../state/mapping_follow_user.dart';
import 'package:pixl/core/config/config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

final logger = Logger();

final FlutterSecureStorage secureStorage = FlutterSecureStorage();

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
  @override
  void initState() {
    mappingFollowUserAsync = ref.read(mappingFollowUserProvider);

    Future<void> _getFollowStatus() async {
      String? token = await secureStorage.read(key: "jwt_token");
      if (token == null) {
        logger.e("❌ JWT token not found");
        return;
      }
      final url = Uri.parse(
        Config.buildApiUrl(
            '/follow/get-follow-status?targetUsername=${widget.targetUsername}'),
      );
      final response = await http.get(
        url,
        headers: {
          "Authorization": "Bearer $token",
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
    String? token = await secureStorage.read(key: "jwt_token");
    String targetUsername = mappingFollowUserAsync.targetUser;
    String followAction = mappingFollowUserAsync.action;
    final url = Uri.parse(
      Config.buildApiUrl(
          '/follow/actions?target-username=$targetUsername&action=$followAction'),
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
        "Authorization": "Bearer $token",
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
