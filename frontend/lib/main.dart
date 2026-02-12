import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:pixl/core/widgets/create_action_dropdown.dart';
import 'package:pixl/features/post/create_post.dart';
import 'package:pixl/features/profile/view_profile.dart';
import 'package:pixl/features/stories/create_story.dart';
import 'state/auth_provider.dart';
import 'state/mapping_follow_user.dart';
import 'core/routes/screen_router.dart';
import 'features/auth/login.dart';
import 'core/routes/deep_link_service.dart';
import 'core/routes/navigator_key.dart';
import 'package:app_links/app_links.dart';
import 'features/post/view_post.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'core/services/firebase_options.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:logger/logger.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:pixl/core/config/config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'features/splash/splash_screen.dart';

final FlutterSecureStorage secureStorage = FlutterSecureStorage();

const _secureStorage = FlutterSecureStorage();
final deepLinkService = DeepLinkService();

final logger = Logger();
Future<void> _checkPermissions() async {
  var status = await Permission.bluetooth.request();
  if (status.isPermanentlyDenied) {
    print('Bluetooth Permission disabled');
  }
  status = await Permission.bluetoothConnect.request();
  if (status.isPermanentlyDenied) {
    print('Bluetooth Connect Permission disabled');
  }
}

void main() async {
  // debugPaintSizeEnabled = true;
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  await _checkPermissions();
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.dumpErrorToConsole(details);
  };
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  void setupFirebaseMessaging() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null) {
        // Show notification when app is in foreground
        print(
            'Foreground notification: ${notification.title} - ${notification.body}');
      }
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('Notification clicked when app was in background');
    });
  }

  setupFirebaseMessaging();
  await FirebaseMessaging.instance.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );
  await FirebaseMessaging.instance.getToken();
  final token = await _secureStorage.read(key: 'jwt_token');

  deepLinkService.startListening();
  final AppLinks _appLinks = AppLinks();
  Future<dynamic> fetchPost(postId) async {
    final String apiUrl =
        Config.buildApiUrl('/posts/get-single-public-posts?postId=$postId');

    final res = await http.get(
      Uri.parse(apiUrl),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    );

    if (res.statusCode != 200) {
      throw Exception("Failed: ${res.statusCode} | ${res.body}");
    }

    final jsonData = jsonDecode(res.body);
    final post = jsonData["data"];
    return post;
  }

  void handleLink(Uri uri) async {
    print("Opened via link: $uri");

    final postId = uri.queryParameters['postId'];
    final by = uri.queryParameters['by'];

    print("postId = $postId");
    print("by = $by");

    if (postId == null || postId.isEmpty) {
      print("Invalid deep link: missing postId");
      return;
    }

    try {
      final post = await fetchPost(postId);

      if (post == null) {
        print("Post not found");
        return;
      }

      navigatorKey.currentState?.push(
        MaterialPageRoute(
          builder: (_) => ViewPost(
            post: post,
            byShareId: by,
            canEdit: false,
          ),
        ),
      );
    } catch (e) {
      print("Error fetching post: $e");
    }
  }

  Future<void> initDeepLinks() async {
    // App opened from terminated state
    final Uri? initialUri = await _appLinks.getInitialLink();
    if (initialUri != null) {
      handleLink(initialUri);
    }

    // App opened from background
    _appLinks.uriLinkStream.listen((Uri uri) {
      handleLink(uri);
    });
  }

  await initDeepLinks();
  runApp(
    ProviderScope(
      child: MyApp(),
    ),
  );
}

// ✅ MyApp is now ConsumerWidget (NOT StatefulWidget)
class MyApp extends ConsumerStatefulWidget {
  MyApp({super.key});
  @override
  ConsumerState<MyApp> createState() => _MyAppState();
}

class _MyAppState extends ConsumerState<MyApp> {
  final _pageViewController = PageController(initialPage: 1);

  Future<void> loadUserNameProvider() async {
    final userName = await _secureStorage.read(key: 'profile_username');
    logger.i("Loaded username from secure storage: $userName");
    if (!mounted) return;
    if (userName != null && userName.isNotEmpty) {
      await ref.read(profileProvider.notifier).updateUsername(userName);
    } else {
      // optional: set empty or skip
      await ref.read(profileProvider.notifier).updateUsername("");
    }
  }

  @override
  void initState() {
    super.initState();
    loadUserNameProvider();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(navigatorKey: navigatorKey, home: const SplashScreen());
  }
}
