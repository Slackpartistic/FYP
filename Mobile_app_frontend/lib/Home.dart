
import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:idms_fyp_app/Functionality/markattendance.dart';
import 'package:idms_fyp_app/Functionality/papercollection.dart';
import 'package:idms_fyp_app/Functionality/viewhistory.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'login_page.dart';
import 'package:intl/intl.dart';
import 'package:timezone/data/latest.dart' as timezone;
import 'package:timezone/timezone.dart' as timezone;

import 'package:shared_preferences/shared_preferences.dart';
//import 'package:flutter/widgets/nav-drawer.dart';



String _userName = '';

// class dropdown extends StatefulWidget {
//   const dropdown({Key? key}) : super(key: key);
//
//   @override
//   _dropdownState createState() =>_dropdownState();
// }

// class _dropdownState extends State<dropdown> {
//
//   // Initial Selected Value
//   String dropdownvalue = 'Session 1';
//
//   // List of items in our dropdown menu
//   var items = [
//     'Session 1',
//     'Session 2',
//     'Session 3',
//     'Session 4'
//   ];
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: const Text("dropdown example"),
//       ),
//       body:Center (
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//
//             // DropdownButton(
//             //
//             //   // Initial Value
//             //   value: dropdownvalue,
//             //
//             //   // Down Arrow Icon
//             //   icon: const Icon(Icons.keyboard_arrow_down),
//             //
//             //   // Array list of items
//             //   items: items.map((String items) {
//             //     return DropdownMenuItem(
//             //       value: items,
//             //       child: Text(items),
//             //     );
//             //   }).toList(),
//             //   // After selecting the desired option,it will
//             //   // change button value to selected value
//             //   onChanged: (String? newValue) {
//             //     setState(() {
//             //       dropdownvalue = newValue!;
//             //     });
//             //   },
//             // ),
//         ),
//       ),
//     );
//   }
// }




Future<List<dynamic>> fetchFacultyData(String email) async {
  final response = await http.get(Uri.parse('http://yourip:3001/fetchfacultydata?email=$email'));
  if (response.statusCode == 200) {
    return jsonDecode(response.body)['data'];
  } else {
    throw Exception('Failed to fetch data');
  }
}

class MyHomePage extends StatefulWidget {
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





  @override
  void initState() {
    super.initState();
    _fetchData();
    _checkConstrainedLocation();
    _fetchSessionData();
  }



