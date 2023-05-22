
import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:idms_fyp_app/Functionality/markattendance.dart';
import 'package:idms_fyp_app/Functionality/papercollection.dart';
import 'package:idms_fyp_app/Functionality/viewhistory.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'login_page.dart';
import 'splash_screen.dart';
import 'package:mysql1/mysql1.dart';
import 'package:intl/intl.dart';
import 'package:riverpod/riverpod.dart';
import 'package:timezone/data/latest.dart' as timezone;
import 'package:timezone/timezone.dart' as timezone;

import 'package:shared_preferences/shared_preferences.dart';
//import 'package:flutter/widgets/nav-drawer.dart';





Future<List<dynamic>> fetchFacultyData(String email) async {
  final response = await http.get(Uri.parse('http://your-ip:3001/fetchfacultydata?email=$email'));
  if (response.statusCode == 200) {
    return jsonDecode(response.body)['data'];
  } else {
    throw Exception('Failed to fetch data');
  }
}

class CustomNavigatorObserver extends NavigatorObserver {
  final VoidCallback fetchSessionDataCallback;

  CustomNavigatorObserver(this.fetchSessionDataCallback);

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    fetchSessionDataCallback();
  }
}

class MyHomePage extends StatefulWidget {
  static const String routeName = '/home';
  final String email;
  MyHomePage({required this.email});
  @override
  State<MyHomePage> createState() => _MyHomePageState();


}



class _MyHomePageState extends State<MyHomePage> {
  List<dynamic> _data = [];
  List<dynamic> _sessionData=[];
  bool _inLocation = false;
  bool _isSessionTime=false;
  String? _currentSession;
  bool _markbuttonvisible=false;
  bool _papercollectionbuttonvisible=false;
  bool _colatttrutextvisible=false;
  bool _attendanceabsentpapercollected=false;
  bool _attendanceabsentpapernotcollected=false;
  bool _attabstextvisible=false;
  final myHomePageRouteName = MyHomePage.routeName;
  final markAttendanceRouteName = MarkAttendance.routeName;
  bool _dataisfetched=false;
  bool _inRange=false;
  double _storerange=0.0;
  late SharedPreferences _prefs;
  bool _isLoggedIn = false;





  @override
  void initState() {
    super.initState();
    navigatorObservers: [
      CustomNavigatorObserver(_fetchSessionData),
    ];
    _fetchSessionData();
    _fetchRangeData().then((_) {
      _checkConstrainedLocation();
    });
    _fetchData();
  }



  Future<void> _fetchData() async {
    try {
      final data = await fetchFacultyData(widget.email);
      if (data.isNotEmpty) {
        setState(() {
          _data = data;
          _dataisfetched=true;
        });
      }
    } catch (e) {
      print(e);
    }
  }



