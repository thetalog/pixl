import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:pixl/features/live/stream_chats.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:pixl/core/config/config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final FlutterSecureStorage secureStorage = FlutterSecureStorage();

final logger = Logger();

class KurentoPublisherWidget extends StatefulWidget {
  const KurentoPublisherWidget({Key? key}) : super(key: key);

  @override
  State<KurentoPublisherWidget> createState() => _KurentoPublisherWidgetState();
}

class _KurentoPublisherWidgetState extends State<KurentoPublisherWidget> {
  final RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  MediaStream? _localStream;
  String streamUrl = "";
  String streamId = "";
  RTCPeerConnection? _peerConnection;
  WebSocketChannel? _webSocketChannel;
  Future<void> createStreamUrl() async {
    try {
      String? token = await secureStorage.read(key: "jwt_token");

      if (token == null) {
        logger.e("❌ JWT token not found");
        return;
      }
      final response = await http.post(
        Uri.parse(Config.buildApiUrl('/live/start')),
        headers: {
          'Content-Type': 'application/json',
          "Authorization": "Bearer $token"
        },
        body: jsonEncode({
          'title': 'My Live Stream',
        }),
      );

      final responseDecoded = jsonDecode(response.body);
      if (response.statusCode == 200) {
        streamUrl = responseDecoded["url"] + "?role=publisher";
        streamId = responseDecoded["id"];
        logger.i("[DEBUG] Stream URL: $responseDecoded");
        print("Stream URL created successfully");
      } else {
        logger.i("[DEBUG] Error creating stream URL: ${responseDecoded}");
        print("Failed to create stream URL: ${response.statusCode}");
      }
      print(response.body);
    } catch (e) {
      logger.i("[DEBUG] Error creating stream URL: $e");
      debugPrint('Error creating stream URL: $e');
    }
  }

  bool _isReady = false;
  bool _isStreaming = false;
  bool _rendererReady = false;
  String _status = 'Initializing...';
  Future<void> _bootstrap() async {
    try {
      await createStreamUrl();

      if (streamUrl.isEmpty) {
        setState(() => _status = "Stream URL empty");
        return;
      }

      await _initRenderer();
      _connectWS();
    } catch (e) {
      setState(() => _status = "Bootstrap error: $e");
    }
  }

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _initRenderer() async {
    try {
      debugPrint('Initializing renderer...');
      await _localRenderer.initialize();
      debugPrint('Renderer initialized successfully');
      if (mounted) {
        setState(() {
          _rendererReady = true;
          _status = 'Renderer ready, connecting...';
        });
      }
    } catch (e) {
      debugPrint('Renderer initialization error: $e');
      if (mounted) {
        setState(() => _status = 'Renderer error: $e');
      }
    }
  }

  void _connectWS() {
    try {
      debugPrint('Connecting to WebSocket: $streamUrl');
      _webSocketChannel = WebSocketChannel.connect(Uri.parse(streamUrl));

      _webSocketChannel!.stream.listen(
        (msg) {
          debugPrint('WebSocket message received: $msg');
          final data = jsonDecode(msg);

          if (data['type'] == 'ready') {
            debugPrint('Server is ready');
            if (mounted) {
              setState(() {
                _isReady = true;
                _status = 'Ready to stream';
              });
            }
          }

          if (data['type'] == 'answer') {
            debugPrint('Received answer');
            _peerConnection?.setRemoteDescription(
              RTCSessionDescription(data['sdp'], 'answer'),
            );
          }

          if (data['type'] == 'ice') {
            debugPrint('Received ICE candidate');
            _peerConnection?.addCandidate(
              RTCIceCandidate(
                data['candidate'],
                data['sdpMid'],
                data['sdpMLineIndex'],
              ),
            );
          }
        },
        onError: (error) {
          debugPrint('WebSocket error: $error');
          if (mounted) {
            setState(() => _status = 'WS error: $error');
          }
        },
        onDone: () {
          debugPrint('WebSocket connection closed');
          if (mounted) {
            setState(() => _status = 'Connection closed');
          }
        },
      );
    } catch (e) {
      debugPrint('Failed to connect WebSocket: $e');
      if (mounted) {
        setState(() => _status = 'WS connect failed: $e');
      }
    }
  }

  Future<void> _stop() async {
    debugPrint('Stopping stream...');
    _peerConnection?.close();
    _peerConnection = null;
    _localStream?.getTracks().forEach((t) => t.stop());
    _localStream = null;
    _localRenderer.srcObject = null;
    _webSocketChannel?.sink.close();
    if (mounted) {
      setState(() {
        _isStreaming = false;
        _status = 'Stream stopped';
      });
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Stream stopped")),
    );
    Navigator.of(context).pop();
  }

