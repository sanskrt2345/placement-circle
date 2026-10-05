/* =====================================================
   ALUMNI JAVASCRIPT
===================================================== */

/* =====================================================
   DATA  (loaded from the backend: GET /api/experiences)
===================================================== */

let experiences = [];   // filled from GET /api/experiences


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
        <article class="story-card" data-id="${item.id}">

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
                <button class="helpful-btn${item.helpful ? " active" : ""}" type="button">${thumbIcon}<span>Helpful${item.helpfulCount ? " · " + item.helpfulCount : ""}</span></button>
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
        const id = helpful.closest(".story-card").dataset.id;
        helpful.disabled = true;
        Api.post("/api/experiences/" + id + "/helpful")
            .then(function (r) {
                helpful.classList.toggle("active", r.helpful);
                helpful.querySelector("span").textContent =
                    "Helpful" + (r.helpfulCount ? " · " + r.helpfulCount : "");
                const item = experiences.find(function (x) { return String(x.id) === String(id); });
                if (item) { item.helpful = r.helpful; item.helpfulCount = r.helpfulCount; }
            })
            .catch(function (err) { alert(err.message); })
            .then(function () { helpful.disabled = false; });
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
        formError.textContent = "Please fill company, role, your name and your tip.";
        formError.classList.add("show");
        return;
    }

    const rounds = fields.rounds.value
        .split(",")
        .map(function (r) { return r.trim(); })
        .filter(Boolean);

    const payload = {
        company: company,
        role: role,
        name: name,
        status: fields.status.value,
        rounds: rounds,
        tip: tip
    };

    if (fields.year.value) {
        payload.year = Number(fields.year.value);
    }

    const submitButton = document.getElementById("submitModal");
    Api.busy(submitButton, true, "Sharing...");

    Api.post("/api/experiences", payload)
        .then(function (data) {
            experiences.unshift(data.experience);
            searchInput.value = "";
            closeModal();
            render();
        })
        .catch(function (err) {
            formError.textContent = err.message;
            formError.classList.add("show");
        })
        .then(function () {
            Api.busy(submitButton, false);
        });
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


/* INITIAL LOAD */
searchInput.value = Api.param("q");

Api.get("/api/experiences")
    .then(function (data) {
        experiences = data.experiences;
        render();
    })
    .catch(function (err) {
        emptyState.textContent = err.message;
        emptyState.classList.add("show");
    });
