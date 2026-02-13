import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pixl/core/widgets/create_action_dropdown.dart';
import 'package:pixl/features/stories/create_story.dart';
import 'package:pixl/features/auth/login.dart';
import 'package:pixl/core/routes/screen_router.dart';
import 'package:pixl/state/auth_provider.dart';
import 'package:logger/logger.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final FlutterSecureStorage secureStorage = FlutterSecureStorage();

final logger = Logger();

class MyAppHome extends ConsumerStatefulWidget {
  const MyAppHome({super.key});

  @override
  ConsumerState<MyAppHome> createState() => _MyAppHomeState();
}

class _MyAppHomeState extends ConsumerState<MyAppHome> {
  final PageController _pageViewController = PageController(initialPage: 1);
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
    checkIfLoggedIn();
  }

  @override
  Widget build(BuildContext context) {
    final tokenAsync = ref.watch(tokenProvider);
    final profileAsync = ref.watch(profileProvider);
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text(
              'Pixl',
              style: TextStyle(fontFamily: 'Lekerli-one', fontSize: 18),
            ),
            const Expanded(child: SizedBox(), flex: 6),
            isLoggedIn
                ? Expanded(
                    flex: 4,
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: CreateActionDropdown(),
                    ),
                  )
                : SizedBox.shrink(),
          ],
        ),
        backgroundColor: const Color(0xFF0D1B2A),
        foregroundColor: Colors.white,
        toolbarHeight: 30,
      ),
      body: PageView(
        scrollDirection: Axis.horizontal,
        controller: _pageViewController,
        children: [
          const CreateStory(),
          tokenAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text("Error: $e")),
            data: (token) {
              if (token != null) {
                return const ScreenRouter();
              }
              return const LoginScreen();
            },
          ),
        ],
      ),
    );
  }
}
