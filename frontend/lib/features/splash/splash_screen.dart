import 'package:flutter/material.dart';
import '../../home.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreen();
}

class _SplashScreen extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    // TODO: implement initState
    super.initState();

    _controller =
        AnimationController(vsync: this, duration: const Duration(seconds: 1))
          ..forward();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(seconds: 3), () {
        if (!mounted) return;

        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const MyAppHome()),
        );
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: ScaleTransition(
            scale:
                CurvedAnimation(parent: _controller, curve: Curves.easeInCubic),
            child: Image.asset(
              "assets/icons/Icon.png",
              width: 120,
            ),
          ),
        ));
  }
}
