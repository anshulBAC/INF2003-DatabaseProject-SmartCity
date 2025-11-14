// ==============================
// Smart City Public Web - main.js
// ==============================

// ==============================
// Login Protection
// ==============================
(function () {
  const isLoginPage = window.location.pathname.includes("login.html");
  const loggedIn = localStorage.getItem("smartcity_logged_in");

  // Redirect to login if not logged in
  if (!isLoginPage && loggedIn !== "true") {
    window.location.href = "login.html";
  }

  // If already logged in, prevent visiting login page
  if (isLoginPage && loggedIn === "true") {
    window.location.href = "index.html";
  }
})();

// ==============================
// Logout Function
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector("#logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("smartcity_logged_in");

      // Redirect to login page
      window.location.replace("login.html");

      // Extra hardening: disable back navigation AFTER logout
      window.history.pushState(null, "", "login.html");
      window.onpopstate = () => {
        window.history.pushState(null, "", "login.html");
      };
    });
  }
});
