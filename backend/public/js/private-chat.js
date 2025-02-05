const socket = io();
const username = localStorage.getItem("username");
const receiver = localStorage.getItem("privateChatWith");

if (!username || !receiver) {
    window.location.href = "join-room.html"; // Redirect if no recipient
}

document.getElementById("privateReceiver").innerText = receiver;

// ✅ Fetch previous private messages
fetch(`/api/messages/private/${username}/${receiver}`)
    .then(response => response.json())
    .then(messages => {
        const chatBox = document.getElementById("chatBox");
        messages.forEach(msg => {
            const senderTag = msg.username === username ? "(You)" : `(From ${msg.username})`;
            const messageDiv = document.createElement("div");
            messageDiv.innerHTML = `<strong>${senderTag}:</strong> ${msg.message}`;
            chatBox.appendChild(messageDiv);
        });
    });

// ✅ Send private message
function sendPrivateMessage() {
    const message = document.getElementById("messageInput").value.trim();
    if (message !== "") {
        socket.emit("privateMessage", { sender: username, receiver, message });
        document.getElementById("messageInput").value = "";

        // ✅ Show sent message in sender's chat box
        const chatBox = document.getElementById("chatBox");
        const messageDiv = document.createElement("div");
        messageDiv.innerHTML = `<strong>(You):</strong> ${message}`;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// ✅ Receive private messages and display them
socket.on("privateMessage", ({ sender, message }) => {
    console.log(`📥 Private message received from ${sender}: ${message}`);

    const chatBox = document.getElementById("chatBox");
    const messageDiv = document.createElement("div");
    messageDiv.innerHTML = `<strong>(From ${sender}):</strong> ${message}`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// ✅ Leave private chat
function leavePrivateChat() {
    localStorage.removeItem("privateChatWith");
    window.location.href = "join-room.html";
}
