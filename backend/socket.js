const Message = require("./models/Message");

module.exports = function (io) {
    const users = {}; // ✅ Store connected users with socket IDs

    io.on("connection", (socket) => {
        console.log("🔌 New user connected");

        // ✅ Handle user joining a room
        socket.on("joinRoom", async ({ username, room }) => {
            socket.join(room);
            users[username] = socket.id; // ✅ Store user socket ID

            // ✅ Send previous messages from MongoDB
            const messages = await Message.find({ room }).sort({ timestamp: 1 });
            socket.emit("loadMessages", messages);

            io.to(room).emit("message", { username: "System", message: `${username} joined ${room}` });
        });

        socket.on("chatMessage", async ({ username, room, message }) => {
            console.log(`📨 Message received from ${username} in room ${room}: ${message}`);
        
            // ✅ Save the message with the correct username
            const newMessage = new Message({ username, room, message });
            await newMessage.save();
        
            // ✅ Ensure the correct username is sent in the broadcast
            io.to(room).emit("message", { username: username, message });
        });

        // ✅ Handle private messaging
        socket.on("privateMessage", async ({ sender, receiver, message }) => {
            const receiverSocketId = users[receiver]; // ✅ Get receiver’s socket ID

            console.log(`📨 Private Message from ${sender} to ${receiver}: ${message}`);

            if (receiverSocketId) {
                // ✅ Send private message directly to the receiver
                io.to(receiverSocketId).emit("privateMessage", { sender, message });
            } else {
                // ✅ Notify sender that the recipient is offline
                socket.emit("message", { username: "System", message: `${receiver} is not online.` });
            }

            // ✅ Save private message to MongoDB
            const newMessage = new Message({
                username: sender,
                receiver,
                room: "private",
                message,
            });
            await newMessage.save();
        });


        // ✅ Typing indicator functionality
        socket.on("typing", ({ username, room }) => {
            socket.to(room).emit("displayTyping", { username });
        });

        socket.on("stopTyping", ({ room }) => {
            socket.to(room).emit("hideTyping");
        });

        // ✅ Handle user leaving a room
        socket.on("leaveRoom", ({ username, room }) => {
            socket.leave(room);
            io.to(room).emit("message", { username: "System", message: `${username} has left the room.` });
            delete users[username]; // ✅ Remove user from tracking
        });

        // ✅ Handle user disconnecting
        socket.on("disconnect", () => {
            const user = Object.keys(users).find((key) => users[key] === socket.id);
            if (user) delete users[user]; // ✅ Remove user from tracking
            console.log("❌ User disconnected");
        });
    });
};
