import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../state/stories_provider.dart';
import 'widgets/draggable_text.dart';
import '../../state/action_provider.dart';
import '../../state/stories_provider.dart';
import '../../state/story_text_provider.dart'; // ✅ REQUIRED
import '../../shared/models/story_text.dart';

class ToolButtons extends ConsumerStatefulWidget {
  final storyCreate;
  const ToolButtons({Key? key, this.storyCreate}) : super(key: key);

  @override
  ConsumerState<ToolButtons> createState() => _ToolButtons();
}

class _ToolButtons extends ConsumerState<ToolButtons> {
  XFile? image;
  void _addText() {
    ref.read(storyTextProvider.notifier).addText(
          StoryText(
            text: "Hello Instagram",
            position: const Offset(100, 200),
            scale: 1.0,
            color: Colors.white,
          ),
        );
  }

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(
    BuildContext context,
  ) {
    return Container(
        child: Row(
      children: [
        ElevatedButton(
            onPressed: () async {
              final picker = ImagePicker();
              final XFile? image =
                  await picker.pickImage(source: ImageSource.gallery);

              if (image != null) {
                ref.read(storyImageProvider.notifier).state = image.path;
              }
            },
            child: Text("Import Image")),
        ElevatedButton(onPressed: _addText, child: Text("Add Text")),
        ElevatedButton(
            onPressed: () {
              ref.read(actionProvider).captureAndSave();
            },
            child: Text("Done")),
      ],
    ));
  }
}
