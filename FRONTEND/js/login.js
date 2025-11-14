// ==============================
// Smart City Public Web - login.js
// Handles Login Page
// ==============================

const form = document.querySelector("#login-form");
const msg = document.querySelector("#login-msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const user = document.querySelector("#username").value.trim();
  const pass = document.querySelector("#password").value.trim();

  // 🔐 Mock authentication (replace later with backend fetch)
  const demoUser = "citizen";
  const demoPass = "smartcity123";

  if (user === demoUser && pass === demoPass) {
    msg.style.color = "lightgreen";
    msg.textContent = "✅ Login successful! Redirecting...";

    // Save login state
    localStorage.setItem("smartcity_logged_in", "true");

    // Redirect to homepage after 1.5s
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } else {
    msg.style.color = "red";
    msg.textContent = "❌ Invalid username or password.";
  }
});
