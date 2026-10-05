/* =====================================================
   LOGIN
   Sends the email + password to the backend. On success the
   server sets an httpOnly cookie and we go to the dashboard.
===================================================== */
document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const formError = document.getElementById("formError");

    if (!loginForm) {
        return;
    }

    function showError(message) {
        formError.textContent = message;
        formError.hidden = false;
    }

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();
        formError.hidden = true;

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const button = loginForm.querySelector(".login-btn");

        if (!email || !password) {
            showError("Please enter your email and password.");
            return;
        }

        Api.busy(button, true, "Logging in...");

        Api.post("/api/auth/login", { email: email, password: password })
            .then(function () {
                window.location.href = "dashboard.html";
            })
            .catch(function (err) {
                Api.busy(button, false);
                showError(err.message);
            });
    });

});
