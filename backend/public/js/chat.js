const socket = io();
const username = localStorage.getItem("username");
const room = localStorage.getItem("chatRoom");

if (!username || !room) {
    window.location.href = "join-room.html"; // Redirect if no username or room
}

document.getElementById("roomName").innerText = room;

//  Fetch previous messages (Room-based chat)
fetch(`/api/messages/${room}`)
    .then(response => response.json())
    .then(messages => {
        const chatBox = document.getElementById("chatBox");
        messages.forEach(msg => {
            const messageDiv = document.createElement("div");
            messageDiv.innerHTML = `<strong>${msg.username}:</strong> ${msg.message}`;
            chatBox.appendChild(messageDiv);
        });
    });

socket.emit("joinRoom", { username, room });

//  Receive room messages
socket.on("message", (data) => {
    const chatBox = document.getElementById("chatBox");

    // ✅ Ensure correct sender name appears
    const messageDiv = document.createElement("div");
    
    if (data.username === username) {
        // ✅ Show "You" for the current user
        messageDiv.innerHTML = `<strong>(You):</strong> ${data.message}`;
    } else {
        // ✅ Show the actual sender's name
        messageDiv.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    }
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Typing event logic
const messageInput = document.getElementById("messageInput");
let typingTimer;

messageInput.addEventListener("input", () => {
    socket.emit("typing", { username, room });

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        socket.emit("stopTyping", { room });
    }, 1500);
});

// Show "User is typing..." indicator
socket.on("displayTyping", ({ username }) => {
    console.log(`${username} is typing...`); // Debugging
    const typingDiv = document.getElementById("typingIndicator");
    typingDiv.innerHTML = `<em>${username} is typing...</em>`;
});

// Hide typing indicator
socket.on("hideTyping", () => {
    document.getElementById("typingIndicator").innerHTML = "";
});

// Send public message
function sendMessage() {
    const message = document.getElementById("messageInput").value;
    if (message.trim() !== "") {
        socket.emit("chatMessage", { username, room, message });
        document.getElementById("messageInput").value = "";
    }
}

//  Send private message
function sendPrivateMessage() {
    const receiver = document.getElementById("privateUser").value.trim();
    const privateMessage = document.getElementById("privateMessage").value.trim();

    if (receiver !== "" && privateMessage !== "") {
        socket.emit("privateMessage", { sender: username, receiver, message: privateMessage });
        document.getElementById("privateMessage").value = "";

        const chatBox = document.getElementById("chatBox");
        const messageDiv = document.createElement("div");
        messageDiv.innerHTML = `<strong>(Private) To ${receiver}:</strong> ${privateMessage}`;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Receive private messages
socket.on("privateMessage", ({ sender, message }) => {
    const chatBox = document.getElementById("chatBox");
    const messageDiv = document.createElement("div");
    messageDiv.innerHTML = `<strong>(Private) ${sender}:</strong> ${message}`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Handle user leaving the room
function leaveRoom() {
    socket.emit("leaveRoom", { username, room }); // Notify server
    localStorage.removeItem("chatRoom"); // Remove room from local storage
    localStorage.removeItem("username"); // Remove username for safety
    window.location.href = "../view/join-room.html"; // Redirect to the join-room page
}
