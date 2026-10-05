/* =====================================================
   DASHBOARD
   Everything on this page comes from GET /api/dashboard
===================================================== */
document.addEventListener("DOMContentLoaded", function () {

    const esc = Api.esc;


    // =====================================================
    // LIGHT MODE  (remembered in this browser)
    // =====================================================

    if (localStorage.getItem("placementTheme") === "light") {
        document.body.classList.add("light-mode");
    }

    const bottomButtons = document.querySelectorAll(".bottom-item");

    if (bottomButtons.length > 0) {
        bottomButtons[0].addEventListener("click", function () {
            document.body.classList.toggle("light-mode");
            localStorage.setItem(
                "placementTheme",
                document.body.classList.contains("light-mode") ? "light" : "dark"
            );
        });
    }

    // Logout is handled by the inline logout() in dashboard.html (clears the cookie)


    // =====================================================
    // SIDEBAR NAVIGATION
    // =====================================================

    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(function (item) {
        item.addEventListener("click", function (event) {
            const link = this.getAttribute("href");

            if (!link || link === "#") {
                event.preventDefault();
            }

            navItems.forEach(function (nav) {
                nav.classList.remove("active");
            });

            this.classList.add("active");
        });
    });


    // =====================================================
    // HELPERS
    // =====================================================

    function greetingFor(name) {
        const hour = new Date().getHours();
        const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
        return "Good " + part + ", " + name + " 👋";
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function dueLabel(daysLeft) {
        if (daysLeft <= 0) return "Today";
        return daysLeft === 1 ? "1 day" : daysLeft + " days";
    }

    function empty(text) {
        return '<p class="empty-note" style="opacity:.65;font-size:13px;padding:6px 2px">' + esc(text) + "</p>";
    }

    // Anything with data-href behaves like a link
    document.addEventListener("click", function (e) {
        const target = e.target.closest("[data-href]");
        if (target) window.location.href = target.dataset.href;
    });


    // =====================================================
    // RENDER
    // =====================================================

    function renderMission(mission) {
        setText("missionCount", mission.completed + "/" + mission.total);
        setText(
            "missionText",
            mission.done
                ? "All done today! +" + mission.bonusPoints + " bonus points earned"
                : mission.completed + " / " + mission.total + " completed"
        );

        document.getElementById("missionGrid").innerHTML = mission.questions.map(function (q) {
            return `
                <div class="question-card" data-href="question.html?id=${q.id}" style="cursor:pointer">
                    <div class="question-top">
                        <span class="question-type">${esc(q.category)}</span>
                        <span>${q.solved ? "✓" : "ϟ"}</span>
                    </div>
                    <h3>${esc(q.title)}</h3>
                    <p>${esc(q.difficulty)} · ${q.timeMinutes} min</p>
                </div>`;
        }).join("") || empty("No questions available yet.");
    }

    function renderStreak(streak, stats) {
        setText(
            "streakTitle",
            streak.current > 0 ? streak.current + "-day streak" : "Start your streak"
        );

        document.getElementById("streakGrid").innerHTML = streak.last35Days.map(function (on) {
            return on ? '<span class="filled"></span>' : "<span></span>";
        }).join("");

        setText("statPoints", stats.points);
        setText("statSolved", stats.solved);
        setText("statAccuracy", stats.accuracy + "%");
    }

    function renderPicks(picks) {
        const coach = `
            <div class="recommendation featured" data-href="daily-prep.html" style="cursor:pointer">
                <h3>Coach says</h3>
                <p>${esc(picks.coach)}</p>
                <span>→</span>
            </div>`;

        const items = picks.items.map(function (item) {
            return `
                <div class="recommendation" data-href="${esc(item.href)}" style="cursor:pointer">
                    <h3>${esc(item.title)}</h3>
                    <p>${esc(item.text)}</p>
                </div>`;
        }).join("");

        document.getElementById("picksList").innerHTML = coach + items;
    }

    function renderJobs(list) {
        document.getElementById("jobsList").innerHTML = list.map(function (o) {
            return `
                <div class="job-item">
                    <div>
                        <h3>${esc(o.title)}</h3>
                        <p>${esc(o.company)} · ${esc(o.location)} · ${esc(o.pay)}</p>
                    </div>
                    <span class="today">${dueLabel(o.daysLeft)}</span>
                </div>`;
        }).join("") || empty("No open opportunities right now.");
    }

    function renderAlumni(list) {
        document.getElementById("alumniGrid").innerHTML = list.map(function (a) {
            const tip = a.tip.length > 90 ? a.tip.slice(0, 87) + "..." : a.tip;
            return `
                <div class="alumni-card">
                    <span class="company">${esc(a.company.toUpperCase())}</span>
                    <h3>${esc(a.role)}</h3>
                    <p>${esc(a.name)} · Class of ${esc(a.year)}</p>
                    <span>${esc(tip)}</span>
                </div>`;
        }).join("") || empty("No alumni stories yet.");
    }

    function renderBoard(rows) {
        document.getElementById("boardList").innerHTML = rows.map(function (r) {
            return `
                <div class="leaderboard-row${r.isYou ? " current-user" : ""}">
                    <span class="rank">#${r.rank}</span>
                    <div>
                        <strong>${esc(r.name)}${r.isYou ? " (You)" : ""}</strong>
                        <small>${esc(r.branch || "-")}</small>
                    </div>
                    <strong>${r.points}</strong>
                </div>`;
        }).join("") || empty("No students yet.");
    }

    Api.get("/api/dashboard")
        .then(function (d) {
            setText("greeting", greetingFor(d.user.firstName));
            renderMission(d.mission);
            renderStreak(d.streak, d.stats);
            renderPicks(d.picks);
            renderJobs(d.closingSoon);
            renderAlumni(d.alumni);
            renderBoard(d.leaderboard);
        })
        .catch(function (err) {
            setText("greeting", "Something went wrong");
            setText("missionText", err.message);
        });

});
