const { createServer } = require("http");
const { Server } = require("socket.io");

function initSocket(app) {
    const httpServer = createServer(app);

    const io = new Server(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] },
    });

    global.io = io;

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("joinLive", (liveId) => {
            socket.join(liveId);
            console.log("Joined live:", liveId);
        });
    });

    httpServer.listen(4000, () => {
        console.log("🚀 Socket.IO running on 4000");
    });
}

module.exports = initSocket;
