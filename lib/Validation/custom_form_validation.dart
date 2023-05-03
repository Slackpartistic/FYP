import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
class CustomFormField extends StatelessWidget {
  CustomFormField({
    Key? key,
    required this.hintText,
    required this.labelText,
    required this.controller,
    this.inputFormatters,
    this.validator,
  }) : super(key: key);

  final String hintText;
  final String labelText;
  TextEditingController controller;
  final List<TextInputFormatter>? inputFormatters;
  final String? Function (String?)? validator;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: TextFormField(
        inputFormatters: inputFormatters,
        controller: controller,
        validator: validator,
        decoration: InputDecoration(
          focusedBorder: OutlineInputBorder(

          borderSide: BorderSide(color: Colors.green),
              borderRadius: BorderRadius.circular(15.0)
        ),

          border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15.0)
          ),
          hintText: hintText,
          labelText: labelText,
          focusColor: Colors.green[600],
        ),
      ),
    );
  }
}

extension extString on String {
  bool get isValidEmail {
    //r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+"
    final emailRegExp = RegExp(r'^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$');
    return emailRegExp.hasMatch(this);


  }

  bool get isValidName{
    final nameRegExp = new RegExp(r"^\s*([A-Za-z]{1,}([\.,] |[-']| ))+[A-Za-z]+\.?\s*$");
    return nameRegExp.hasMatch(this);
  }

  bool get isValidPassword{
    final passwordRegExp =
    RegExp(r'^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#\$&*~]).{8,}$');
    return passwordRegExp.hasMatch(this);
  }

  bool get isNotNull{
    return this!=null;
  }

  bool get isValidPhone{
    final phoneRegExp = RegExp(r"^\+?0[0-9]{10}$");
    return phoneRegExp.hasMatch(this);
  }

}
