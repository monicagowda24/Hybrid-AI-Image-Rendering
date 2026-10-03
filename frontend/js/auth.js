document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.querySelector("form");

    if (!loginForm) {
        console.error("Login form not found.");
        return;
    }

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const emailInput =
            loginForm.querySelector('input[type="email"]');

        const passwordInput =
            loginForm.querySelector('input[type="password"]');

        if (!emailInput || !passwordInput) {
            alert("Email or password field not found.");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }

        try {

            console.log("Sending login request...");

            const response = await fetch(
                "http://127.0.0.1:8000/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            console.log("Login response:", data);

            if (!response.ok) {

                alert(
                    data.detail || "Invalid email or password."
                );

                return;
            }

            // ================================
            // SAVE LOGIN INFORMATION
            // ================================

            localStorage.setItem(
                "access_token",
                data.access_token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            console.log("Token saved.");
            console.log("User saved.");

            alert("Login successful!");

            // ================================
            // GO TO WORKSPACE
            // ================================

            window.location.href = "../index.html";

        } catch (error) {

            console.error("Login error:", error);

            alert(
                "Unable to connect to the server. " +
                "Please make sure FastAPI is running."
            );
        }

    });

});