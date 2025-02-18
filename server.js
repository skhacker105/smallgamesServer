const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (adjust for security)
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const userSockets = {}; // Store sockets by userId


io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("register", ({ userId }) => {
        if (!userId) return;

        // Store socket for user
        userSockets[userId] = socket;
        socket.join(userId); // Create a room with userId
        console.log(`User ${userId} connected and joined room ${userId}`);
    });

    // Handle message sending
    socket.on("send_message", ({ toUserId, message }) => {
        if (userSockets[toUserId]) {
            io.to(toUserId).emit("receive_message", { message });
            console.log(`Message sent to ${toUserId}: ${message}`);
        } else {
            console.log(`User ${toUserId} not connected.`);
        }
    });

    socket.on("disconnect", () => {
        for (const userId in userSockets) {
            if (userSockets[userId] === socket) {
                delete userSockets[userId];
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
    });
});

// Endpoint to get a list of online users
app.get("/", (req, res) => {
    console.log(Object.keys(userSockets));
    res.send('Working Websocket Server');
});

// Endpoint to get a list of online users from a given list of userIds
app.post("/online-users", (req, res) => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
        return res.status(400).json({ error: "Invalid request. Expected an array of userIds." });
    }

    const onlineUsers = userIds.filter(userId => userSockets.hasOwnProperty(userId));

    res.json({ onlineUsers });
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});
