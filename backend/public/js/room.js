function joinRoom() {
    const room = document.getElementById("roomSelect").value;
    sessionStorage.setItem("chatRoom", room); // Store the selected room in localStorage
    window.location.href = `chat.html?room=${encodeURIComponent(room)}`;// Redirect to chat page
}

function startPrivateChat() {
    const privateUser = document.getElementById("privateUser").value.trim();

    if (privateUser !== "") {
        localStorage.setItem("privateChatWith", privateUser);
        window.location.href = "private-chat.html"; // Redirect to private chat page
    } else {
        alert("Please enter a username for private chat.");
    }
}


function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("chatRoom");
    window.location.href = "login.html";
}

// Redirect to login if not logged in
if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
}
