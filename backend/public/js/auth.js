document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");

    // Signup Handler
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const firstname = document.getElementById("firstname").value;
            const lastname = document.getElementById("lastname").value;
            const password = document.getElementById("password").value;

            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, firstname, lastname, password }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Signup successful! Please login.");
                window.location.href = "login.html";
            } else {
                alert(data.message || "Signup failed.");
            }
        });
    }

    // Login Handler
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("username", data.username);
                alert("Login successful!");
                window.location.href = "chat.html"; // Redirect to chat page
            } else {
                alert(data.message || "Login failed.");
            }
        });
    }
});
