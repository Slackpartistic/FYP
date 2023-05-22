import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:idms_fyp_app/Functionality/OTP/forgetpasswordpage.dart';
import 'package:idms_fyp_app/Introduction_screens/Introduction_screen1.dart';
import 'package:idms_fyp_app/Introduction_screens/Introduction_screen_masterfile.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:idms_fyp_app/registration.dart';
import 'package:idms_fyp_app/Home.dart';
import 'package:idms_fyp_app/splash_screen.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'Home.dart';
import 'Validation/custom_form_validation.dart';
import 'package:http/http.dart' as http;
import 'package:timezone/data/latest.dart' as timezone;
import 'package:intl/intl.dart';
import'package:idms_fyp_app/Functionality/markattendance.dart';
import 'package:idms_fyp_app/Functionality/papercollection.dart';
import 'Functionality/OTP/forgetpasswordpage.dart';
import 'package:riverpod/riverpod.dart';
import 'package:timezone/timezone.dart' as timezone;


void main() async {
  timezone.initializeTimeZones();
  runApp(
    MaterialApp(
      theme: ThemeData(
        primarySwatch: Colors.green,
      ),
      initialRoute: LoginPage.routeName,
      onGenerateInitialRoutes: (String initialRouteName) {
        return [
          MaterialPageRoute(
            settings: RouteSettings(name: initialRouteName),
            builder: (BuildContext context) {
              if (initialRouteName == LoginPage.routeName) {
                return LoginPage();
              }
              return Container(); // Placeholder widget
            },
          ),
        ];
      },
      onGenerateRoute: (RouteSettings settings) {
        if (settings.name == MyHomePage.routeName) {
          final email = settings.arguments as String;
          return MaterialPageRoute(
            settings: settings,
            builder: (BuildContext context) => MyHomePage(email: email),
          );
        } else if (settings.name == MarkAttendance.routeName) {
          final email = settings.arguments as String;
          return MaterialPageRoute(
            settings: settings,
            builder: (BuildContext context) => MarkAttendance(email: email),
          );
        }
        else if (settings.name == PaperCollection.routeName) {
          final email = settings.arguments as String;
          return MaterialPageRoute(
            settings: settings,
            builder: (BuildContext context) => PaperCollection(email: email),
          );
        }
        else if (settings.name == ForgetPass.routeName) {
          return MaterialPageRoute(
            settings: settings,
            builder: (BuildContext context) => ForgetPass(),
          );
        }
        return null;
      },
    ),
  );
}




class LoginPage extends StatelessWidget {
  LoginPage({Key? key}) : super(key: key);
  static const String routeName = '/login';

  static const String _title = 'IDMS';



  @override
  Widget build(BuildContext context) {

    return MaterialApp(
      debugShowCheckedModeBanner: false,
        title: _title,
        home:Scaffold(
          appBar: AppBar(title: const Text(_title),
            backgroundColor: Colors.green[600],
            actions: [
              Center(
                child: Padding(
                  padding: EdgeInsets.all(15.0),
                  child: Text(
                    DateFormat('d MMM').format(DateTime.now()),
                    style: TextStyle(fontSize: 20),
                  ),
                ),
              ),
            ],
          ),

          body: const LoginScreen(),
        ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}



class _LoginScreenState extends State<LoginScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late SharedPreferences _prefs;
  bool _isLoggedIn = false;
  String? _emailtosend;
  List<Map<String, dynamic>> data = [];
  bool _emailformat = false;
  bool passwordVisible=false;


  @override
  void initState() {
    super.initState();
    // navigateToHomeIfLoggedIn();
  }

  // Future<void> navigateToHomeIfLoggedIn() async {
  //   _prefs = await SharedPreferences.getInstance();
  //   _isLoggedIn = _prefs.getBool('isLoggedIn') ?? false;
  //
  //   if (_isLoggedIn) {
  //     navigateToHome();
  //   }
  // }





  Future<String> loginUser(BuildContext context, String email, String password) async {
    final url = Uri.parse('http://your-ip:3001/facultylogin?email=${email}&password=${password}');
    final response = await http.get(url);
    final decodedResponse = json.decode(response.body);
    final data = decodedResponse['data'];
    if (response.statusCode != 200 || !decodedResponse['success']) {
      ScaffoldMessenger.of(context)
          .showSnackBar(
        SnackBar(
          backgroundColor: Colors
              .red,
          content: Text(
              'Server error.'),
          duration: Duration(
              seconds: 1),
        ),
      );
      return 'failed';
    }
    return 'success';
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: ListView(
            children: <Widget>[
              Container(
                  alignment: Alignment.center,
                  padding: const EdgeInsets.all(10),
                  child: Text(
                    'Bahria University',
                    style: TextStyle(
                        color: Colors.green[600],
                        fontWeight: FontWeight.w500,
                        fontSize: 30),
                  )),
              Container(
                  alignment: Alignment.center,
                  padding: const EdgeInsets.all(10),
                  child: const Text(
                    'Faculty Sign-In',
                    style: TextStyle(fontSize: 20),
                  )),

              CustomFormField(
                  hintText: 'Email',
                  labelText: 'Email',
                  controller: _emailController,
                  validator: (value) {
                  if (value!.isEmpty) {
                    return 'Please enter your email';
                  }
                  else {
                    if (value!.isValidEmail){
                      _emailformat=true;
                    }
                    else
                      {
                        return 'Email format: someone@example.com';
                      }
                  }
                  return null;
                },
              ),

              Container(
                padding: const EdgeInsets.fromLTRB(10, 10, 10, 0),
                child: TextFormField(
                  obscureText: !passwordVisible,
                  cursorColor: Colors.green,
                  controller: _passwordController,
                  decoration: InputDecoration(
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(color: Colors.green),
                        borderRadius: BorderRadius.circular(15.0)
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(15.0)
                    ),
                    hintText: 'Password',
                    labelText: 'Password',
                    focusColor: Colors.green,
                    suffixIcon: IconButton(
                      icon: Icon(passwordVisible
                          ? Icons.visibility
                          : Icons.visibility_off),
                      color: Colors.green[600],
                      onPressed: () {
                        setState(
                              () {
                            passwordVisible = !passwordVisible;
                          },
                        );
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value!.isEmpty) {
                      return 'Please enter your password';
                    }
                    return null;
                  },
                ),
              ),

              Container(
                child: TextButton(
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.all(16.0),
                    textStyle: const TextStyle(fontSize: 16),
                  ),
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context)=>ForgetPass()));
                  },
                  child: const Text('Forgot Password?',style: TextStyle(color: Colors.green),),
                ),
                ),

              Container(
                height: 50,
                padding: const EdgeInsets.fromLTRB(10, 0, 10, 0),
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      primary: Colors.green[600],
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15.0),
                    ),
                  ),
                  child: const Text('Login'),
                  onPressed: () async {
                    if (_formKey.currentState!.validate()) {
                      if (_emailformat == true) {
                        final loginresponse = await loginUser(context,_emailController.text.trim(), _passwordController.text.trim());
                        if (loginresponse=='success') {
                            Navigator.push(context, MaterialPageRoute(builder: (context)=>MyHomePage(email: _emailController.text.trim())));
                
                        }
                        else{
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Login failed. Please try again.')),
                          );
                        }
                      }
                    }
                    else {
                      // Invalid email or password
                      print('Invalid input');
                    }
                  },
                ),
              ),
            ]),
      ),
    );
  }
}
