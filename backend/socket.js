/**
 * Socket.IO chat module.
 * 
 * This module handles real-time chat functionality using Socket.IO. It manages user connections,
 * room join/leave events, message broadcasting, typing indicators, and message storage in MongoDB.
 */

const Message = require("./models/Message");

module.exports = function (io) {
    const users = {}; // Stores connected users with their socket IDs

    io.on("connection", (socket) => {
        console.log("New user connected:", socket.id);

        /**
         * Handles user joining a chat room.
         * - Adds the user to the specified room.
         * - Stores the user's socket ID.
         * - Sends the list of current room members.
         * - Loads previous messages from MongoDB and sends them to the user.
         * - Broadcasts a system message announcing the user's entry.
         */
        socket.on("joinRoom", async ({ username, room }) => {
            socket.join(room);
            users[username] = socket.id;

            console.log(`${username} joined public room: ${room}`);

            io.to(room).emit("roomMembers", users[room]);
            
            const messages = await Message.find({ room }).sort({ timestamp: 1 });
            socket.emit("loadMessages", messages);

            io.to(room).emit("message", { username: "System", message: `${username} joined ${room}` });
        });

        /**
         * Handles sending messages in a chat room.
         * - Stores the message in MongoDB.
         * - Broadcasts the message to all members of the room.
         */
        socket.on("chatMessage", async ({ username, room, message }) => {
            console.log(`Public Message from ${username} in room ${room}: ${message}`);

            const newMessage = new Message({ username, room, message });
            await newMessage.save();

            io.to(room).emit("message", { username, message });
        });

        /**
         * Handles typing indicators.
         * - Notifies all users in the room when a user is typing.
         */
        socket.on("typing", ({ username, room }) => {
            socket.to(room).emit("displayTyping", { username });
        });

        /**
         * Handles stopping of typing indicators.
         * - Notifies all users in the room when a user stops typing.
         */
        socket.on("stopTyping", ({ room }) => {
            socket.to(room).emit("hideTyping");
        });

        /**
         * Handles a user leaving a chat room.
         * - Removes the user from the room.
         * - Updates the list of current members.
         * - Broadcasts updated room members.
         */
        socket.on("leaveRoom", ({ username, room }) => {
            socket.leave(room);
        
            if (Array.isArray(users[room])) {
                users[room] = users[room].filter(user => user !== username);
            }
        
            console.log(`${username} left room: ${room}`);
            console.log(`Current members in ${room}:`, users[room]);
        
            io.to(room).emit("roomMembers", users[room]);
        });

        /**
         * Handles user disconnection.
         * - Removes the user from all rooms they were part of.
         * - Updates the room members list and broadcasts the update.
         */
        socket.on("disconnect", () => {
            let disconnectedUser = null;
            
            for (const room in users) {
                if (Array.isArray(users[room])) {
                    users[room] = users[room].filter(user => {
                        if (user === socket.username) {
                            disconnectedUser = user;
                            return false;
                        }
                        return true;
                    });
        
                    io.to(room).emit("roomMembers", users[room]);
                }
            }
        
            if (disconnectedUser) {
                console.log(`${disconnectedUser} disconnected from chat.`);
            }
        });
    });
};
