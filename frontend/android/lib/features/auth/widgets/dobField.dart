import 'package:flutter/material.dart';

class DobField extends StatefulWidget {
  final Function(DateTime)? onDateSelected;

  const DobField({super.key, this.onDateSelected});

  @override
  State<DobField> createState() => _DobFieldState();
}

class _DobFieldState extends State<DobField> {
  DateTime? selectedDate;

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2005),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != selectedDate) {
      setState(() {
        selectedDate = picked;
      });
      widget.onDateSelected?.call(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () => _selectDate(context),
      child: Text(
        'Select',
        style: TextStyle(fontSize: 16, color: Color.fromARGB(255, 82, 82, 82)),
      ),
      style: ButtonStyle(
        backgroundColor: WidgetStateProperty.all(const Color(0xFFF5F5F5)),
        shape: WidgetStateProperty.all(
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
    );
  }
}
