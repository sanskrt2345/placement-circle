/* =====================================================
   LEADERBOARD JAVASCRIPT
===================================================== */

/* =====================================================
   DATA  (apna data yahan edit / add kar sakte ho)
   Order koi bhi ho sakta hai, points ke hisaab se
   automatic sort hota hai.
===================================================== */

const currentUser = {
    name: "Aarav Patel",
    branch: "CSE",
    year: "Final Year"
};

const students = [
    { name: "Ishaan Mehta",  initials: "IM", branch: "CSE", year: "Final Year", streak: 42, points: 2180 },
    { name: "Priya Sharma",  initials: "PS", branch: "CSE", year: "3rd Year",   streak: 28, points: 1890 },
    { name: "Rohan Iyer",    initials: "RI", branch: "IT",  year: "Final Year", streak: 21, points: 1610 },
    { name: "Ananya Kapoor", initials: "AK", branch: "CSE", year: "Final Year", streak: 18, points: 1450 },
    { name: "Aarav Patel",   initials: "AP", branch: "CSE", year: "Final Year", streak: 12, points: 1240, isYou: true },
    { name: "Karthik Reddy", initials: "KR", branch: "ECE", year: "3rd Year",   streak: 14, points: 1180 },
    { name: "Meera Nair",    initials: "MN", branch: "CSE", year: "2nd Year",   streak: 9,  points: 1050 },
    { name: "Devansh Rao",   initials: "DR", branch: "IT",  year: "Final Year", streak: 7,  points: 920 },
    { name: "Sara Ali",      initials: "SA", branch: "CSE", year: "3rd Year",   streak: 11, points: 880 },
    { name: "Fresh Student", initials: "FS", branch: "CSE", year: "Final Year", streak: 0,  points: 0 }
];


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

function rowHTML(student, rank) {

    const label = student.isYou ? student.name + " (You)" : student.name;

    return `
        <div class="board-row${student.isYou ? " me" : ""}">

            ${rankCell(rank)}

            <div class="lb-avatar">${student.initials}</div>

            <div class="lb-info">
                <div class="lb-name">${label}</div>
                <div class="lb-meta">${student.branch} · ${student.year}</div>
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

    // 1. scope ke hisaab se filter
    let list = students.filter(function (s) {

        if (scope === "branch") return s.branch === currentUser.branch;
        if (scope === "year") return s.year === currentUser.year;

        return true;
    });

    // 2. points ke hisaab se sort (zyada points = upar)
    list = list.slice().sort(function (a, b) {
        return b.points - a.points;
    });

    // 3. "You" card
    const myIndex = list.findIndex(function (s) { return s.isYou; });
    const me = list[myIndex];

    youCard.innerHTML = `
        <div class="you-rank">#${myIndex + 1}</div>

        <div class="you-info">
            <div class="you-name">${currentUser.name} (You)</div>
            <div class="you-meta">${currentUser.branch} · ${currentUser.year}</div>
        </div>

        <div class="you-points">
            <strong>${formatPoints(me.points)}</strong>
            <span>POINTS</span>
        </div>
    `;

    // 4. list
    boardCard.innerHTML = list.length
        ? list.map(function (s, i) { return rowHTML(s, i + 1); }).join("")
        : '<div class="empty-state">No students found.</div>';
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

        render();
    });
});

document.getElementById("logoutBtn").addEventListener("click", function () {
    window.location.href = "login.html";
});

document.getElementById("themeBtn").addEventListener("click", function () {
    alert("Light mode will be added in the next version.");
});


/* INITIAL LOAD */

render();
