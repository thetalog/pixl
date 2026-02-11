import 'package:flutter/material.dart';
import 'package:pixl/post/create_post.dart';
import './live/kurento_publisher.dart';
import 'live/kurento_viewer.dart';

class CreateActionDropdown extends StatefulWidget {
  @override
  _CreateActionDropdown createState() => _CreateActionDropdown();
}

class _CreateActionDropdown extends State<CreateActionDropdown> {
  String selectedValue = 'Add Post';

  List<String> items = ['Add Post', 'Go Live', 'View Stream'];

  @override
  Widget build(BuildContext context) {
    return DropdownButton<String>(
      value: selectedValue,
      selectedItemBuilder: (context) {
        return items.map((item) {
          return Center(
            child: Text(
              item,
              style: const TextStyle(color: Colors.white),
            ),
          );
        }).toList();
      },
      items: items.map((item) {
        return DropdownMenuItem<String>(
          value: item,
          child: GestureDetector(
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) {
                if (item == "Add Post") {
                  return CreatePost();
                } else if (item == "Go Live") {
                  return KurentoPublisherWidget();
                } else if (item == "View Stream") {
                  return KurentoViewerWidget(
                    liveId: '1dc3e042-f7c0-476c-bc6d-385810ddde18',
                    serverUrl: '192.168.31.8:9090',
                  );
                } else {
                  return Container();
                }
              }));
            },
            child: Text(item),
          ),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          selectedValue = value!;
        });
      },
    );
  }
}
