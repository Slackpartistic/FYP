import 'package:animated_splash_screen/animated_splash_screen.dart';
import 'package:flutter/material.dart';
import 'package:idms_fyp_app/login_page.dart';

class splashscreen extends StatelessWidget {
  const splashscreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: AnimatedSplashScreen(
        duration: 900,
        splash: 'assets/IDMSsplash-enhance.png',
        nextScreen: LoginPage(),
        splashTransition: SplashTransition.slideTransition,
        backgroundColor: Colors.green.shade100,
      ),
    );
  }
}
