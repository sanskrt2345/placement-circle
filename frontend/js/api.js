/* =====================================================
   API CLIENT  (shared by every page)

   - Talks to the Placement Circle backend with fetch()
   - Login is kept in an httpOnly cookie, so no tokens
     are ever stored in JavaScript / localStorage
   - If the backend runs on another origin (e.g. you open the
     pages with VS Code Live Server), set this BEFORE api.js:
         <script>window.PC_API_BASE = "http://localhost:3000";</script>
===================================================== */
(function () {
    "use strict";

    var BASE = (window.PC_API_BASE || "").replace(/\/+$/, "");
    var isPublicPage = /(login|signup)\.html$|\/index\.html$|\/$/.test(window.location.pathname);

    function ApiError(message, status, body) {
        this.name = "ApiError";
        this.message = message;
        this.status = status;
        this.body = body;
    }
    ApiError.prototype = Object.create(Error.prototype);

    function goToLogin() {
        window.location.href = "login.html";
    }

    function request(method, path, body) {
        var options = { method: method, credentials: "include", headers: {} };
        if (body !== undefined) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }
        return fetch(BASE + path, options).then(
            function (res) {
                return res.json().catch(function () { return null; }).then(function (data) {
                    if (res.ok) return data;
                    var isAuthCall = path.indexOf("/api/auth/") === 0;
                    if (res.status === 401 && !isPublicPage && !isAuthCall) goToLogin();
                    throw new ApiError(
                        (data && data.error) || "Something went wrong. Please try again.",
                        res.status,
                        data
                    );
                });
            },
            function () {
                throw new ApiError("Cannot reach the server. Is the backend running?", 0, null);
            }
        );
    }

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // only allow http(s) links in href attributes
    function safeUrl(url) {
        return /^https?:\/\//i.test(String(url || "")) ? url : "#";
    }

    function param(name) {
        return new URLSearchParams(window.location.search).get(name) || "";
    }

    function onReady(fn) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
        else fn();
    }

    // Replaces the hard-coded name / initials / "CSE · Final Year" in the top bar
    function fillUser(user) {
        if (!user) return;
        document.querySelectorAll(".topbar .avatar").forEach(function (el) { el.textContent = user.initials; });
        document.querySelectorAll(".profile-info strong").forEach(function (el) { el.textContent = user.fullName; });
        document.querySelectorAll(".profile-info span").forEach(function (el) { el.textContent = user.subtitle; });
    }

    function logout() {
        return request("POST", "/api/auth/logout")
            .catch(function () {})
            .then(goToLogin);
    }

    // Disables a button while a request is running
    function busy(button, isBusy, busyText) {
        if (!button) return;
        if (isBusy) {
            button.dataset.label = button.textContent;
            if (busyText) button.textContent = busyText;
        } else if (button.dataset.label) {
            button.textContent = button.dataset.label;
        }
        button.disabled = isBusy;
    }

    var api = {
        get: function (path) { return request("GET", path); },
        post: function (path, body) { return request("POST", path, body === undefined ? {} : body); },
        put: function (path, body) { return request("PUT", path, body); },
        del: function (path) { return request("DELETE", path); },
        esc: esc,
        safeUrl: safeUrl,
        param: param,
        busy: busy,
        logout: logout,
        fillUser: fillUser,
        ready: Promise.resolve(null)
    };

    // On every protected page: confirm the session (redirects to login if expired)
    // and fill the top bar. Page scripts can `await Api.ready` to get the user.
    if (!isPublicPage) {
        api.ready = request("GET", "/api/auth/me")
            .then(function (r) {
                onReady(function () { fillUser(r.user); });
                return r.user;
            })
            .catch(function () { return null; });
    }

    window.Api = api;
})();
