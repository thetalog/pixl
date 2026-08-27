import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pixl/features/stories/create_story.dart';
import 'package:pixl/features/auth/login.dart';
import 'package:pixl/features/home/home_layout.dart';
import 'package:pixl/state/auth_provider.dart';
import 'package:logger/logger.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:pixl/state/action_provider.dart';
import 'package:pixl/state/root_page_controller_provider.dart';

final FlutterSecureStorage secureStorage = FlutterSecureStorage();

final logger = Logger();

class ValidateJwt extends ConsumerStatefulWidget {
  const ValidateJwt({super.key});

  @override
  ConsumerState<ValidateJwt> createState() => _ValidateJwtState();
}

class _ValidateJwtState extends ConsumerState<ValidateJwt> {
  int _lastPageIndex = 1;
  bool isLoggedIn = false;
  Future<void> checkIfLoggedIn() async {
    String? token = await secureStorage.read(key: "jwt_token");
    if (token == null || token == "") {
      setState(() {
        isLoggedIn = false;
      });
    } else {
      setState(() {
        isLoggedIn = true;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _lastPageIndex = 1;
    checkIfLoggedIn();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pageController = ref.read(rootPageControllerProvider);
    return Scaffold(
      body: PageView(
        scrollDirection: Axis.horizontal,
        controller: pageController,
        onPageChanged: (index) {
          // Home (1) -> CreateStory (0) is a right-swipe gesture.
          if (_lastPageIndex == 1 && index == 0) {
            logger.i('📌 CreateStory opened via swipe right');
            ref.read(storyCreationSourceProvider.notifier).state =
                'swipe_right';
          }
          _lastPageIndex = index;
        },
        children: [
          const CreateStory(),
          ref.watch(tokenProvider).when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text("Error: $e")),
                data: (token) {
                  if (token != null) {
                    return const HomeLayout();
                  } else {
                    return const LoginScreen();
                  }
                },
              ),
        ],
      ),
    );
  }
}
