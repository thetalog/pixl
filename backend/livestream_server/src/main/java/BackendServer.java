import java.net.InetSocketAddress;
import java.util.concurrent.ConcurrentHashMap;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.kurento.client.IceCandidate;
import org.kurento.client.KurentoClient;
import org.kurento.client.MediaPipeline;
import org.kurento.client.WebRtcEndpoint;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class BackendServer extends WebSocketServer {

    private static KurentoClient kurento;
    private static final Gson gson = new Gson();

    private final ConcurrentHashMap<String, LiveRoom> rooms = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<WebSocket, WebRtcEndpoint> endpoints = new ConcurrentHashMap<>();

    static class LiveRoom {
        MediaPipeline pipeline;
        WebRtcEndpoint publisher;
        boolean publisherReady = false;
        ConcurrentHashMap<WebSocket, WebRtcEndpoint> viewers = new ConcurrentHashMap<>();
    }

    public BackendServer(int port) {
        super(new InetSocketAddress(port));
        setReuseAddr(true);
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {

        try {
            String path = handshake.getResourceDescriptor();

            String[] parts = path.split("\\?");
            String liveId = parts[0].replace("/live/", "");
            boolean isPublisher = path.contains("role=publisher");

            System.out.println("Client joined liveId=" + liveId + " publisher=" + isPublisher);

            LiveRoom room = rooms.get(liveId);

            if (isPublisher) {

                room = new LiveRoom();
                room.pipeline = kurento.createMediaPipeline();
                room.publisher = new WebRtcEndpoint.Builder(room.pipeline).build();

                setupIce(room.publisher, conn);

                rooms.put(liveId, room);
                endpoints.put(conn, room.publisher);

                System.out.println("Publisher created");

            } else {

                if (room == null || !room.publisherReady) {
                    System.out.println("Viewer rejected (publisher not ready)");
                    conn.close();
                    return;
                }

                WebRtcEndpoint viewer = new WebRtcEndpoint.Builder(room.pipeline).build();
                room.publisher.connect(viewer);

                setupIce(viewer, conn);

                room.viewers.put(conn, viewer);
                endpoints.put(conn, viewer);

                System.out.println("Viewer joined");
            }

            JsonObject ready = new JsonObject();
            ready.addProperty("type", "ready");
            conn.send(gson.toJson(ready));

        } catch (Exception e) {
            e.printStackTrace();
            conn.close();
        }
    }

    private void setupIce(WebRtcEndpoint ep, WebSocket conn) {

        ep.addIceCandidateFoundListener(event -> {
            IceCandidate c = event.getCandidate();

            JsonObject msg = new JsonObject();
            msg.addProperty("type", "ice");
            msg.addProperty("candidate", c.getCandidate());
            msg.addProperty("sdpMid", c.getSdpMid());
            msg.addProperty("sdpMLineIndex", c.getSdpMLineIndex());

            if (conn.isOpen()) conn.send(gson.toJson(msg));
        });
    }

    @Override
    public void onMessage(WebSocket conn, String message) {

        try {
            JsonObject json = JsonParser.parseString(message).getAsJsonObject();
            String type = json.get("type").getAsString();

            WebRtcEndpoint ep = endpoints.get(conn);
            if (ep == null) return;

            switch (type) {

                case "offer":

                    String sdp = json.get("sdp").getAsString();

                    String answer = ep.processOffer(sdp);
                    ep.gatherCandidates();

                    JsonObject ans = new JsonObject();
                    ans.addProperty("type", "answer");
                    ans.addProperty("sdp", answer);
                    conn.send(gson.toJson(ans));

                    // Mark publisher ready
                    rooms.forEach((id, room) -> {
                        if (room.publisher == ep) {
                            room.publisherReady = true;
                            System.out.println("Publisher negotiated for " + id);
                        }
                    });

                    break;

                case "ice":

                    IceCandidate cand = new IceCandidate(
                            json.get("candidate").getAsString(),
                            json.has("sdpMid") ? json.get("sdpMid").getAsString() : null,
                            json.has("sdpMLineIndex") ? json.get("sdpMLineIndex").getAsInt() : 0
                    );

                    ep.addIceCandidate(cand);
                    break;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {

        System.out.println("Disconnected");

        WebRtcEndpoint ep = endpoints.remove(conn);
        if (ep != null) ep.release();

        rooms.forEach((id, room) -> {

            room.viewers.remove(conn);

            if (room.publisher == ep) {

                room.viewers.values().forEach(WebRtcEndpoint::release);

                try { room.pipeline.release(); } catch (Exception e) {}

                rooms.remove(id);
                System.out.println("Room destroyed " + id);
            }
        });
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        ex.printStackTrace();
    }

    @Override
    public void onStart() {
        System.out.println("WebSocket server started");
    }

    public static void main(String[] args) {

        try {
            kurento = KurentoClient.create("ws://localhost:8890/kurento");

            BackendServer server = new BackendServer(9090);
            server.start();

            System.out.println("Kurento signaling server on 9090");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
