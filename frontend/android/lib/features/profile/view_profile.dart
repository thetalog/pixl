import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:pixl/features/profile/follow_or_unfollow.dart';
import 'package:pixl/features/profile/tab_view.dart';
import 'package:pixl/core/config/config.dart';

final FlutterSecureStorage secureStorage = FlutterSecureStorage();
final logger = Logger();

class ViewProfile extends StatefulWidget {
  final String userName;
  final bool isUpdateEnable;
  const ViewProfile(
      {Key? key, required this.userName, required this.isUpdateEnable})
      : super(key: key);

  @override
  State<ViewProfile> createState() => _ViewProfile();
}

class _ViewProfile extends State<ViewProfile>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic> profile = {};
  final changeNameController = TextEditingController();
  final changeUserNameController = TextEditingController();
  final oldPasswordController = TextEditingController();
  final changeNewPasswordController = TextEditingController();
  var profilePic;
  var name;
  var userName;
  var email;
  var profileVisibility;
  var isFollowed;
  var followersCount;
  var followingCount;
  late TabController _tabController;
  List<dynamic> posts = [];
  bool isProfileLoaded = false;
  bool isProfilePrivate = true;
  Future<void> _updateProfile() async {
    Uri url = Uri.parse("");
    if (changeNameController.text != "") {
      final nameValue = changeNameController.text;
      url = Uri.parse(Config.buildApiUrl("/users/update/profile"))
          .replace(queryParameters: {"username": userName, "name": nameValue});
    } else if (changeUserNameController.text != "") {
      final userNameValue = changeUserNameController.text;
      url = Uri.parse(Config.buildApiUrl("/users/update/profile")).replace(
          queryParameters: {"username": userName, "userName": userNameValue});
    } else if (changeNewPasswordController.text != "") {
      final oldPasswordValue = oldPasswordController.text;
      final newPasswordValue = changeUserNameController.text;
      if (oldPasswordValue.isEmpty || newPasswordValue.isEmpty) {
        return;
      }
      url = Uri.parse(Config.buildApiUrl("/users/update/profile"))
          .replace(queryParameters: {
        "username": userName,
        "oldPassword": oldPasswordValue,
        "newPassword": newPasswordValue
      });
    } else {
      return;
    }

    String? token = await secureStorage.read(key: "jwt_token");
    if (token == null) {
      logger.e("❌ JWT token not found");
      return;
    }
    final response = await http.patch(
      url,
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    );

    if (response.statusCode == 200) {
      logger.i("Success");
    } else {
      logger.i(response.body);
    }
    changeNameController.text = "";
    changeUserNameController.text = "";
    oldPasswordController.text = "";
    changeNewPasswordController.text = "";
  }

  Future<void> fetchDetails() async {
    final url =
        Uri.parse(Config.buildApiUrl("/users/search/get-profile-by-username"))
            .replace(
      queryParameters: {
        "username": widget.userName,
      },
    );

    String? token = await secureStorage.read(key: "jwt_token");
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Tapped on ${widget.userName}")),
    );

    final response = await http.get(
      url,
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    );
    logger.i("DEBUG Fetch profile response: ${response.body}");
    if (response.statusCode == 200) {
      final decodedResponse = jsonDecode(response.body);
      profile = decodedResponse["data"];
      profilePic = profile["profilePic"] ?? "";
      name = profile["name"] ?? "";
      userName = profile["userName"] ?? "";
      profileVisibility = profile["profileVisibility"] ?? "";
      email = profile["email"] ?? "";
      posts = profile["posts"] ?? [];
      followersCount = profile["followersCount"] ?? 0;
      followingCount = profile["followingCount"] ?? 0;
      isProfilePrivate =
          profile["profileVisibility"] == "PRIVATE" ? true : false;
      isFollowed = profile["isFollowed"] ?? false;
    } else {
      print("Error: ${response.statusCode}");
    }
    setState(() {
      isProfileLoaded = true;
    });
  }

  @override
  void initState() {
    super.initState();
    fetchDetails();
    _tabController = TabController(length: 3, vsync: this);
    print("Profile username: ${widget.userName}");
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return isProfileLoaded
        ? Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                child: Row(
                  children: [
                    Container(
                      child: Image.network(
                        profilePic == "" || profilePic == null
                            ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSLU5_eUUGBfxfxRd4IquPiEwLbt4E_6RYMw&s"
                            : profilePic,
                        height: 80,
                        width: 80,
                      ),
                    ),
                    Container(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Name: $name"),
                          Text("Username: $userName"),
                          Text("Email: $email"),
                          Text("Followers: ${profile["followersCount"] ?? 0}"),
                          Text("Following: ${profile["followingCount"] ?? 0}"),
                          isProfileLoaded
                              ? !widget.isUpdateEnable
                                  ? FollowOrUnfollow(
                                      profileVisibility: profileVisibility,
                                      targetUsername: userName,
                                    )
                                  : SizedBox.shrink()
                              : SizedBox.shrink(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              widget.isUpdateEnable
                  ? TabView(tabController: _tabController, posts: posts)
                  : isProfilePrivate
                      ? !isFollowed
                          ? Text("This profile is private")
                          : Text("This profile is private")
                      : TabView(tabController: _tabController, posts: posts),
              widget.isUpdateEnable
                  ? ElevatedButton(
                      child: Text("Update Name"),
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (innerContext) {
                            return AlertDialog(
                              title: TextField(
                                controller: changeNameController,
                              ),
                              content: Text("Update Name"),
                              actions: [
                                TextButton(
                                  onPressed: _updateProfile,
                                  child: Text("Submit"),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.pop(innerContext);
                                  },
                                  child: Text("Close"),
                                ),
                              ],
                            );
                          },
                        );
                      },
                    )
                  : SizedBox.shrink(),
              widget.isUpdateEnable
                  ? ElevatedButton(
                      child: Text("Update UserName"),
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (innerContext) {
                            return AlertDialog(
                              title: TextField(
                                controller: changeUserNameController,
                              ),
                              content: Text("Update Name"),
                              actions: [
                                TextButton(
                                  onPressed: _updateProfile,
                                  child: Text("Submit"),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.pop(innerContext);
                                  },
                                  child: Text("Close"),
                                ),
                              ],
                            );
                          },
                        );
                      },
                    )
                  : SizedBox.shrink(),
              widget.isUpdateEnable
                  ? ElevatedButton(
                      child: Text("Update Password"),
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (innerContext) {
                            return AlertDialog(
                              title: Column(
                                children: [
                                  TextField(
                                    controller: oldPasswordController,
                                  ),
                                  TextField(
                                    controller: changeNewPasswordController,
                                  ),
                                ],
                              ),
                              content: Text("Update Password"),
                              actions: [
                                TextButton(
                                  onPressed: _updateProfile,
                                  child: Text("Submit"),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.pop(innerContext);
                                  },
                                  child: Text("Close"),
                                ),
                              ],
                            );
                          },
                        );
                      },
                    )
                  : SizedBox.shrink(),
            ],
          )
        : Text("Loading");
  }
}
