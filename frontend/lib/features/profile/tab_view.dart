import 'package:flutter/material.dart';
import 'package:pixl/features/post/view_post.dart';

class TabView extends StatefulWidget {
  final TabController tabController;
  final List<dynamic> posts;

  TabView({Key? key, required this.tabController, required this.posts})
      : super(key: key);

  @override
  State<TabView> createState() => _TabViewState();
}

class _TabViewState extends State<TabView> {
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(children: [
        TabBar(tabs: [
          Tab(text: "Posts"),
          Tab(text: "Tagged"),
          Tab(text: "Saved"),
        ], controller: widget.tabController),
        Expanded(
          child: TabBarView(
            controller: widget.tabController,
            children: [
              // Posts Tab
              Container(
                child: GridView.builder(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3, // columns
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                    ),
                    itemCount: widget.posts.length,
                    itemBuilder: (context, index) {
                      if (widget.posts.length == 0) {
                        return Text("No posts yet");
                      }
                      return GestureDetector(
                        onTap: () => {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ViewPost(
                                post: widget.posts[index],
                                byShareId: "",
                                canEdit: true,
                              ),
                            ),
                          )
                        },
                        child: Image.network(
                          widget.posts[index]["media"][0]["url"] == ""
                              ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSLU5_eUUGBfxfxRd4IquPiEwLbt4E_6RYMw&s"
                              : widget.posts[index]["media"][0]["url"],
                          height: 80,
                          width: 80,
                        ),
                      );
                    }),
              ),
              // Tagged Tab
              Center(
                child: Text("No tagged posts"),
              ),
              // Saved Tab
              Center(
                child: Text("No saved posts"),
              ),
            ],
          ),
        )
      ]),
    );
  }
}
