/* =====================================================
   QUESTION PAGE
   GET  /api/questions/:id
   POST /api/questions/:id/attempt
     - MCQ (Aptitude): graded by the server -> { answer }
     - DSA / HR: self-assessed            -> { solved: true | false }
===================================================== */

(function () {

    const esc = Api.esc;
    const id = Api.param("id");
    const fromDaily = Api.param("from") === "daily";

    const el = function (name) { return document.getElementById(name); };

    let question = null;
    let selected = null;
    let startedAt = Date.now();


    /* ---------- back link ---------- */

    if (fromDaily) {
        el("backLink").href = "daily-prep.html";
        el("backLink").textContent = "‹ Back to Daily Prep";
    }

    if (!id) {
        window.location.href = "practice.html";
        return;
    }


    /* ---------- helpers ---------- */

    // escape first, then allow a tiny bit of formatting (line breaks and `code`)
    function format(text) {
        return esc(text)
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\n/g, "<br>");
    }

    function showError(message) {
        el("qLoading").textContent = message;
    }


    /* ---------- render ---------- */

    function renderQuestion(q) {

        question = q;

        el("qCat").textContent = q.category;
        el("qDiff").textContent = q.difficulty;
        el("qDiff").className = "q-diff " + q.difficulty.toLowerCase();
        el("qTime").textContent = "◷ " + q.timeMinutes + " min";
        el("qSolved").hidden = !q.solved;
        el("qTitle").textContent = q.title;
        el("qCompanies").textContent =
            q.topic + (q.companies.length ? " · " + q.companies.join(", ") : "");
        el("qBody").innerHTML = format(q.description);
        el("qHint").textContent = q.hint || "No hint for this one - trust your instincts!";

        if (q.type === "mcq") {

            el("qOptions").innerHTML = q.options.map(function (option) {
                return '<button type="button" class="q-option" data-value="' + esc(option) + '">' + esc(option) + "</button>";
            }).join("");

            el("qActions").innerHTML =
                '<button type="button" class="q-btn primary" id="submitAnswer" disabled>Submit answer</button>';

        } else {

            el("qOptions").innerHTML = "";

            el("qActions").innerHTML =
                '<p class="q-note">Work it out on paper or in your editor, then tell us honestly how it went.</p>' +
                '<button type="button" class="q-btn primary" id="markSolved">I solved it ✓</button>' +
                '<button type="button" class="q-btn" id="markUnsolved">Not yet</button>';

        }

        el("qLoading").hidden = true;
        el("qContent").hidden = false;

    }

    function showResult(r) {

        const box = el("qResult");
        const lines = [];
        const isMcq = question.type === "mcq";

        if (r.correct) {
            lines.push('<h3 class="good">' + (isMcq ? "✓ Correct!" : "✓ Nice work!") + "</h3>");
        } else if (isMcq) {
            lines.push('<h3 class="bad">Not quite - give it another go.</h3>');
        } else {
            lines.push('<h3 class="bad">No worries - come back to it after reading the hint.</h3>');
        }

        if (r.pointsAwarded > 0) {
            lines.push('<p class="points">+' + r.pointsAwarded + " points</p>");
        } else if (r.correct) {
            lines.push('<p class="muted">You had already solved this one, so no extra points this time.</p>');
        }

        if (r.bonusAwarded > 0) {
            lines.push('<p class="points">+' + r.bonusAwarded + " bonus - today's mission is complete! 🎉</p>");
        }

        lines.push(
            '<p class="muted">Today\'s mission: ' + r.mission.completed + "/" + r.mission.total +
            " · Streak: " + r.streak + " day" + (r.streak === 1 ? "" : "s") +
            " · Total points: " + r.totalPoints + "</p>"
        );

        if (r.explanation) {
            lines.push('<div class="explain"><strong>Explanation</strong><p>' + format(r.explanation) + "</p></div>");
        }

        const next = fromDaily
            ? '<a class="q-btn primary" href="daily-prep.html">Back to Daily Prep</a>'
            : '<a class="q-btn primary" href="practice.html">More questions</a>';

        const retry = !r.correct
            ? '<button type="button" class="q-btn" id="tryAgain">Try again</button>'
            : "";

        lines.push('<div class="q-actions">' + retry + next + "</div>");

        box.innerHTML = lines.join("");
        box.hidden = false;
        box.className = "q-result " + (r.correct ? "ok" : "no");

        if (r.correct) {
            el("qSolved").hidden = false;
            el("qActions").hidden = true;
            document.querySelectorAll(".q-option").forEach(function (o) {
                o.disabled = true;
                if (o.dataset.value === r.correctAnswer) o.classList.add("correct");
            });
        } else {
            el("qActions").hidden = true;
        }

    }

    function submit(payload, button) {

        payload.timeSpentSec = Math.min(Math.round((Date.now() - startedAt) / 1000), 86400);

        document.querySelectorAll(".q-btn, .q-option").forEach(function (b) { b.disabled = true; });

        Api.post("/api/questions/" + id + "/attempt", payload)
            .then(showResult)
            .catch(function (err) {
                alert(err.message);
                document.querySelectorAll(".q-btn, .q-option").forEach(function (b) { b.disabled = false; });
            });

    }


    /* ---------- events ---------- */

    el("qOptions").addEventListener("click", function (e) {

        const option = e.target.closest(".q-option");

        if (!option || option.disabled) return;

        document.querySelectorAll(".q-option").forEach(function (o) { o.classList.remove("selected"); });

        option.classList.add("selected");
        selected = option.dataset.value;

        el("submitAnswer").disabled = false;

    });

    el("qActions").addEventListener("click", function (e) {

        const target = e.target.closest("button");

        if (!target) return;

        if (target.id === "submitAnswer" && selected) submit({ answer: selected }, target);
        if (target.id === "markSolved") submit({ solved: true }, target);
        if (target.id === "markUnsolved") submit({ solved: false }, target);

    });

    el("qResult").addEventListener("click", function (e) {

        if (e.target.id !== "tryAgain") return;

        el("qResult").hidden = true;
        el("qActions").hidden = false;
        startedAt = Date.now();
        selected = null;

        document.querySelectorAll(".q-option").forEach(function (o) {
            o.disabled = false;
            o.classList.remove("selected");
        });
        document.querySelectorAll(".q-btn").forEach(function (b) { b.disabled = false; });

        if (el("submitAnswer")) el("submitAnswer").disabled = true;

    });

    el("logoutBtn").addEventListener("click", function () {
        Api.logout();
    });

    el("themeBtn").addEventListener("click", function () {
        document.body.classList.toggle("light-mode");
    });


    /* ---------- load ---------- */

    Api.get("/api/questions/" + encodeURIComponent(id))
        .then(function (data) { renderQuestion(data.question); })
        .catch(function (err) { showError(err.status === 404 ? "This question no longer exists." : err.message); });

})();
