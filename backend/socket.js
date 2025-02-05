const Message = require("./models/Message");

module.exports = function (io) {
    const users = {}; // ✅ Store connected users with socket IDs

    io.on("connection", (socket) => {
        console.log("🔌 New user connected:", socket.id);

        // ✅ Handle user joining a room
        socket.on("joinRoom", async ({ username, room }) => {
            socket.join(room);
            users[username] = socket.id; // ✅ Store user socket ID

            console.log(`📌 ${username} joined public room: ${room}`);

            io.to(room).emit("roomMembers", users[room]);
            // ✅ Send previous messages from MongoDB
            const messages = await Message.find({ room }).sort({ timestamp: 1 });
            socket.emit("loadMessages", messages);

            io.to(room).emit("message", { username: "System", message: `${username} joined ${room}` });
        });

        // ✅ Handle public chat messages
        socket.on("chatMessage", async ({ username, room, message }) => {
            console.log(`📨 Public Message from ${username} in room ${room}: ${message}`);

            // ✅ Save the message in MongoDB
            const newMessage = new Message({ username, room, message });
            await newMessage.save();

            // ✅ Send the message to the room
            io.to(room).emit("message", { username, message });
        });

    

        // ✅ Typing indicator functionality
        socket.on("typing", ({ username, room }) => {
            socket.to(room).emit("displayTyping", { username });
        });

        socket.on("stopTyping", ({ room }) => {
            socket.to(room).emit("hideTyping");
        });

        socket.on("leaveRoom", ({ username, room }) => {
            socket.leave(room);
        
            if (Array.isArray(users[room])) {
                users[room] = users[room].filter(user => user !== username);
            }
        
            console.log(`🚪 ${username} left room: ${room}`);
            console.log(`🔴 Current members in ${room}:`, users[room]);
        
            io.to(room).emit("roomMembers", users[room]); // ✅ Emit updated member list
        });

            //         // Add this near your other socket listeners
            // socket.on("roomMembers", (members) => {
            //     console.log("Received room members:", members); // Add this debug line
            //     updateMembersList(members);
            // });

            socket.on("disconnect", () => {
                let disconnectedUser = null;
                
                for (const room in users) {
                    if (Array.isArray(users[room])) { // ✅ Ensure it's an array before filtering
                        users[room] = users[room].filter(user => {
                            if (user === socket.username) {
                                disconnectedUser = user;
                                return false; // Remove user
                            }
                            return true;
                        });
            
                        io.to(room).emit("roomMembers", users[room]); // ✅ Update the room members
                    }
                }
            
                if (disconnectedUser) {
                    console.log(`❌ ${disconnectedUser} disconnected from chat.`);
                }
            });
             
    });
};
