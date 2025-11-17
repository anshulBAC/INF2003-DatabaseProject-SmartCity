const form = document.querySelector("#role-form");
const msg = document.querySelector("#login-msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const role = document.querySelector("#role").value;

  if (!role) {
    msg.style.color = "red";
    msg.textContent = "Please choose a role.";
    return;
  }

  // Set both authentication flags
  localStorage.setItem("smartcity_role", role);
  localStorage.setItem("smartcity_logged_in", "true");

  msg.style.color = "lightgreen";
  msg.textContent = `${role.toUpperCase()} selected. Redirecting...`;

  setTimeout(() => {
    if (role === "user") {
      window.location.replace("dashboard_with_routing.html");
    } else if (role === "admin") {
      window.location.replace("index.html"); 
    }
  }, 1200);
});
