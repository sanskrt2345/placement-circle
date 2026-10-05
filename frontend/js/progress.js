/* =====================================================
   PROGRESS JAVASCRIPT
   All numbers come from GET /api/progress.
   (charts are drawn with SVG / CSS, no library needed)
===================================================== */

const esc = Api.esc;

function setHTML(id, html) {
    document.getElementById(id).innerHTML = html;
}


/* =====================================================
   1. PREP SCORE RING + MINI STATS
===================================================== */

function renderRing(stats) {

    const r = 40;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - stats.prepScore / 100);

    setHTML("ring", `
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
    `);

    const items = [
        [stats.solved, "SOLVED"],
        [stats.accuracy + "%", "ACCURACY"],
        [stats.streak, "STREAK"],
        [stats.points, "POINTS"]
    ];

    setHTML("miniStats", items.map(function (it) {
        return "<div><strong>" + it[0] + "</strong><span>" + it[1] + "</span></div>";
    }).join(""));
}


/* =====================================================
   2. WEEKLY ACTIVITY (vertical bars)
===================================================== */

function renderWeekly(weekly) {

    const max = Math.max(4, ...weekly.map(function (w) { return w.value; }));

    const ticks = [];
    for (let i = 0; i <= max; i++) ticks.push(i);

    const lines = ticks.slice(1).map(function (t) {
        return '<div class="gridline" style="bottom:' + (t / max * 100) + '%"></div>';
    }).join("");

    const bars = weekly.map(function (w) {
        return '<div class="v-bar" title="' + esc(w.day) + ": " + w.value +
               ' solved" style="height:' + (w.value / max * 100) + '%"></div>';
    }).join("");

    setHTML("weeklyChart", `
        <div class="chart-wrap">
            <div class="y-axis">${ticks.map(function (t) { return "<span>" + t + "</span>"; }).join("")}</div>
            <div class="plot-col">
                <div class="plot">${lines}${bars}</div>
                <div class="x-axis">${weekly.map(function (w) { return "<span>" + esc(w.day) + "</span>"; }).join("")}</div>
            </div>
        </div>
    `);
}


/* =====================================================
   3. ACCURACY BY CATEGORY (horizontal bars)
===================================================== */

function renderAccuracy(categoryAccuracy) {

    const rows = categoryAccuracy.map(function (c) {
        return `
            <div class="h-row">
                <div class="h-label">${esc(c.name)}</div>
                <div class="h-track">
                    <div class="h-bar" title="${esc(c.name)}: ${c.value}%" style="width:${c.value}%"></div>
                </div>
            </div>`;
    }).join("");

    const axis = [0, 25, 50, 75, 100].map(function (n) {
        return '<span style="left:' + n + '%">' + n + "</span>";
    }).join("");

    setHTML("accuracyChart", rows + '<div class="h-axis">' + axis + "</div>");
}


/* =====================================================
   4. DIFFICULTY MIX (donut)
===================================================== */

function renderDonut(difficulty) {

    const r = 36;
    const circumference = 2 * Math.PI * r;
    const total = difficulty.reduce(function (sum, d) { return sum + d.value; }, 0);
    const gap = 2;
    let used = 0;

    // nothing solved yet -> show an empty grey ring instead of dividing by zero
    const segments = total === 0
        ? `<circle cx="50" cy="50" r="${r}" fill="none" stroke="#2b3042" stroke-width="14"/>`
        : difficulty.map(function (d) {
            const length = (d.value / total) * circumference;
            const seg = `<circle cx="50" cy="50" r="${r}" fill="none"
                stroke="${esc(d.color)}" stroke-width="14"
                stroke-dasharray="${Math.max(length - gap, 0)} ${circumference}"
                stroke-dashoffset="${-used}"><title>${esc(d.name)}: ${d.value}</title></circle>`;
            used += length;
            return seg;
        }).join("");

    const legend = difficulty.map(function (d) {
        return '<span><i style="background:' + esc(d.color) + '"></i>' + esc(d.name) + ": " + d.value + "</span>";
    }).join("");

    setHTML("difficultyChart", `
        <div class="donut"><svg viewBox="0 0 100 100">${segments}</svg></div>
        <div class="legend">${legend}</div>
    `);
}


/* =====================================================
   5. WEAK / STRONG LISTS
===================================================== */

function renderList(id, items, cls) {

    setHTML(id, items.length
        ? items.map(function (it) {
            return "<li><span>" + esc(it.name) + '</span><span class="' + cls + '">' + it.value + "%</span></li>";
        }).join("")
        : '<li><span style="opacity:.65">Solve a few more questions to see this.</span></li>');
}


/* =====================================================
   LOAD
===================================================== */

Api.get("/api/progress")
    .then(function (d) {
        renderRing(d.stats);
        renderWeekly(d.weekly);
        renderAccuracy(d.categoryAccuracy);
        renderDonut(d.difficulty);
        renderList("weakList", d.weakAreas, "weak");
        renderList("strongList", d.strongAreas, "strong");
    })
    .catch(function (err) {
        setHTML("miniStats", "<div><span>" + esc(err.message) + "</span></div>");
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
