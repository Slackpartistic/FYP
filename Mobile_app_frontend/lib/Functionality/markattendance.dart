
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

enum AttendanceStatus { P, A }

Future<List<dynamic>> fetchMarkAttendanceData(String email) async {
  final url = Uri.parse('http://yourip:3001/getfacultymarkattendance?email=$email');
  final response = await http.get(url);
  if (response.statusCode == 200) {
    final List<dynamic> data = jsonDecode(response.body);
    return data.cast<Map<String, dynamic>>();
  } else {
    throw Exception('Failed to fetch data');
  }
}


var paperId;
double latitude=0.0;
double longitude=0.0;
class MarkAttendance extends StatefulWidget {
  final String email;
  MarkAttendance({required this.email});

  @override
  State<MarkAttendance> createState() => _MarkAttendanceState();
}



class _MarkAttendanceState extends State<MarkAttendance> {
  List<Map<String, dynamic>> records = [];
  List<dynamic> sessions = [];
  AttendanceStatus? _attendanceStatus = AttendanceStatus.A;
  final TextEditingController absentTextController = TextEditingController();



  @override
  void initState() {
    super.initState();
    getMarkAttendanceData();
  }



  Future<void> getMarkAttendanceData() async {
    try {
      final sessionData = await fetchSession(widget.email);
      final session = sessionData['currentSession'];
      final data = await fetchMarkAttendanceData(widget.email);
      setState(() {
        records = data.cast<
            Map<String, dynamic>>(); // update records list with fetched data
      });
    } catch (e) {
      print(e);
    }
  }

  Future<Map<String, dynamic>> fetchSession(String email) async {
    final response = await http.get(
        Uri.parse('http://yourip:3001/getsession?email=$email'));
    if (response.statusCode == 200) {
      final sessionData = jsonDecode(response.body)['session'];
      final currentTime = DateTime
          .now()
          .millisecondsSinceEpoch;
      final session = sessionData != null ? sessionData.firstWhere(
            (s) => s['startTime'] <= currentTime && s['endTime'] >= currentTime,
        orElse: () => null,
      ) : null;
      final sessionName = session?['name'] ?? 'No session';
      print(sessionName);
      return {'sessionData': sessionData, 'currentSession': session};
    } else {
      throw Exception('Failed to fetch session data');
    }
  }

  Future<Map<String, dynamic>> getSession(String sessionData) async {
    final response = await http.get(Uri.parse(
        'http://yourip:3001/getsession?session=$sessionData'));
    if (response.statusCode == 200) {
      final data = json.decode(response.body) as Map<String, dynamic>;
      return data;
    } else {
      throw Exception('Failed to get session data');
    }
  }

  void sendAttendanceData(String paperId, String selectedStatus,double Latitude, double Longitude) async {
    final response = await http.post(
      Uri.parse('http://yourip:3001/postfacultymarkattendance'),
      body: {
        'email': widget.email,
        'paperCollectionId': paperId,
        'status': selectedStatus,
        'Latitude': latitude.toString(),
        'Longitude': longitude.toString(),
      },
    );

    if (response.statusCode == 200) {
      print('Attendance data sent successfully');
    } else {
      print('Error sending attendance data');
    }
  }

