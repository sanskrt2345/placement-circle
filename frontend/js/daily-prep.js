/* =========================================================
   DAILY PREP JAVASCRIPT
   Today's 3 questions come from GET /api/daily
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const grid = document.getElementById("questionGrid");

    const completedCount =
        document.getElementById("completedCount");

    const missionStatus =
        document.getElementById("missionStatus");

    const themeBtn =
        document.getElementById("themeBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const esc = Api.esc;


    /* =====================================================
       RENDER TODAY'S QUESTIONS
       ===================================================== */

    function cardHTML(q) {

        return `
            <article class="question-card">
                <div class="card-top">
                    <span class="category">${esc(q.category)}</span>
                    <span class="arrow">${q.solved ? "✓" : "›"}</span>
                </div>
                <h2>${esc(q.title)}</h2>
                <div class="question-meta">
                    <span>${esc(q.difficulty)}</span>
                    <span class="dot">•</span>
                    <span class="clock">◷</span>
                    <span>${q.timeMinutes} min</span>
                </div>
                <button class="start-btn" data-id="${q.id}">
                    ${q.solved ? "Review" : "Start"} <span>›</span>
                </button>
            </article>`;
    }

    function render(mission) {

        completedCount.textContent = mission.completed;

        missionStatus.textContent = mission.done
            ? "All done! +" + mission.bonusPoints + " bonus"
            : mission.remaining + " left";

        grid.innerHTML = mission.questions.length
            ? mission.questions.map(cardHTML).join("")
            : '<p style="opacity:.65">No questions available yet. Check back soon.</p>';
    }

    Api.get("/api/daily")
        .then(render)
        .catch(function (err) {
            grid.innerHTML = '<p style="opacity:.75">' + esc(err.message) + "</p>";
        });


    /* =====================================================
       START QUESTION  (cards are rendered later, so listen on the grid)
       ===================================================== */

    grid.addEventListener("click", function (event) {

        const button = event.target.closest(".start-btn");

        if (!button) {
            return;
        }

        window.location.href =
            "question.html?id=" + button.dataset.id;
    });


    /* =====================================================
       THEME
       ===================================================== */

    if (localStorage.getItem("placementTheme") === "light") {

        document.body.classList.add("light-mode");

        if (themeBtn) {

            themeBtn.innerHTML =
                "<span>☾</span><span>Dark mode</span>";

        }

    }


    if (themeBtn) {

        themeBtn.addEventListener("click", function () {

            document.body.classList.toggle("light-mode");


            if (document.body.classList.contains("light-mode")) {

                localStorage.setItem(
                    "placementTheme",
                    "light"
                );

                themeBtn.innerHTML =
                    "<span>☾</span><span>Dark mode</span>";

            } else {

                localStorage.setItem(
                    "placementTheme",
                    "dark"
                );

                themeBtn.innerHTML =
                    "<span>☼</span><span>Light mode</span>";

            }

        });

    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener("click", function () {

            if (confirm("Are you sure you want to log out?")) {

                Api.logout();

            }

        });

    }

});