  Future<void> _start() async {
    if (!_isReady) {
      debugPrint('Cannot start - not ready');
      return;
    }

    try {
      debugPrint('Requesting media access...');
      setState(() => _status = 'Requesting camera...');

      final stream = await navigator.mediaDevices.getUserMedia({
        'audio': true,
        'video': {
          'facingMode': 'user',
          'mandatory': {
            'minWidth': '320',
            'minHeight': '240',
            'minFrameRate': '15',
          },
          'optional': [],
        }
      });

      debugPrint('Media stream obtained: ${stream.id}');
      debugPrint('Video tracks: ${stream.getVideoTracks().length}');
      debugPrint('Audio tracks: ${stream.getAudioTracks().length}');

      if (mounted) {
        setState(() {
          _localStream = stream;
          _localRenderer.srcObject = stream;
          _status = 'Camera started';
        });
      }

      debugPrint('Creating peer connection...');
      _peerConnection = await createPeerConnection({
        'iceServers': [
          {'urls': 'stun:stun.l.google.com:19302'}
        ]
      });

      for (final t in stream.getTracks()) {
        debugPrint('Adding track: ${t.kind}');
        await _peerConnection!.addTrack(t, stream);
      }

      _peerConnection!.onIceCandidate = (c) {
        if (c.candidate != null) {
          debugPrint('Sending ICE candidate');
          _webSocketChannel!.sink.add(jsonEncode({
            'type': 'ice',
            'candidate': c.candidate,
            'sdpMid': c.sdpMid,
            'sdpMLineIndex': c.sdpMLineIndex
          }));
        }
      };

      debugPrint('Creating offer...');
      final offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);

      debugPrint('Sending offer to server...');
      _webSocketChannel!.sink
          .add(jsonEncode({'type': 'offer', 'sdp': offer.sdp}));

      if (mounted) {
        setState(() {
          _isStreaming = true;
          _status = 'Streaming...';
        });
      }
    } catch (e) {
      debugPrint('Error starting stream: $e');
      if (mounted) {
        setState(() => _status = 'Stream error: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    debugPrint(
        'Building widget - rendererReady: $_rendererReady, status: $_status');

    return Scaffold(
        appBar: AppBar(
          title: const Text("Pixl Live Publisher"),
          actions: [
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Center(
                child: Row(
                  children: [
                    Text(
                      _isReady ? '🟢' : '🔴',
                      style: const TextStyle(fontSize: 20),
                    ),
                    ElevatedButton(
                        onPressed: (_isReady && !_isStreaming) ? _start : _stop,
                        child: Text(_isStreaming ? 'Stop' : 'Start'))
                  ],
                ),
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            Expanded(
              flex: 1,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                color: Colors.blue.shade100,
                child: Text(
                  _status,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
            // Video view
            Expanded(
              flex: 10,
              child: _rendererReady
                  ? Container(
                      color: Colors.black,
                      child: RTCVideoView(
                        _localRenderer,
                        mirror: true,
                        objectFit:
                            RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                      ),
                    )
                  : const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 16),
                          Text('Initializing renderer...'),
                        ],
                      ),
                    ),
            ),
            // Expanded(
            //   flex: 2,
            //   child: Container(
            //     width: double.infinity,
            //     padding: const EdgeInsets.all(8),
            //     color: Colors.grey.shade200,
            //     child: Column(
            //       crossAxisAlignment: CrossAxisAlignment.start,
            //       children: [
            //         Text('Renderer: ${_rendererReady ? "✓" : "✗"}'),
            //         Text('WebSocket: ${_isReady ? "✓" : "✗"}'),
            //         Text('Streaming: ${_isStreaming ? "✓" : "✗"}'),
            //         Text('Stream: ${_localStream != null ? "✓" : "✗"}'),
            //       ],
            //     ),
            //   ),
            // ),
            // Debug info
            Expanded(
              flex: 6,
              child: _rendererReady
                  ? StreamChats(liveId: streamId)
                  : const SizedBox.shrink(),
            ),
          ],
        ));
  }

  @override
  void dispose() {
    debugPrint('Disposing widget...');
    _localRenderer.dispose();
    _localStream?.dispose();
    _peerConnection?.close();
    _webSocketChannel?.sink.close();
    super.dispose();
  }
}
