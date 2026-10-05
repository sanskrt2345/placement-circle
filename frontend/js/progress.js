/* =====================================================
   PROGRESS JAVASCRIPT
   (charts SVG / CSS se bane hain, koi library nahi chahiye)
===================================================== */

/* =====================================================
   DATA  (apna data yahan edit kar sakte ho)
===================================================== */

const stats = {
    prepScore: 54,
    solved: 0,
    accuracy: 72,
    streak: 12,
    points: 1240
};

// Mon se Sun tak: din mein kitne questions solve kiye
const weekly = [
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
    { day: "Sat", value: 0 },
    { day: "Sun", value: 0 }
];

const categoryAccuracy = [
    { name: "Aptitude", value: 63 },
    { name: "DSA", value: 63 },
    { name: "HR", value: 100 }
];

const difficulty = [
    { name: "Easy", value: 19, color: "#6366f1" },
    { name: "Hard", value: 7, color: "#10b981" },
    { name: "Medium", value: 34, color: "#22d3ee" }
];

const weakAreas = [
    { name: "Dynamic Programming", value: 33 },
    { name: "Graphs", value: 33 },
    { name: "Probability", value: 33 }
];

const strongAreas = [
    { name: "Behavioral", value: 100 },
    { name: "Interview Questions", value: 100 },
    { name: "Strings", value: 100 }
];


/* =====================================================
   1. PREP SCORE RING + MINI STATS
===================================================== */

(function renderRing() {

    const r = 40;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - stats.prepScore / 100);

    document.getElementById("ring").innerHTML = `
        <svg viewBox="0 0 100 100">
            <defs>
                <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#8b5cf6"/>
                    <stop offset="100%" stop-color="#d8a7ff"/>
                </linearGradient>
            </defs>
            <circle class="ring-track" cx="50" cy="50" r="${r}"/>
            <circle class="ring-fill" cx="50" cy="50" r="${r}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"/>
        </svg>
        <div class="ring-text">
            <strong>${stats.prepScore}%</strong>
            <span>PREP SCORE</span>
        </div>
    `;

    const items = [
        [stats.solved, "SOLVED"],
        [stats.accuracy + "%", "ACCURACY"],
        [stats.streak, "STREAK"],
        [stats.points, "POINTS"]
    ];

    document.getElementById("miniStats").innerHTML = items.map(function (it) {
        return "<div><strong>" + it[0] + "</strong><span>" + it[1] + "</span></div>";
    }).join("");
})();


/* =====================================================
   2. WEEKLY ACTIVITY (vertical bars)
===================================================== */

(function renderWeekly() {

    const max = Math.max(4, ...weekly.map(function (w) { return w.value; }));

    const ticks = [];
    for (let i = 0; i <= max; i++) ticks.push(i);

    const lines = ticks.slice(1).map(function (t) {
        return '<div class="gridline" style="bottom:' + (t / max * 100) + '%"></div>';
    }).join("");

    const bars = weekly.map(function (w) {
        return '<div class="v-bar" title="' + w.day + ": " + w.value +
               ' solved" style="height:' + (w.value / max * 100) + '%"></div>';
    }).join("");

    document.getElementById("weeklyChart").innerHTML = `
        <div class="chart-wrap">
            <div class="y-axis">${ticks.map(function (t) { return "<span>" + t + "</span>"; }).join("")}</div>
            <div class="plot-col">
                <div class="plot">${lines}${bars}</div>
                <div class="x-axis">${weekly.map(function (w) { return "<span>" + w.day + "</span>"; }).join("")}</div>
            </div>
        </div>
    `;
})();


/* =====================================================
   3. ACCURACY BY CATEGORY (horizontal bars)
===================================================== */

(function renderAccuracy() {

    const rows = categoryAccuracy.map(function (c) {
        return `
            <div class="h-row">
                <div class="h-label">${c.name}</div>
                <div class="h-track">
                    <div class="h-bar" title="${c.name}: ${c.value}%" style="width:${c.value}%"></div>
                </div>
            </div>`;
    }).join("");

    const axis = [0, 25, 50, 75, 100].map(function (n) {
        return '<span style="left:' + n + '%">' + n + "</span>";
    }).join("");

    document.getElementById("accuracyChart").innerHTML =
        rows + '<div class="h-axis">' + axis + "</div>";
})();


/* =====================================================
   4. DIFFICULTY MIX (donut)
===================================================== */

(function renderDonut() {

    const r = 36;
    const circumference = 2 * Math.PI * r;
    const total = difficulty.reduce(function (sum, d) { return sum + d.value; }, 0);
    const gap = 2;

    let used = 0;

    const segments = difficulty.map(function (d) {

        const length = (d.value / total) * circumference;
        const seg = `<circle cx="50" cy="50" r="${r}" fill="none"
            stroke="${d.color}" stroke-width="14"
            stroke-dasharray="${Math.max(length - gap, 0)} ${circumference}"
            stroke-dashoffset="${-used}"><title>${d.name}: ${d.value}</title></circle>`;

        used += length;
        return seg;
    }).join("");

    const order = ["Easy", "Medium", "Hard"];

    const legend = order.map(function (name) {
        const d = difficulty.find(function (x) { return x.name === name; });
        return '<span><i style="background:' + d.color + '"></i>' + d.name + ": " + d.value + "</span>";
    }).join("");

    document.getElementById("difficultyChart").innerHTML = `
        <div class="donut"><svg viewBox="0 0 100 100">${segments}</svg></div>
        <div class="legend">${legend}</div>
    `;
})();


/* =====================================================
   5. WEAK / STRONG LISTS
===================================================== */

function renderList(id, items, cls) {

    document.getElementById(id).innerHTML = items.map(function (it) {
        return "<li><span>" + it.name + '</span><span class="' + cls + '">' + it.value + "%</span></li>";
    }).join("");
}

renderList("weakList", weakAreas, "weak");
renderList("strongList", strongAreas, "strong");


/* =====================================================
   LOGOUT + LIGHT MODE
===================================================== */

document.getElementById("logoutBtn").addEventListener("click", function () {
    window.location.href = "login.html";
});

document.getElementById("themeBtn").addEventListener("click", function () {
    alert("Light mode will be added in the next version.");
});
