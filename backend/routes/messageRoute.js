const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

// Get messages from a specific room
router.get("/:room", async (req, res) => {
    try {
        const messages = await Message.find({ room: req.params.room }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error fetching messages", error });
    }
});

router.get("/messages/private/:user1/:user2", async (req, res) => {
    const { user1, user2 } = req.params;
    try {
        const messages = await Message.find({
            room: "private",
            $or: [
                { username: user1, receiver: user2 },
                { username: user2, receiver: user1 }
            ]
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error fetching private messages" });
    }
});


// Send a private message
router.post("/private", async (req, res) => {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const newMessage = new Message({
            username: sender,
            receiver,
            message,
            room: "private",
            timestamp: new Date(),
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error sending private message:", error);
        res.status(500).json({ message: "Error sending private message" });
    }
});
module.exports = router;
