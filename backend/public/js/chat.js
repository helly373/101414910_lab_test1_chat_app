const socket = io();
const username = localStorage.getItem("username");

const urlParams = new URLSearchParams(window.location.search);
let room = urlParams.get("room");

if (!room) {
    room = sessionStorage.getItem("chatRoom");}
if (!username || !room) {
    window.location.href = "join-room.html"; // Redirect if no username or room
} else {
    document.getElementById("roomName").innerText = room;
}

sessionStorage.setItem("chatRoom", room);

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

socket.on("message", (data) => {
    const chatBox = document.getElementById("chatBox");
    const messageDiv = document.createElement("div");
    messageDiv.className = "message";
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="sender">${data.username} ${time}</div>
        <div class="content">${data.message}</div>
    `;
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});
socket.on("roomMembers", (members) => {
    console.log("Received room members:", members); 
    updateMembersList(members);
});
function updateMembersList(members) {
    console.log("Updating members list with:", members); 
    const membersList = document.getElementById("membersList");
    if (!membersList) {
        console.error("membersList element not found!");
        return;
    }
    if (!Array.isArray(members)) {
        console.error("members is not an array:", members);
        return;
    }
    membersList.innerHTML = members.map(member => `
        <div class="member">${member}</div>
    `).join('');
}



const messageInput = document.getElementById("messageInput");
let typingTimer;

messageInput.addEventListener("input", () => {
    socket.emit("typing", { username, room });

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        socket.emit("stopTyping", { room });
    }, 1500);
});

socket.on("displayTyping", ({ username }) => {
    console.log(`${username} is typing...`); // Debugging
    const typingDiv = document.getElementById("typingIndicator");
    typingDiv.innerHTML = `<em>${username} is typing...</em>`;
});

socket.on("hideTyping", () => {
    document.getElementById("typingIndicator").innerHTML = "";
});

function sendMessage() {
    const message = document.getElementById("messageInput").value;
    if (message.trim() !== "") {
        socket.emit("chatMessage", { username, room, message });
        document.getElementById("messageInput").value = "";
    }
}

function leaveRoom() {
    socket.emit("leaveRoom", { username, room }); 
    sessionStorage.removeItem("chatRoom");
    window.location.href = "../view/join-room.html"; 
}
