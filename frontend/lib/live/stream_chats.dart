import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:pixl/config.dart';
import 'package:logger/logger.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final logger = Logger();
final FlutterSecureStorage secureStorage = FlutterSecureStorage();

class StreamChats extends StatefulWidget {
  final String liveId;

  const StreamChats({Key? key, required this.liveId}) : super(key: key);

  @override
  State<StreamChats> createState() => _StreamChatsState();
}

class _StreamChatsState extends State<StreamChats> {
  final TextEditingController _chatController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  IO.Socket? socket;

  List<dynamic> comments = [];
  bool isCommentsLoaded = false;

  String? jwtToken;

  @override
  void initState() {
    super.initState();
    _initChat();
  }

  /// Load JWT first
  Future<void> _initChat() async {
    jwtToken = await secureStorage.read(key: "jwt_token");

    if (jwtToken == null) {
      logger.e("❌ JWT token not found");
      return;
    }

    _fetchComments();
  }

  /// STEP 1 — REST: Load existing comments
  Future<void> _fetchComments() async {
    try {
      final response = await http.get(
        Uri.parse(Config.buildApiUrl('/live/${widget.liveId}/comments')),
        headers: {
          "Authorization": "Bearer $jwtToken",
        },
      );
      await Future.delayed(const Duration(milliseconds: 500));

      if (response.statusCode == 200) {
        setState(() {
          comments = jsonDecode(response.body);
          logger.i("Initial comments: ${comments.length}");
          isCommentsLoaded = true;
        });

        _scrollBottom();

        // STEP 2 — Spawn socket + connect
        await _startLiveSocket();
      }
    } catch (e) {
      logger.e("Fetch comments error: $e");
    }
  }

  /// STEP 2 — Start Node socket + connect Flutter
  Future<void> _startLiveSocket() async {
    try {
      // spawn socket server
      await http.get(
        Uri.parse(Config.buildApiUrl('/live/${widget.liveId}/comments/socket')),
        headers: {
          "Authorization": "Bearer $jwtToken",
        },
      );

      socket = IO.io(
        "http://192.168.31.8:4000",
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .setExtraHeaders({
              "Authorization": "Bearer $jwtToken",
            })
            .build(),
      );

      socket!.connect();
      socket!.onAny((event, data) {
        logger.i("📩 Socket event: $event → $data");
      });
      socket!.onConnect((_) {
        logger.i("🟢 Chat socket connected");

        // 🚨 THIS WAS MISSING
        socket!.emit("joinLive", widget.liveId);
      });

      // ONLY receive live chats
      socket!.on("newChat", (chat) {
        setState(() {
          comments.add(chat);
        });

        _scrollBottom();
      });

      socket!.onDisconnect((_) {
        logger.i("🔴 Chat socket disconnected");
      });
    } catch (e) {
      logger.e("Socket start error: $e");
    }
  }

  void _scrollBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(
          _scrollController.position.maxScrollExtent,
        );
      }
    });
  }

  /// STEP 3 — Send chat through socket
  Future<void> _sendMessage() async {
    if (_chatController.text.trim().isEmpty) return;

    try {
      final response = await http.post(
        Uri.parse(Config.buildApiUrl('/live/${widget.liveId}/comment')),
        headers: {
          "Authorization": "Bearer $jwtToken",
          "Content-Type": "application/json",
        },
        body: jsonEncode({
          "text": _chatController.text.trim(),
        }),
      );

      if (response.statusCode == 200) {
        _chatController.clear();
        logger.i("✅ Comment sent");

        // DO NOT manually add to list
        // socket will push newChat automatically
      } else {
        logger.e("❌ Comment failed: ${response.body}");
      }
    } catch (e) {
      logger.e("Send comment error: $e");
    }
  }

  @override
  void dispose() {
    socket?.disconnect();
    socket?.dispose();
    _chatController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        /// CHAT LIST
        Expanded(
          flex: 8,
          child: Container(
            width: double.infinity,
            color: Colors.black.withOpacity(0.35),
            child: !isCommentsLoaded
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    itemCount: comments.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "${comments[index]['user']?['userName'] ?? ''}:",
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                comments[index]['text'] ?? '',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ),

        /// INPUT BAR
        Expanded(
          flex: 2,
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _chatController,
                  decoration: const InputDecoration(
                    hintText: "Type message...",
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              ElevatedButton(
                onPressed: _sendMessage,
                child: const Text("Send"),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
