import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import './stream_chats.dart';

class KurentoViewerWidget extends StatefulWidget {
  final String liveId;
  final String serverUrl;

  const KurentoViewerWidget({
    Key? key,
    required this.liveId,
    this.serverUrl = '192.168.31.8:9090',
  }) : super(key: key);

  @override
  State<KurentoViewerWidget> createState() => _KurentoViewerWidgetState();
}

class _KurentoViewerWidgetState extends State<KurentoViewerWidget> {
  final RTCVideoRenderer _remoteRenderer = RTCVideoRenderer();
  MediaStream? _remoteStream;
  RTCPeerConnection? _peerConnection;
  WebSocketChannel? _webSocketChannel;

  bool _isReady = false;
  bool _isConnected = false;
  bool _rendererReady = false;
  String _status = 'Initializing...';

  String get _wsUrl =>
      'ws://${widget.serverUrl}/live/${widget.liveId}?role=viewer';

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      debugPrint('Starting viewer initialization...');
      await _initRenderer();
      _connectWS();
    } catch (e) {
      debugPrint('Initialization error: $e');
      if (mounted) {
        setState(() => _status = 'Init error: $e');
      }
    }
  }

  Future<void> _initRenderer() async {
    try {
      debugPrint('Initializing renderer...');
      await _remoteRenderer.initialize();
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
      debugPrint('Connecting to WebSocket: $_wsUrl');
      _webSocketChannel = WebSocketChannel.connect(Uri.parse(_wsUrl));

      _webSocketChannel!.stream.listen(
        (msg) {
          debugPrint('WebSocket message received: $msg');
          final data = jsonDecode(msg);

          if (data['type'] == 'ready') {
            debugPrint('Server is ready');
            if (mounted) {
              setState(() {
                _isReady = true;
                _status = 'Ready to view';
              });
            }
            // Auto-start viewing when ready
            _startViewing();
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
            setState(() => _status = 'Connection error: $error');
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

  Future<void> _startViewing() async {
    if (!_isReady || _isConnected) {
      debugPrint(
          'Cannot start viewing - ready: $_isReady, connected: $_isConnected');
      return;
    }

    try {
      debugPrint('Starting viewer connection...');
      if (mounted) {
        setState(() => _status = 'Connecting to stream...');
      }

      // Create peer connection
      debugPrint('Creating peer connection...');
      _peerConnection = await createPeerConnection({
        'iceServers': [
          {'urls': 'stun:stun.l.google.com:19302'}
        ]
      });

      // Setup ICE candidate handler
      _peerConnection!.onIceCandidate = (candidate) {
        if (candidate.candidate != null) {
          debugPrint('Sending ICE candidate');
          _webSocketChannel!.sink.add(jsonEncode({
            'type': 'ice',
            'candidate': candidate.candidate,
            'sdpMid': candidate.sdpMid,
            'sdpMLineIndex': candidate.sdpMLineIndex
          }));
        }
      };

      // Setup remote track handler
      _peerConnection!.onTrack = (RTCTrackEvent event) {
        debugPrint('Received remote track: ${event.track.kind}');
        if (event.streams.isNotEmpty) {
          debugPrint('Setting remote stream');
          if (mounted) {
            setState(() {
              _remoteStream = event.streams[0];
              _remoteRenderer.srcObject = _remoteStream;
              _status = 'Viewing live stream';
            });
          }
        }
      };

      // Setup connection state handler
      _peerConnection!.onConnectionState = (state) {
        debugPrint('Connection state: $state');
        if (mounted) {
          setState(() {
            switch (state) {
              case RTCPeerConnectionState.RTCPeerConnectionStateConnected:
                _status = 'Connected';
                break;
              case RTCPeerConnectionState.RTCPeerConnectionStateDisconnected:
                _status = 'Disconnected';
                break;
              case RTCPeerConnectionState.RTCPeerConnectionStateFailed:
                _status = 'Connection failed';
                break;
              default:
                _status = 'Connecting...';
            }
          });
        }
      };

      // Add transceivers for receiving audio and video
      _peerConnection!.addTransceiver(
        kind: RTCRtpMediaType.RTCRtpMediaTypeAudio,
        init: RTCRtpTransceiverInit(direction: TransceiverDirection.RecvOnly),
      );

      _peerConnection!.addTransceiver(
        kind: RTCRtpMediaType.RTCRtpMediaTypeVideo,
        init: RTCRtpTransceiverInit(direction: TransceiverDirection.RecvOnly),
      );

      // Create offer
      debugPrint('Creating offer...');
      final offer = await _peerConnection!.createOffer({
        'offerToReceiveAudio': true,
        'offerToReceiveVideo': true,
      });

      await _peerConnection!.setLocalDescription(offer);

      // Send offer to server
      debugPrint('Sending offer to server...');
      _webSocketChannel!.sink.add(jsonEncode({
        'type': 'offer',
        'sdp': offer.sdp,
      }));

      if (mounted) {
        setState(() => _isConnected = true);
      }
    } catch (e) {
      debugPrint('Error starting viewer: $e');
      if (mounted) {
        setState(() => _status = 'Viewer error: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    debugPrint(
        'Building viewer widget - rendererReady: $_rendererReady, status: $_status');

    return Scaffold(
      appBar: AppBar(
        title: Text("Live Stream - ${widget.liveId}"),
        actions: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Center(
              child: Text(
                _isConnected ? '🟢' : '🔴',
                style: const TextStyle(fontSize: 20),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Status banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            color: Colors.green.shade100,
            child: Text(
              _status,
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),

          // VIDEO + CHAT OVERLAY
          Expanded(
            child: Stack(
              children: [
                // 🎥 VIDEO
                Positioned.fill(
                  child: _rendererReady
                      ? Container(
                          color: Colors.black,
                          child: _remoteStream != null
                              ? RTCVideoView(
                                  _remoteRenderer,
                                  mirror: false,
                                  objectFit: RTCVideoViewObjectFit
                                      .RTCVideoViewObjectFitCover,
                                )
                              : const Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      CircularProgressIndicator(
                                        color: Colors.white,
                                      ),
                                      SizedBox(height: 16),
                                      Text(
                                        'Waiting for stream...',
                                        style: TextStyle(color: Colors.white),
                                      ),
                                    ],
                                  ),
                                ),
                        )
                      : const Center(
                          child: CircularProgressIndicator(),
                        ),
                ),

                // 💬 CHAT OVERLAY (REUSED)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: MediaQuery.of(context).size.height * 0.35,
                  child: StreamChats(
                    liveId: widget.liveId,
                  ),
                ),
              ],
            ),
          ),

          // Debug info (keep as-is)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            color: Colors.grey.shade200,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Renderer: ${_rendererReady ? "✓" : "✗"}'),
                Text('WebSocket: ${_isReady ? "✓" : "✗"}'),
                Text('Connected: ${_isConnected ? "✓" : "✗"}'),
                Text('Stream: ${_remoteStream != null ? "✓" : "✗"}'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    debugPrint('Disposing viewer widget...');
    _remoteRenderer.dispose();
    _remoteStream?.dispose();
    _peerConnection?.close();
    _webSocketChannel?.sink.close();
    super.dispose();
  }
}
