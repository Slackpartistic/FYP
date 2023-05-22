import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:timezone/data/latest.dart' as timezone;
import 'package:timezone/timezone.dart' as timezone;


Future<List<dynamic>> fetchFacultyAttendanceHistory(String email) async {
  final url = Uri.parse('http://your-ip:3001/fetchfacultyattendancehistory?email=$email');
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
  DateTime startDate=DateTime.now();
  DateTime endDate=DateTime.now();


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

  void _showDateRangePicker() async {
    final initialDateRange = DateTimeRange(
      start: startDate ?? DateTime.now(),
      end: endDate ?? DateTime.now(),
    );

    final pickedDateRange = await showDateRangePicker(
      context: context,
      initialDateRange: initialDateRange,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );

    if (pickedDateRange != null) {
      setState(() {
        startDate = pickedDateRange.start;
        endDate = pickedDateRange.end;
      });
    }
  }



  @override
  Widget build(BuildContext context) {
    if (_data.isEmpty) {
      return AlertDialog(
        title: Text('No records found!'),
        actions: [
          TextButton(
            child: Text('Go back'),
            onPressed: () {
              Navigator.of(context).pop();
            },
          ),
        ],
      );
    }
    else {
      return Scaffold(
        appBar: AppBar(title: Text('History'),
          backgroundColor: Colors.green[600],
          actions: [
          GestureDetector(
          onTap: _showDateRangePicker,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            splashColor: Colors.green[600],
            child: Padding(
              padding: EdgeInsets.all(8),
              child: Icon(Icons.date_range),
            ),
          ),
        ),
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
                        DataColumn(label: Text('Date')),
                        DataColumn(label: Text('Session')),
                        DataColumn(label: Text('Room')),
                        DataColumn(label: Text('Status')),
                      ],
                      rows: _data.where((row) {
                        final date = DateTime.parse(row['Date']).toLocal();
                        return (startDate == null || date.isAfter(startDate)) &&
                            (endDate == null || date.isBefore(endDate));
                      })
                          .map((row) {
                        return DataRow(
                          cells: [
                            DataCell(
                              Text(
                                row['Date'] != null
                                    ? (() {
                                  final dateTime = DateTime.parse(row['Date'])
                                      .toLocal();
                                  final location = timezone.getLocation(
                                      'Asia/Karachi');
                                  final pakistanTime = timezone.TZDateTime.from(
                                      dateTime, location);
                                  final formattedDate =
                                  DateFormat('dd-MMMM-yy').format(pakistanTime);
                                  return formattedDate;
                                })()
                                    : '',
                                textAlign: TextAlign.center,
                              ),
                            ),
                            DataCell(Text('${row['Session']}' ?? '',
                                textAlign: TextAlign.center)),
                            DataCell(Text(row['Room'] ?? '')),
                            DataCell(Text(row['Status'] ?? '',
                                textAlign: TextAlign.center)),
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
}
