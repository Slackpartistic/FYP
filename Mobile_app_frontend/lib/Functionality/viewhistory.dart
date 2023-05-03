import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:timezone/data/latest.dart' as timezone;
import 'package:timezone/timezone.dart' as timezone;


Future<List<dynamic>> fetchFacultyAttendanceHistory(String email) async {
  final url = Uri.parse('http://192.168.18.193:3001/fetchfacultyattendancehistory?email=$email');
  final response = await http.get(url);

  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to fetch data');
  }
}

class ViewAttendance extends StatefulWidget {
  final String email;
  ViewAttendance({required this.email});

  @override
  State<ViewAttendance> createState() => _ViewAttendanceState();
}

class _ViewAttendanceState extends State<ViewAttendance> {
  List<dynamic> _data = [];


  @override
  void initState() {
    super.initState();
    getFacultyHistoryData();
  }



  Future<void> getFacultyHistoryData() async {
    try {
      final data = await fetchFacultyAttendanceHistory(widget.email);
      setState(() {
        _data = data;
      });
    } catch (e) {
      print(e);
    }
  }



  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Attendance History'),
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
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: SingleChildScrollView(
                      scrollDirection: Axis.vertical,
                      child: DataTable(
                      columns: [
            DataColumn(label: Text('Room')),
            DataColumn(label: Text('Session')),
            DataColumn(label: Text('Status')),
            DataColumn(label: Text('Date')),
          ],
            rows: _data.map((row) {
          return DataRow(
            cells: [
              DataCell(Text(row['Room'] ?? '')),
              DataCell(Text('${row['Session']}' ?? '',textAlign: TextAlign.center)),
              DataCell(Text(row['Status'] ?? '',textAlign: TextAlign.center)),
              DataCell(
                    Text(
                      row['Date'] != null
                          ? (() {
                        final dateTime = DateTime.parse(row['Date']).toLocal();
                        final location = timezone.getLocation('Asia/Karachi');
                        final pakistanTime = timezone.TZDateTime.from(dateTime, location);
                        final formattedDate =
                        DateFormat('dd-MMMM-yy').format(pakistanTime);
                        return formattedDate;
                      })()
                          : '',
                      textAlign: TextAlign.center,
                    ),
              ),
            ],
          );
        }).toList(),
      ),
                    ),
                  ),
          ]
      ),
                ),
    );
  }
}
