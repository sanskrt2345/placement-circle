/* =====================================================
   SIGNUP  (2 steps)
   1. sendOTP()   -> backend validates the form and emails a 6-digit code
   2. verifyOTP() -> backend checks the code, creates the account
                     and logs the user in (httpOnly cookie)
===================================================== */

var otpEmail = "";
var resendTimer = null;

function $(id) {
    return document.getElementById(id);
}

function showError(message) {
    $("formInfo").hidden = true;
    $("formError").textContent = message;
    $("formError").hidden = false;
}

function showInfo(message) {
    $("formError").hidden = true;
    $("formInfo").textContent = message;
    $("formInfo").hidden = false;
}

function clearMessages() {
    $("formError").hidden = true;
    $("formInfo").hidden = true;
}

/* Disable "Resend" for a few seconds (the server enforces this too) */
function startResendCooldown(seconds) {
    var button = $("resendBtn");
    clearInterval(resendTimer);
    button.disabled = true;

    function tick() {
        if (seconds <= 0) {
            clearInterval(resendTimer);
            button.disabled = false;
            button.textContent = "Resend code";
            return;
        }
        button.textContent = "Resend code in " + seconds + "s";
        seconds--;
    }

    tick();
    resendTimer = setInterval(tick, 1000);
}

function showOtpStep(data) {
    otpEmail = data.email;
    $("otpStep").hidden = false;
    $("sendOtpBtn").textContent = "Change details & resend";
    showInfo(data.message);
    startResendCooldown(data.resendAfterSeconds || 60);
    $("otp").focus();

    /* Only present when the server runs with DEV_EXPOSE_OTP=true */
    if (data.devOtp) {
        showInfo(data.message + " (dev code: " + data.devOtp + ")");
    }
}

function sendOTP() {

    clearMessages();

    const fullName = $("fullName").value.trim();
    const email = $("email").value.trim();
    const password = $("password").value;
    const confirmPassword = $("confirmPassword").value;
    const branch = $("branch").value;
    const year = $("year").value;

    if (!fullName) {
        showError("Please enter your full name.");
        return;
    }

    if (!email) {
        showError("Please enter your college email.");
        return;
    }

    if (!password) {
        showError("Please enter a password.");
        return;
    }

    if (!confirmPassword) {
        showError("Please confirm your password.");
        return;
    }

    if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
    }

    const button = $("sendOtpBtn");
    Api.busy(button, true, "Sending...");

    Api.post("/api/auth/signup/request-otp", {
        fullName: fullName,
        email: email,
        password: password,
        branch: branch,
        year: year
    })
        .then(function (data) {
            Api.busy(button, false);
            showOtpStep(data);
        })
        .catch(function (err) {
            Api.busy(button, false);
            showError(err.message);
        });
}

function verifyOTP() {

    clearMessages();

    const otp = $("otp").value.trim();

    if (!/^\d{6}$/.test(otp)) {
        showError("Enter the 6-digit code from your email.");
        return;
    }

    const button = $("verifyBtn");
    Api.busy(button, true, "Verifying...");

    Api.post("/api/auth/signup/verify", { email: otpEmail, otp: otp })
        .then(function () {
            window.location.href = "dashboard.html";
        })
        .catch(function (err) {
            Api.busy(button, false);
            showError(err.message);
        });
}

function resendOTP() {

    clearMessages();

    Api.post("/api/auth/signup/resend-otp", { email: otpEmail })
        .then(showOtpStep)
        .catch(function (err) {
            showError(err.message);
        });
}

document.addEventListener("DOMContentLoaded", function () {
    /* Pressing Enter in the code box verifies */
    $("otp").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            verifyOTP();
        }
    });
});
