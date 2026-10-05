/* =====================================================
   LEADERBOARD JAVASCRIPT
===================================================== */

/* =====================================================
   DATA  (loaded from the backend: GET /api/leaderboard)
   The server ranks students by points.
===================================================== */

let board = { you: null, entries: [], total: 0 };   // filled from GET /api/leaderboard


/* =====================================================
   ICONS
===================================================== */

const trophyIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';

const flameIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';


/* =====================================================
   STATE + ELEMENTS
===================================================== */

let scope = "overall";

const youCard = document.getElementById("youCard");
const boardCard = document.getElementById("boardCard");
const scopeButtons = document.querySelectorAll("#scopeFilters .scope-btn");


/* =====================================================
   HELPERS
===================================================== */

function formatPoints(n) {
    return String(n);
}

function rankCell(rank) {

    if (rank === 1) return '<div class="rank gold">' + trophyIcon + "</div>";
    if (rank === 2) return '<div class="rank silver">' + trophyIcon + "</div>";
    if (rank === 3) return '<div class="rank bronze">' + trophyIcon + "</div>";

    return '<div class="rank">#' + rank + "</div>";
}

const esc = Api.esc;

function rowHTML(student, rank) {

    const label = esc(student.name) + (student.isYou ? " (You)" : "");

    return `
        <div class="board-row${student.isYou ? " me" : ""}">

            ${rankCell(rank)}

            <div class="lb-avatar">${esc(student.initials)}</div>

            <div class="lb-info">
                <div class="lb-name">${label}</div>
                <div class="lb-meta">${esc(student.branch || "-")} · ${esc(student.year || "-")}</div>
            </div>

            <div class="streak">${flameIcon}<span>${student.streak}</span></div>

            <div class="lb-points">${formatPoints(student.points)}</div>

        </div>
    `;
}


/* =====================================================
   RENDER
===================================================== */

function render() {

    const list = board.entries;
    const me = board.you;

    // "You" card
    if (me) {
        youCard.hidden = false;
        youCard.innerHTML = `
            <div class="you-rank">#${me.rank}</div>

            <div class="you-info">
                <div class="you-name">${esc(me.name)} (You)</div>
                <div class="you-meta">${esc(me.branch || "-")} · ${esc(me.year || "-")}</div>
            </div>

            <div class="you-points">
                <strong>${formatPoints(me.points)}</strong>
                <span>POINTS</span>
            </div>
        `;
    } else {
        youCard.hidden = true;
    }

    // list
    boardCard.innerHTML = list.length
        ? list.map(function (s) { return rowHTML(s, s.rank); }).join("")
        : '<div class="empty-state">No students found.</div>';
}

function load() {
    Api.get("/api/leaderboard?scope=" + scope)
        .then(function (data) {
            board = data;
            render();
        })
        .catch(function (err) {
            boardCard.innerHTML = '<div class="empty-state">' + esc(err.message) + "</div>";
        });
}


/* =====================================================
   EVENTS
===================================================== */

scopeButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        scopeButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });

        this.classList.add("active");

        scope = this.dataset.scope;

        load();
    });
});

document.getElementById("logoutBtn").addEventListener("click", function () {
    Api.logout();
});

document.getElementById("themeBtn").addEventListener("click", function () {
    alert("Light mode will be added in the next version.");
});


/* INITIAL LOAD */
load();
