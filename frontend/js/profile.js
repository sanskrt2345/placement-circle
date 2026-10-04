/* =====================================================
   PROFILE JAVASCRIPT
===================================================== */

/* =====================================================
   DATA  (apna data yahan edit kar sakte ho)
===================================================== */

const profile = {
    targetCompanies: ["Google", "Microsoft", "Adobe"],
    streak: 12,
    points: 1240,
    solved: 0,
    preferences: [
        ["Goal", "Software Engineering"],
        ["Level", "Intermediate"],
        ["Focus", "DSA, Aptitude, HR Interviews"]
    ]
};

const achievements = [
    { title: "7 Day Streak", unlocked: true },
    { title: "50 Questions", unlocked: false },
    { title: "DSA Warrior", unlocked: true },
    { title: "Aptitude Ace", unlocked: true },
    { title: "Interview Ready", unlocked: true },
    { title: "Consistency King", unlocked: true }
];


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


/* =====================================================
   1. TARGET COMPANIES + STAT TILES
===================================================== */

document.getElementById("targetTags").innerHTML =
    profile.targetCompanies.map(function (c) {
        return "<span>" + c + "</span>";
    }).join("");

document.getElementById("heroStats").innerHTML = [
    [icons.streak, profile.streak, "STREAK"],
    [icons.points, profile.points, "POINTS"],
    [icons.solved, profile.solved, "SOLVED"]
].map(function (t) {
    return '<div class="stat-tile">' + t[0] + "<strong>" + t[1] + "</strong><span>" + t[2] + "</span></div>";
}).join("");


/* =====================================================
   2. CONTRIBUTION HEATMAP
   (demo data: har baar same dikhta hai. Real data aane par
   levels array backend se bhar dena: 0 = koi activity nahi,
   1-4 = zyada activity)
===================================================== */

(function renderHeatmap() {

    const weeks = 24;
    const days = 7;

    // chhota seeded random, taki page refresh pe pattern na badle
    let seed = 7;
    function rand() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }

    let html = "";

    for (let i = 0; i < weeks * days; i++) {

        const r = rand();
        let level = 0;

        if (r > 0.45) level = 1;
        if (r > 0.65) level = 2;
        if (r > 0.82) level = 3;
        if (r > 0.93) level = 4;

        html += '<div class="heat-cell l' + level + '"></div>';
    }

    document.getElementById("heatmap").innerHTML = html;
})();


/* =====================================================
   3. ACHIEVEMENTS
===================================================== */

document.getElementById("badgeGrid").innerHTML =
    achievements.map(function (a) {
        return `
            <div class="badge-card${a.unlocked ? "" : " locked"}">
                <strong>${a.title}</strong>
                <span>${a.unlocked ? "Unlocked" : "Locked"}</span>
            </div>`;
    }).join("");


/* =====================================================
   4. PREFERENCES
===================================================== */

document.getElementById("prefs").innerHTML =
    profile.preferences.map(function (p) {
        return '<div class="pref-line"><b>' + p[0] + ":</b> " + p[1] + "</div>";
    }).join("");


/* =====================================================
   LOGOUT + LIGHT MODE
===================================================== */

document.getElementById("logoutBtn").addEventListener("click", function () {
    window.location.href = "login.html";
});

document.getElementById("themeBtn").addEventListener("click", function () {
    alert("Light mode will be added in the next version.");
});