  Future<void> _fetchData() async {
    try {
      final data = await fetchFacultyData(widget.email);
      if (data.isNotEmpty) {
        setState(() {
          _data = data;
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


  // void getCurrentposition() async {
  //   LocationPermission permission = await Geolocator.checkPermission();
  //
  //   if(permission==LocationPermission.denied || permission==LocationPermission.deniedForever){
  //     print("Permission denied");
  //     LocationPermission reqloc= await Geolocator.requestPermission();
  //   }
  //   else{
  //     Position currentPosition = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.best);
  //     print("Latitude:"+currentPosition.latitude.toString());
  //     print("Longitude: "+currentPosition.longitude.toString());
  //
  //   }
  // }

  // Request permission to access location

  Future<Position> getCurrentLocation() async {
    Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high);
    return position;
  }

  Future<bool> isWithinLocation() async {
    double lat = 33.591293;
    double long = 73.062527;
    double distanceInMeters = 600;
    Position position = await getCurrentLocation();
    double distance = Geolocator.distanceBetween(lat, long, position.latitude, position.longitude);
    //33.591293, 73.062527 home location
    //33.7156261, 73.028800 Uni location
    //78.543532 random location for debugging
    return (distance <= distanceInMeters);
  }

  Future<Map<String, dynamic>> fetchSession(String email) async {
    final response = await http.get(Uri.parse('http://yourip:3001/getsession?email=$email'));
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      print (response.body);
      final sessionData = jsonDecode(response.body)['sessionData'];
      print (sessionData.toString());
      final storesessiondata=sessionData.toString().trim();
      print (storesessiondata);
      final currentTime = DateTime.now().millisecondsSinceEpoch;
      final session = storesessiondata;
      print ('Returned session from fetchSession(): $session');
      return {'currentSession': session};
    } else {
      throw Exception('Failed to fetch session data');
    }
  }

  Future<void> _fetchSessionData() async {
    try {
      final sessionData = await fetchSession(widget.email);
      print('Received session value: ${sessionData['currentSession']}');
      final currentSession = sessionData['currentSession'];
      setState(() {
        _isSessionTime = currentSession != null;
        _currentSession = currentSession;
      });
    } catch (e) {
      print('Failed to fetch session data: $e');
    }
  }

  void navigateToMarkAttendance() {
    if (_inLocation && _isSessionTime) {
      Navigator.pop(context);
      Navigator.push(context, MaterialPageRoute(builder: (context) => MarkAttendance(email: widget.email)));
    } else {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Attendance not allowed outside of session timings or outside of defined location.'),
        duration: Duration(seconds: 3),
      ));
    }
  }

  void navigateToPaperCollection() {
    if (_inLocation && _isSessionTime) {
      Navigator.pop(context);
      Navigator.push(context, MaterialPageRoute(builder: (context) => PaperCollection(email: widget.email)));
    } else {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Paper collection not allowed outside of session timings or outside of defined location.'),
        duration: Duration(seconds: 3),
      ));
    }
  }



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
                //     fit: BoxFit.fill,
                //   image: AssetImage('assets/IDMS.png'))
              ),
            ),
            ListTile(
              leading: Icon(Icons.verified_user),
              title: Text('Mark attendance'),
              onTap: navigateToMarkAttendance,
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
              leading: Icon(Icons.file_open),
              title: Text('Paper Collection'),
              onTap: navigateToPaperCollection,
            ),
            ListTile(
              leading: Icon(Icons.transit_enterexit),
              title: Text('Log out'),
              onTap: () => {Navigator.of(context).pop(),
                Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => LoginPage())
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
            child: DataTable(
              columns: [
                DataColumn(label: Text('Session')),
                DataColumn(label: Text('Room')),
                DataColumn(label: Text('Date')),
              ],
              rows: _data.map((row) {
                return DataRow(
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
                    //DataCell(Text(row['Date'] ?? '')),
                    // DataCell(Text(row['Date'] != null ? (() {
                    //   final dateTime = DateFormat('yyyy-MM-ddTHH:mm:ss').parse(row['Date']);
                    //   final pakistanTime = dateTime.toUtc().add(Duration(hours: 5, minutes: 0));
                    //   final formattedDate = DateFormat('dd-MMMM-yyyy').format(pakistanTime);
                    //   return formattedDate;
                    // })() : '')),
                  ],
                );
              }).toList(),
            ),
          ),
          Container(
            height: 50.0,
          ),
          Center(
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
                    //Navigator.of(context).pushNamed('/home');
                    //Navigator.pushNamedAndRemoveUntil(context, '/home', (route) => false);
                    Navigator.push(context, MaterialPageRoute(
                        builder: (context) =>
                            MarkAttendance(email: widget.email)));
                    // ScaffoldMessenger.of(context).showSnackBar(
                    //   SnackBar(
                    //     content: Text('You cannot navigate to mark attendance page because you have already marked the attendance.'),
                    //   ),
                    // );
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
            ),
          ),
          Center(
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
          )
        ],
      ),
        );
  }
}
/*class NavDrawer extends StatelessWidget {
  final MyHomePage widget;
  NavDrawer({required this.widget});


  @override
  Widget build(BuildContext context) {
    return Drawer(
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
              //     fit: BoxFit.fill,
              //   image: AssetImage('assets/IDMS.png'))
            ),
          ),
          ListTile(
            leading: Icon(Icons.verified_user),
            title: Text('Mark attendance'),
            onTap: (){
              Navigator.push
                (context,
                  MaterialPageRoute(builder: (context)=>MarkAttendance(email: widget.email)));
            },
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
            leading: Icon(Icons.file_open),
            title: Text('Paper Collection'),
            onTap: () => {Navigator.pop(context), Navigator.push(
                context, MaterialPageRoute(builder:(context)=>PaperCollection(email: widget.email)))},
          ),
          ListTile(
            leading: Icon(Icons.transit_enterexit),
            title: Text('Log out'),
            onTap: () => {Navigator.of(context).pop(),
              Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => LoginPage())
              ),
            },
          ),
        ],
      ),
    );
  }
}*/
