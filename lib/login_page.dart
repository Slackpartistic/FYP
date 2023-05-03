import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:idms_fyp_app/Introduction_screens/Introduction_screen1.dart';
import 'package:idms_fyp_app/Introduction_screens/Introduction_screen_masterfile.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:idms_fyp_app/registration.dart';
//import 'package:trierrapp/splash_screen.dart';
import 'package:idms_fyp_app/Home.dart';
import 'package:idms_fyp_app/splash_screen.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'Home.dart';
import 'Validation/custom_form_validation.dart';
import 'package:http/http.dart' as http;
import 'package:timezone/data/latest.dart' as timezone;
import 'package:intl/intl.dart';
import 'package:timezone/timezone.dart' as timezone;


void main() async{
  //await initializeDateFormatting('en_PK', null);
  timezone.initializeTimeZones();
  runApp(
  MaterialApp(
    home:splashscreen(),
    theme: ThemeData(
      primarySwatch: Colors.green,
    ),
  ),
  );
}

class LoginPage extends StatelessWidget {
  const LoginPage({Key? key}) : super(key: key);

  static const String _title = 'IDMS';


  @override
  Widget build(BuildContext context) {

    return MaterialApp(
        title: _title,
        home:Scaffold(
          appBar: AppBar(title: const Text(_title),
            backgroundColor: Colors.green[600],
            actions: [
              Center(
                child: Padding(
                  padding: EdgeInsets.all(15.0),
                  child: Text(
                    DateFormat('d MMM, EEE').format(DateTime.now()),
                    style: TextStyle(fontSize: 20),
                  ),
                ),
              ),
            ],
          ),
          body: const LoginScreen(),
        )
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}



class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _emailtosend;
  List<Map<String, dynamic>> data = [];
  bool _emailformat = false;


  // Future<Map<String, dynamic>> loginUser(
  //     String email,
  //     String password,
  //     ) async {
  //   final url = Uri.parse('http://192.168.18.193:3001/facultylogin?email=${email}&password=${password}');
  //   final response = await http.get(url);
  //   final decodedResponse = json.decode(response.body);
  //   final Map<String, dynamic> data = decodedResponse['data'] is List ? decodedResponse['data'] : [decodedResponse['data']];
  //   if (response.statusCode != 200) {
  //     throw Exception('${data['message']}');
  //   }
  //   return data;
  // }
  //
  // Future<String> _login() async {
  //   final String email = _emailController.text.trim();
  //   final String password = _passwordController.text.trim();
  //   try {
  //     final response = await loginUser(email, password);
  //     if (response['success'] == true) {
  //       // Do any other login-related tasks here
  //       return 'success';
  //     } else {
  //       return 'failed';
  //     }
  //   } catch (e) {
  //     return 'failed';
  //   }
  // }


  Future<String> loginUser(BuildContext context, String email, String password) async {
    //192.168.18.193:3001
    //10.97.22.58:3001 Uni ip
    final url = Uri.parse('http://192.168.18.193:3001/facultylogin?email=${email}&password=${password}');
    final response = await http.get(url);
    final decodedResponse = json.decode(response.body);
    final data = decodedResponse['data'];
    print(data); // Add this line to print the response
    if (response.statusCode != 200 || !decodedResponse['success']) {
      ScaffoldMessenger.of(context)
          .showSnackBar(
        SnackBar(
          backgroundColor: Colors
              .green[600],
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
              // TextField(
              //   controller: emailController,
              //   decoration: const InputDecoration(
              //     border: OutlineInputBorder(),
              //     labelText: 'Email',
              //   ),
              // ),

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
                  obscureText: true,
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
                  ),
                  validator: (value) {
                    if (value!.isEmpty) {
                      return 'Please enter your password';
                    }
                    return null;
                  },
                ),
              ),
              // ElevatedButton(onPressed: (){
              //   Navigator.push(
              //       context,
              //       MaterialPageRoute(
              //           builder: (context) => IntroMaster())
              //   );
              // }, child: Text('Intro')),

              // TextButton(
              //   onPressed: () {
              //     //forgot password screen
              //   },
              //   child: Text('Forgot Password?',
              //     style: TextStyle(color:Colors.green[600]),
              //   ),
              //   style: ButtonStyle(
              //     overlayColor: MaterialStateColor.resolveWith((states) => Colors.green[100]!),
              //   ),
              //
              // ),
              SizedBox(height: 20,),
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
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => MyHomePage(email: _emailController.text.trim())),
                            );
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
// Row(
//   children: <Widget>[
//     const Text('Not Registered?'),
//     TextButton(
//       child: const Text(
//         'Sign up',
//         style: TextStyle(fontSize: 20, color: Colors.green),
//       ),
//       onPressed: () {
//         Navigator.push(
//             context, MaterialPageRoute(builder:(context)=>RegistrationPage()
//         )
//         );
//         //sign-up screen
//       },
//     ),
//   ],
//   mainAxisAlignment: MainAxisAlignment.center,
// ),
