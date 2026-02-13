import 'package:flutter/material.dart';

class RequestFollow extends StatefulWidget {
  const RequestFollow({Key? key}) : super(key: key);

  @override
  State<RequestFollow> createState() => _RequestFollow();
}

class _RequestFollow extends State<RequestFollow> {
  void requestFollow(){
    
  }
  @override
  Widget build(BuildContext context) {
    return Container(
      child: ElevatedButton(onPressed: requestFollow, child: Text("Follow")),
    );
  }
}
