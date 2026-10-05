/* =====================================================
   ALUMNI JAVASCRIPT
===================================================== */

/* =====================================================
   DATA  (apna data yahan edit / add kar sakte ho)
===================================================== */

const experiences = [
    {
        company: "Google",
        role: "SDE-1",
        status: "Offer",
        name: "Ananya Kapoor",
        year: 2025,
        rounds: ["Online Assessment", "Technical Round 1", "Technical Round 2", "Googleyness & HR"],
        tip: "Consistency > intensity. Solve one meaningful problem a day for 6 months and you'll be ready.",
        full: "I started preparing in my third year and kept a simple rule: one problem a day, then write down the pattern I learned. In interviews, I talked through brute force first, then improved it step by step. The Googleyness round was a normal conversation about teamwork and how I handle ambiguity."
    },
    {
        company: "Microsoft",
        role: "SDE Intern",
        status: "Offer",
        name: "Rahul Verma",
        year: 2026,
        rounds: ["OA", "Group Discussion", "Technical + HR"],
        tip: "Speak your thought process out loud. Interviewers care more about approach than the final code.",
        full: "The OA had two coding questions and a few MCQs. The group discussion was on a current tech topic and was more about how you listen than how loud you are. In the technical round, I explained my approach before typing anything, and the interviewer helped when I got stuck."
    },
    {
        company: "Amazon",
        role: "SDE-1",
        status: "Offer",
        name: "Priya Sharma",
        year: 2025,
        rounds: ["Online Assessment", "Technical Round", "Bar Raiser"],
        tip: "Bar Raiser is the hardest round — practice behavioral with a friend at least 5 times.",
        full: "Prepare 6 to 8 stories from your projects and college life, and map each one to the Amazon leadership principles. Use the STAR format and always say what YOU did, not what the team did. The Bar Raiser asked follow-ups on every story, so know the details."
    },
    {
        company: "Adobe",
        role: "MTS-1",
        status: "Offer",
        name: "Karthik Reddy",
        year: 2024,
        rounds: ["Online Test", "Technical Round", "Managerial + HR"],
        tip: "Have one project you can explain end-to-end for 20 minutes without hesitation.",
        full: "They went deep on my main project: why I chose the tech stack, what broke, and how I fixed it. Revise your core subjects too (OS, DBMS, OOP). The managerial round was relaxed and focused on learning ability and career goals."
    }
];


/* =====================================================
   ICONS
===================================================== */

const thumbIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';

const arrowIcon = "→";


/* =====================================================
   HELPERS
===================================================== */

function escapeHTML(text) {

    const div = document.createElement("div");
    div.textContent = text;

    return div.innerHTML;
}

function cardHTML(item, index) {

    const tags = item.rounds.map(function (round) {
        return '<span class="round-tag">' + escapeHTML(round) + "</span>";
    }).join("");

    return `
        <article class="story-card" data-index="${index}">

            <div class="story-top">

                <div class="story-company">
                    <div class="company-logo">${escapeHTML(item.company.charAt(0).toUpperCase())}</div>

                    <div>
                        <div class="company-name">${escapeHTML(item.company)}</div>
                        <div class="company-role">${escapeHTML(item.role)}</div>
                    </div>
                </div>

                <span class="status-badge">${escapeHTML(item.status)}</span>

            </div>

            <div class="person">${escapeHTML(item.name)} · Class of ${escapeHTML(String(item.year))}</div>

            <div class="round-tags">${tags}</div>

            <p class="story-tip">${escapeHTML(item.tip)}</p>

            <p class="story-full">${escapeHTML(item.full || item.tip)}</p>

            <div class="story-bottom">
                <button class="helpful-btn" type="button">${thumbIcon}<span>Helpful</span></button>
                <button class="read-btn" type="button"><span class="read-label">Read full</span> ${arrowIcon}</button>
            </div>

        </article>
    `;
}


/* =====================================================
   RENDER + SEARCH
===================================================== */

const cardsGrid = document.getElementById("cardsGrid");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");

function render() {

    const searchText = searchInput.value.toLowerCase().trim();

    const results = experiences.filter(function (item) {

        return (
            searchText === "" ||
            item.company.toLowerCase().includes(searchText) ||
            item.role.toLowerCase().includes(searchText) ||
            item.name.toLowerCase().includes(searchText)
        );
    });

    cardsGrid.innerHTML = results.map(function (item) {
        return cardHTML(item, experiences.indexOf(item));
    }).join("");

    emptyState.classList.toggle("show", results.length === 0);
}

searchInput.addEventListener("input", render);


/* =====================================================
   CARD BUTTONS (Helpful + Read full)
===================================================== */

cardsGrid.addEventListener("click", function (e) {

    const helpful = e.target.closest(".helpful-btn");
    const read = e.target.closest(".read-btn");

    if (helpful) {
        helpful.classList.toggle("active");
    }

    if (read) {

        const card = read.closest(".story-card");
        const isOpen = card.classList.toggle("open");

        read.querySelector(".read-label").textContent =
            isOpen ? "Show less" : "Read full";
    }
});


/* =====================================================
   ADD EXPERIENCE MODAL
===================================================== */

const overlay = document.getElementById("modalOverlay");
const formError = document.getElementById("formError");

const fields = {
    company: document.getElementById("fCompany"),
    role: document.getElementById("fRole"),
    name: document.getElementById("fName"),
    year: document.getElementById("fYear"),
    status: document.getElementById("fStatus"),
    rounds: document.getElementById("fRounds"),
    tip: document.getElementById("fTip")
};

function openModal() {
    overlay.classList.add("show");
    fields.company.focus();
}

function closeModal() {

    overlay.classList.remove("show");
    formError.classList.remove("show");

    Object.values(fields).forEach(function (field) {
        if (field.tagName !== "SELECT") {
            field.value = "";
        }
    });
}

document.getElementById("openModal").addEventListener("click", openModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);

overlay.addEventListener("click", function (e) {
    if (e.target === overlay) {
        closeModal();
    }
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeModal();
    }
});

document.getElementById("submitModal").addEventListener("click", function () {

    const company = fields.company.value.trim();
    const role = fields.role.value.trim();
    const name = fields.name.value.trim();
    const tip = fields.tip.value.trim();

    if (!company || !role || !name || !tip) {
        formError.classList.add("show");
        return;
    }

    const rounds = fields.rounds.value
        .split(",")
        .map(function (r) { return r.trim(); })
        .filter(Boolean);

    // TODO: backend aane par yahan API call (POST) karna hai.
    experiences.unshift({
        company: company,
        role: role,
        status: fields.status.value,
        name: name,
        year: fields.year.value || new Date().getFullYear(),
        rounds: rounds,
        tip: tip,
        full: tip
    });

    searchInput.value = "";
    closeModal();
    render();
});


/* =====================================================
   LOGOUT + LIGHT MODE
===================================================== */

document.getElementById("logoutBtn").addEventListener("click", function () {
    window.location.href = "login.html";
});

document.getElementById("themeBtn").addEventListener("click", function () {
    alert("Light mode will be added in the next version.");
});


/* INITIAL LOAD */

render();