  Future<void> _checkConstrainedLocation() async {
      bool isWithinConstrainedLocation = false;
      LocationPermission permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: Text('Location Permission Required'),
              content:
              Text(
                  'This app needs access to your location to function properly.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('Cancel'),
                ),
                TextButton(
                  onPressed: () =>
                  {
                    Navigator.pop(context),
                    Geolocator.openAppSettings(),
                  },
                  child: Text('Settings'),
                ),
              ],
            );
          },
        );
      } else if (permission == LocationPermission.deniedForever) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: Text('Location Permission Required'),
              content: Text(
                  'You have permanently denied location permission to this app. Please go to settings to grant permission.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('OK'),
                ),
              ],
            );
          },
        );
      } else {
        // Check if the user is within the constrained location
        isWithinConstrainedLocation = await isWithinLocation();
      }
      setState(() {
        _inLocation = isWithinConstrainedLocation;
      });
    }

  Future<Position> getCurrentLocation() async {
    Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high);
    return position;
  }

  Future<bool> isWithinLocation() async {
    double lat = 'your latitude';
    double long = 'your longitude';
    double distanceInMeters = _storerange;
    Position position = await getCurrentLocation();
    double distance = Geolocator.distanceBetween(lat, long, position.latitude, position.longitude);
      return (distance <= distanceInMeters);
  }

  Future<Map<String, dynamic>> fetchSession(String email) async {
    final response = await http.get(Uri.parse('http://your-ip:3001/getsession?email=$email'));
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      print(response.body);
      final papercolstat = jsonDecode(response.body)['statusbasedonsession'];
      final attendstat = jsonDecode(response.body)['attendancestatus'];
      final sessionData = jsonDecode(response.body)['sessionData'];
      final storepapercolstat = papercolstat.toString().trim();
      final storeattendstat = attendstat.toString().trim();
      final storesessiondata = sessionData.toString().trim();
      final currentTime = DateTime.now().millisecondsSinceEpoch;
      final collectionval = storepapercolstat;
      final attendval = storeattendstat;
      final session = storesessiondata;

      print('Returned session from fetchSession(): $session');
      return {
        'currentSession': session,
        'papercolstat': collectionval,
        'attendstat': attendval,
      };
    } else {
      throw Exception('Failed to fetch session data');
    }
  }


  Future<void> _fetchSessionData() async {
    try {
      final sessionData = await fetchSession(widget.email);
      print('Received session value in _fetchSessionData(): ${sessionData['currentSession']}');
      print('Received paper collection value in _fetchSessionData(): ${sessionData['papercolstat']}');
      print('Received attendance value in _fetchSessionData(): ${sessionData['attendstat']}');
      final currentSession = sessionData['currentSession'];
      final collectionvalue = sessionData['papercolstat'].toString().trim();
      final attendancevalue = sessionData['attendstat'].toString().trim();

      setState(() {
        _isSessionTime = currentSession != null;
        _currentSession = currentSession;
      });

      if (attendancevalue == 'A') {
        if (collectionvalue !='Collected')
        setState(() {
          _papercollectionbuttonvisible = false;
          _markbuttonvisible = true;
          _attendanceabsentpapercollected=false;
          _attendanceabsentpapernotcollected=true;
        });
        else{
          setState(() {
            _papercollectionbuttonvisible = false;
            _markbuttonvisible = true;
            _attendanceabsentpapercollected=true;
            _attendanceabsentpapernotcollected=false;
          });
        }
      } else if (attendancevalue == 'P') {
        if (collectionvalue != 'Collected') {
          setState(() {
            _papercollectionbuttonvisible = true;
            _markbuttonvisible = false;
            _attendanceabsentpapercollected=false;
            _attendanceabsentpapernotcollected=true;
          });
        } else {
          setState(() {
            _papercollectionbuttonvisible = false;
            _markbuttonvisible = false;
            _colatttrutextvisible=true;
            _attendanceabsentpapercollected=false;
            _attendanceabsentpapernotcollected=false;
          });
        }
      }
    } catch (e) {
      print('Failed to fetch session data: $e');
    }
  }

  Future<double?> fetchRange(String email) async {
    final response = await http.get(Uri.parse('http://your-ip:3001/getsession?email=$email'));
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      final range = double.tryParse(responseData['range'].toString().trim());
      print('Fetched range: $range');
      return range;
    } else {
      throw Exception('Failed to fetch range data');
    }
  }

  Future<void> _fetchRangeData() async {
    try {
      final range = await fetchRange(widget.email);
      setState(() {
        _inRange = range != null;
        _storerange = range ?? 0.0;
      });
    } catch (e) {
      print('Failed to fetch range data: $e');
    }
  }





  void navigateToMarkAttendance() {
    if (_inLocation && _isSessionTime &&_markbuttonvisible) {
      Navigator.pop(context);
      Navigator.push(context, MaterialPageRoute(builder: (context) => MarkAttendance(email: widget.email)));
    }
    else {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Attendance not allowed outside of session timings or outside of defined location or your attendance is already marked.'),
        duration: Duration(seconds: 4),
      ));
    }
  }

  void navigateToPaperCollection() {
    if (_inLocation && _isSessionTime &&_papercollectionbuttonvisible) {
      Navigator.pop(context);
      Navigator.push(context, MaterialPageRoute(builder: (context) => PaperCollection(email: widget.email)));
    } else {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Paper collection not allowed outside of session timings or outside of defined location or paper collection is already marked.'),
        duration: Duration(seconds: 4),
      ));
    }
  }

  // void _logout() {
  //   _prefs.setBool('isLoggedIn', false);
  //   navigateToLogin();
  // }
  //
  // void navigateToLogin() {
  //   Navigator.of(context).pushReplacement(
  //     MaterialPageRoute(builder: (BuildContext context) => LoginPage()),
  //   );
  // }

  @override
  Widget build(BuildContext context) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Home'),
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
        extendBodyBehindAppBar: false,
        drawer: Drawer(
          child: ListView(

            padding: EdgeInsets.zero,
            children: <Widget>[
              DrawerHeader(
                child: Text(
                  'Menu',
                  style: TextStyle(color: Colors.white, fontSize: 25),
                ),
                decoration: BoxDecoration(
                  color: Colors.green,
                  // image: DecorationImage(
                  //     fit: BoxFit.scaleDown,
                  //   image: AssetImage('assets/IDMSsplash.png')
                  // )
                ),
              ),
              ListTile(
                leading: Icon(Icons.verified_user),
                title: Text('Mark attendance'),
                onTap: navigateToMarkAttendance,
              ),
              ListTile(
                leading: Icon(Icons.file_open),
                title: Text('Paper Collection'),
                onTap: navigateToPaperCollection,
              ),
              ListTile(
                leading: Icon(Icons.history),
                title: Text('View attendance history'),
                onTap: () => {
                  Navigator.pop(context),

                  Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => ViewAttendance(email: widget.email))
                  )
                },
              ),
              ListTile(
                leading: Icon(Icons.transit_enterexit),
                title: Text('Log out'),
                onTap: () => {
                  Navigator.of(context).pop(),
                showDialog(
                context: context,
                builder: (BuildContext context) => AlertDialog(
                title: Text(
                'Are you sure you want to logout?',
                style: TextStyle(fontWeight: FontWeight.bold),
                ),
                actions: [
                TextButton(
                child: Text(
                'Yes',
                style: TextStyle(color: Colors.red),
                ),
                onPressed: () async {
                Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => LoginPage()),
                );
                },
                ),
                TextButton(
                child: Text(
                'No',
                style: TextStyle(color: Colors.green),
                ),
                onPressed: () {
                Navigator.of(context).pop();
                // Close the dialog
                },
                ),
                ],
                ),
                ),


                },
              ),
            ],
          ),
        ),
        body: Column(

          children: [

            SingleChildScrollView(

              scrollDirection: Axis.horizontal,
              child: Visibility(
                visible: !_dataisfetched,
                child: CircularProgressIndicator(),
                replacement: DataTable(
                  columns: [
                    DataColumn(label: Text('Session')),
                    DataColumn(label: Text('Room')),
                    DataColumn(label: Text('Date')),
                  ],
                  rows: _data.map((row) {
                    final attendanceValue = row['Status'] ?? '';

                    Color rowColor = Colors.transparent;
                    if (attendanceValue=='P') {
                    rowColor = Colors.green.shade100;
                    }
                    return DataRow(
                      color: MaterialStateColor.resolveWith((states) => rowColor),
                      cells: [
                        DataCell(SizedBox(width: 50,child: Text(row['Session'].toString() ?? '',textAlign: TextAlign.center))),
                        DataCell(Text(row['Room'] ?? '')),
                        DataCell(
                          Text(
                            row['Date'] != null
                                ? (() {
                              final dateTime = DateTime.parse(row['Date']).toLocal();
                              final location = timezone.getLocation('Asia/Karachi');
                              final pakistanTime = timezone.TZDateTime.from(dateTime, location);
                              final formattedDate =
                              DateFormat('dd-MMMM-yyyy').format(pakistanTime);
                              return formattedDate;
                            })()
                                : '',
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ),
            Container(
              height: 50.0,
            ),
            Center(
              child: Visibility(
                visible: _markbuttonvisible,
                child: Builder(
                  builder: (context) {
                    return ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        elevation: 3.0,
                        backgroundColor: _inLocation && _currentSession.toString() != [] ? Colors.green[600] : Colors.grey,
                      ),
                      onPressed: _inLocation ? () {
                        if (_currentSession != null) {
                          if (_isSessionTime) {
                            Navigator.push(context, MaterialPageRoute(
                                builder: (context) => MarkAttendance(email: widget.email),
                              ),
                            );
                          }
                          else{
                            showDialog(
                              context: context,
                              builder: (BuildContext context) {
                                return AlertDialog(
                                  title: Text('No records found!',style: TextStyle(fontWeight: FontWeight.bold),),
                                  content: Text(
                                      'You can not mark attendance as no duty has been assigned to you for the current session.'),
                                  actions: <Widget>[
                                    TextButton(
                                      child: Text('OK'),
                                      onPressed: () {
                                        Navigator.of(context).pop();
                                      },
                                    ),
                                  ],
                                );
                              },
                            );
                          }
                        }
                      }
                          :(){
                          showDialog(
                            context: context,
                            builder: (BuildContext context) {
                              return AlertDialog(
                                title: Text('Out of defined location!',style: TextStyle(fontWeight: FontWeight.bold),),
                                content: Text(
                                    'You are not within the premises of Bahria University.'),
                                actions: <Widget>[
                                  TextButton(
                                    child: Text('OK'),
                                    onPressed: () {
                                      Navigator.of(context).pop();
                                    },
                                  ),
                                ],
                              );
                            },
                          );
      },
                      child: Text('Mark Attendance',style: TextStyle(fontSize: 20),),
                    );
                  }
                ),
              ),
            ),

            Center(
              child: Visibility(
                visible: _papercollectionbuttonvisible,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    elevation: 3.0,
                    //backgroundColor: Colors.green[600],
                    primary:  _inLocation ? Colors.green[600] : Colors.grey
                    //
                  ),
                  onPressed: _inLocation ? () {
                    if (_currentSession != null) {
                      if (_isSessionTime) {
                        Navigator.push(context, MaterialPageRoute(
                            builder: (context) =>
                                PaperCollection(email: widget.email)));
                      }
                      else{
                        showDialog(
                          context: context,
                          builder: (BuildContext context) {
                            return AlertDialog(
                              title: Text('No records found!',style: TextStyle(fontWeight: FontWeight.bold),),
                              content: Text(
                                  'You can not mark attendance as no duty has been assigned to you for the current session.'),
                              actions: <Widget>[
                                TextButton(
                                  child: Text('OK'),
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                  },
                                ),
                              ],
                            );
                          },
                        );
                      }
                    }
                  }
                      :(){
                    showDialog(
                      context: context,
                      builder: (BuildContext context) {
                        return AlertDialog(
                          title: Text('Out of defined location!',style: TextStyle(fontWeight: FontWeight.bold),),
                          content: Text(
                              'You are not within the premises of Bahria University.'),
                          actions: <Widget>[
                            TextButton(
                              child: Text('OK'),
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                            ),
                          ],
                        );
                      },
                    );
                  },
                  child: Text('Paper Collection',style: TextStyle(fontSize: 20),),
                ),
              ),
            ),
            Center(
              child: Visibility(
                visible: _colatttrutextvisible,
                child: Card(
                  margin: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      ListTile(
                        title: const Text('Your attendance has been marked and paper has been collected.',textAlign: TextAlign.center,style: TextStyle(color: Colors.green),),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Center(
              child: Visibility(
                visible: _attendanceabsentpapercollected,
                child: Card(
                  margin: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      ListTile(
                        title: const Text('Paper has been collected.',textAlign: TextAlign.center,style: TextStyle(color: Colors.green),),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Center(
              child: Visibility(
                visible: _attendanceabsentpapernotcollected,
                child: Card(
                  margin: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      ListTile(
                        title: const Text('Paper has not been collected.',textAlign: TextAlign.center,style: TextStyle(color: Colors.green),),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            
          ],
        ),
          );
  }
}
