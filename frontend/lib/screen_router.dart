import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:pixl/profile/view_profile.dart';
import 'searchOrExplore/search.dart';
import 'searchOrExplore/explore.dart';
import './connections/connection.dart';
import 'post/view_followed_public_posts.dart';
import './reel/show_reel.dart';
import './home_screen.dart';
import './providers/auth_provider.dart';
import 'package:logger/logger.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _secureStorage = FlutterSecureStorage();

final logger = Logger();

enum HomePageTab {
  feed,
  search,
  reel,
  location,
  profile,
}

class ScreenRouter extends ConsumerStatefulWidget {
  const ScreenRouter({Key? key}) : super(key: key);

  @override
  ConsumerState<ScreenRouter> createState() => _ScreenRouter();
}

class _ScreenRouter extends ConsumerState<ScreenRouter> {
  HomePageTab currentTab = HomePageTab.feed;
  String ownUserName = "";
  Future<void> loadUserNameProvider() async {
    ownUserName = await _secureStorage.read(key: 'profile_username') ?? "";
  }

  @override
  void initState() {
    super.initState();
    loadUserNameProvider();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // ✅ show different text based on selected tab
      body: Stack(
        children: [
          currentTab.name == 'search'
              ? ExplorePage()
              : currentTab.name == 'feed'
                  ? HomeScreen()
                  : currentTab.name == 'reel'
                      ? ShowReel()
                      : currentTab.name == 'profile'
                          ? ViewProfile(
                              userName: ownUserName,
                              isUpdateEnable: true,
                            )
                          : Text('Current Tab: ${currentTab.name}'),
        ],
      ),

      bottomNavigationBar: BottomAppBar(
        height: 55,
        color: const Color(0xFF1B263B),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            _navIcon(
              icon: Icons.home,
              tab: HomePageTab.feed,
            ),
            _navIcon(
              icon: Icons.search,
              tab: HomePageTab.search,
            ),
            _navIcon(
              icon: Icons.video_camera_front_rounded,
              tab: HomePageTab.reel,
            ),
            _navIcon(
              icon: Icons.location_pin,
              tab: HomePageTab.location,
            ),
            _navIcon(
              icon: Icons.person,
              tab: HomePageTab.profile,
            ),
          ],
        ),
      ),
    );
  }

  Widget _navIcon({
    required IconData icon,
    required HomePageTab tab,
  }) {
    final bool isActive = currentTab == tab;

    return IconButton(
      onPressed: () {
        setState(() {
          currentTab = tab; // ✅ store current page in enum
        });
      },
      icon: Icon(
        icon,
        color: isActive ? Colors.white : Colors.grey,
        size: 28,
      ),
    );
  }
}
