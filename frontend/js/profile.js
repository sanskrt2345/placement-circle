/* =====================================================
   PROFILE JAVASCRIPT
===================================================== */

/* =====================================================
   DATA  (loaded from the backend: GET /api/profile)
===================================================== */

let profile = null;   // filled from GET /api/profile


/* =====================================================
   ICONS
===================================================== */

const icons = {
    streak:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    points:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    solved:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'
};


const esc = Api.esc;

/* =====================================================
   1. HERO: NAME, COLLEGE, TARGET COMPANIES + STAT TILES
===================================================== */

function renderHero(data) {

    document.getElementById("bigAvatar").textContent = data.user.initials;
    document.getElementById("profileName").textContent = data.user.fullName;
    document.getElementById("profileCollege").textContent =
        [data.user.college, data.user.branch, data.user.year].filter(Boolean).join(" · ") || "Add your college details";

    document.getElementById("targetTags").innerHTML =
        data.targetCompanies.length
            ? data.targetCompanies.map(function (c) {
                return "<span>" + esc(c) + "</span>";
            }).join("")
            : "<span>No target companies yet</span>";

    document.getElementById("heroStats").innerHTML = [
        [icons.streak, data.stats.streak, "STREAK"],
        [icons.points, data.stats.points, "POINTS"],
        [icons.solved, data.stats.solved, "SOLVED"]
    ].map(function (t) {
        return '<div class="stat-tile">' + t[0] + "<strong>" + t[1] + "</strong><span>" + t[2] + "</span></div>";
    }).join("");
}


/* =====================================================
   2. CONTRIBUTION HEATMAP  (real activity from the last 24 weeks)
   level 0 = no activity, 1-4 = more activity
===================================================== */

function renderHeatmap(heatmap) {

    document.getElementById("heatmap").innerHTML = heatmap.cells.map(function (cell) {
        const label = cell.future
            ? ""
            : cell.date + ": " + cell.count + (cell.count === 1 ? " attempt" : " attempts");
        return '<div class="heat-cell l' + cell.level + '" title="' + esc(label) + '"></div>';
    }).join("");
}


/* =====================================================
   3. ACHIEVEMENTS
===================================================== */

function renderAchievements(list) {

    document.getElementById("badgeGrid").innerHTML = list.map(function (a) {
        return `
            <div class="badge-card${a.unlocked ? "" : " locked"}" title="${esc(a.description)}">
                <strong>${esc(a.title)}</strong>
                <span>${a.unlocked ? "Unlocked" : "Locked"}</span>
            </div>`;
    }).join("");
}


/* =====================================================
   4. PREFERENCES
===================================================== */

function renderPrefs(prefs) {

    const lines = [
        ["Goal", prefs.goal || "Not set"],
        ["Level", prefs.level || "Not set"],
        ["Focus", prefs.focus.length ? prefs.focus.join(", ") : "Not set"]
    ];

    document.getElementById("prefs").innerHTML = lines.map(function (p) {
        return '<div class="pref-line"><b>' + p[0] + ":</b> " + esc(p[1]) + "</div>";
    }).join("");
}


Api.get("/api/profile")
    .then(function (data) {
        profile = data;
        renderHero(data);
        renderHeatmap(data.heatmap);
        renderAchievements(data.achievements);
        renderPrefs(data.preferences);
    })
    .catch(function (err) {
        document.getElementById("profileName").textContent = err.message;
    });


/* =====================================================
   LOGOUT + LIGHT MODE
===================================================== */

document.getElementById("logoutBtn").addEventListener("click", function () {
    Api.logout();
});

document.getElementById("themeBtn").addEventListener("click", function () {
    alert("Light mode will be added in the next version.");
});
