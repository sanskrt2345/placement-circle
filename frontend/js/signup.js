function sendOTP() {

    const fullName =
        document.getElementById("fullName").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;


    if (!fullName) {
        alert("Please enter your full name.");
        return;
    }


    if (!email) {
        alert("Please enter your college email.");
        return;
    }


    if (!password) {
        alert("Please enter a password.");
        return;
    }


    if (!confirmPassword) {
        alert("Please confirm your password.");
        return;
    }


    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }


    console.log("Signup form is valid.");
}