  Future<Position?> getCurrentposition() async {
    LocationPermission permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      print("Permission denied");
      LocationPermission reqloc = await Geolocator.requestPermission();
    } else {
      Position currentPosition =
      await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.best);
      print("Latitude:" + currentPosition.latitude.toString());
      print("Longitude: " + currentPosition.longitude.toString());
      latitude = currentPosition.latitude;
      longitude = currentPosition.longitude;
      return currentPosition;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) {
      return AlertDialog(
        title: Text('No records found!'),
        content: Text('There are no records to mark attendance for today.'),
        actions: [
          TextButton(
            child: Text('Go back'),
            onPressed: () {
              Navigator.of(context).pop(); // close the dialog
            },
          ),
        ],
      );
    }
    else {
      return Scaffold(
        appBar: AppBar(title: Text('Mark Attendance'),
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
        body: Center(
          child: Column(
              children: [
                Expanded(
                  flex: 1,
                  child: SingleChildScrollView(
                    scrollDirection: Axis.vertical,
                    child: DataTable(
                      columns: [
                        DataColumn(label: Text('Session')),
                        DataColumn(label: Text('Room')),
                        DataColumn(label: Text('Status')),
                      ],
                      rows: records.map((row) {
                        return DataRow(
                          cells: [
                            DataCell(Text(row['Session'].toString() ?? '')),
                            DataCell(Text(row['Room'] ?? '')),
                            DataCell(Text(row['Status'] ?? '')),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
                ),
                Expanded(
                  flex: 4,
                  child: SizedBox(
                    width: 200,
                    child: ListView.builder(
                      itemCount: records.length,
                      itemBuilder: (BuildContext context, int index) {
                        final record = records[index];
                        final paperId = record['ID'].toString();
                        return Container(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Text('Attendance', style: TextStyle(
                                  fontSize: 20, fontWeight: FontWeight.bold),),
                              RadioListTile<AttendanceStatus>(
                                title: const Text('Present'),
                                value: AttendanceStatus.P,
                                groupValue: _attendanceStatus,
                                activeColor: Colors.green[600],
                                onChanged: (AttendanceStatus? value) {
                                  setState(() {
                                    record['Status'] = 'P';
                                    _attendanceStatus = value;
                                  });
                                },
                              ),
                              RadioListTile<AttendanceStatus>(
                                title: const Text('Absent'),
                                value: AttendanceStatus.A,
                                groupValue: _attendanceStatus,
                                activeColor: Colors.green[600],
                                onChanged: (AttendanceStatus? value) {
                                  setState(() {
                                    record['Status'] = 'A';
                                    _attendanceStatus = value;
                                  });
                                },
                              ),
                              // TextField(
                              //   controller: absentTextController,
                              //   maxLines: 3,
                              //   decoration: InputDecoration.collapsed(
                              //     border: OutlineInputBorder(),
                              //     hintText: "Reason for absence.",
                              //   ),
                              // ),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green[600]),
                                onPressed: () async{
                                  Position? currentPosition = await getCurrentposition();
                                  if (_attendanceStatus ==
                                      AttendanceStatus.P) {
                                    // show a confirmation dialog before submitting attendance
                                    showDialog(
                                      context: context,
                                      builder: (BuildContext context) =>
                                          AlertDialog(
                                            title: Text('Are you sure?',
                                              style: TextStyle(
                                                  fontWeight: FontWeight.bold),),
                                            content: Text(
                                                'You are about to mark the attendance as present. This action can not be undone!'),
                                            actions: [
                                              TextButton(
                                                child: Text('I understand',
                                                  style: TextStyle(
                                                      color: Colors.green),),
                                                onPressed: () async{

                                                  if (currentPosition!=null){
                                                  // send the attendance data with position
                                                    print(currentPosition.latitude);
                                                    print(currentPosition.longitude);
                                                  sendAttendanceData(
                                                      paperId, 'P',latitude,longitude);
                                                  Navigator.of(context).pop(); // close the dialog
                                                  // show a success message
                                                  ScaffoldMessenger.of(context)
                                                      .showSnackBar(
                                                    SnackBar(
                                                      backgroundColor: Colors
                                                          .green[600],
                                                      content: Text(
                                                          'Attendance marked as Present.'),
                                                      duration: Duration(
                                                          seconds: 1),
                                                    ),
                                                  );
                                                  //Navigator.pushReplacementNamed(context, '/home');
                                                  //Navigator.popUntil(context, ModalRoute.withName('/home'));
                                                  }
                                                  else{
                                                    ScaffoldMessenger.of(context).showSnackBar(
                                                      SnackBar(
                                                        content: Text(
                                                          'Failed to get current position!',
                                                        ),
                                                        duration: Duration(seconds: 2),
                                                      ),
                                                    );
                                                  }
                                                },
                                              ),
                                              TextButton(
                                                child: Text('Go back',
                                                  style: TextStyle(
                                                      color: Colors.red),),
                                                onPressed: () {
                                                  Navigator.of(context)
                                                      .pop(); // close the dialog
                                                },
                                              ),
                                            ],
                                          ),
                                    );
                                  } else if (_attendanceStatus ==
                                      AttendanceStatus.A) {
                                    // show a confirmation dialog before submitting attendance
                                    showDialog(
                                      context: context,
                                      builder: (BuildContext context) =>
                                          AlertDialog(
                                            title: Text('Are you sure?'),
                                            content: Text(
                                                'You are about to mark the attendance as absent. This action can not be undone!'),
                                            actions: [
                                              TextButton(
                                                child: Text('I understand',style: TextStyle(color: Colors.green[600]),),
                                                onPressed: () async{
                                                  if (currentPosition!=null){
                                                  // send the attendance data
                                                  sendAttendanceData(
                                                      paperId, 'A',latitude,longitude);
                                                  Navigator.of(context).pop(); // close the dialog
                                                  // show a success message
                                                  ScaffoldMessenger.of(context)
                                                      .showSnackBar(
                                                    SnackBar(
                                                      backgroundColor: Colors
                                                          .green[600],
                                                      content: Text(
                                                          'Attendance marked as Absent.'),
                                                      duration: Duration(
                                                          seconds: 1),
                                                    ),
                                                  );
                                                  }
                                                  else {
                                                    ScaffoldMessenger.of(context).showSnackBar(
                                                      SnackBar(
                                                        content: Text(
                                                          'Failed to get current position!',
                                                        ),
                                                        duration: Duration(seconds: 2),
                                                      ),
                                                    );
                                                  }
                                                },
                                              ),
                                              TextButton(
                                                child: Text('Go back',style: TextStyle(color: Colors.red),),
                                                onPressed: () {
                                                  Navigator.of(context)
                                                      .pop(); // close the dialog
                                                },
                                              ),
                                            ],
                                          ),
                                    );
                                  } else {
                                    showDialog(
                                      context: context,
                                      builder: (_) =>
                                          AlertDialog(
                                            title: const Text('Missing input!'),
                                            content: SingleChildScrollView(
                                              child: ListBody(
                                                children: <Widget>[
                                                  const Text(
                                                      'Please select one of the options.'),
                                                ],
                                              ),
                                            ),
                                          ),
                                    );
                                  }
                                },

                                child: const Text(
                                  'Submit Attendance',
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                )

              ]
          ),
        ),

      );
    }
  }


}
