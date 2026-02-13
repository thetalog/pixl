import 'package:flutter/material.dart';
import 'story_screen.dart';
import 'tool_buttons.dart';

class CreateStory extends StatefulWidget {
  const CreateStory({Key? key}) : super(key: key);

  @override
  State<CreateStory> createState() => _CreateStory();
}

class _CreateStory extends State<CreateStory> {
  @override
  void initState() {
    // TODO: implement initState
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
        child: Column(
      children: [
        Expanded(flex: 9, child: StoryScreen()),
        Expanded(flex: 1, child: ToolButtons()),
      ],
    ));
    throw UnimplementedError();
  }
}
