/* =====================================================
   INTERNSHIPS / OPPORTUNITIES JAVASCRIPT
===================================================== */

/* =====================================================
   DATA  (loaded from the backend: GET /api/opportunities)
   type     : "internship" ya "job"
   daysLeft : 0 = "Closing today", baaki = "N days left"
===================================================== */

let opportunities = [];   // filled from GET /api/opportunities


/* =====================================================
   ICONS (inline SVG)
===================================================== */

const esc = Api.esc;

const icons = {
    company:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></svg>',
    location:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    pay:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',
    external:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>'
};


/* =====================================================
   VARIABLES
===================================================== */

let selectedType = "all";

const cardsGrid = document.getElementById("cardsGrid");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const typeButtons = document.querySelectorAll("#typeFilters .type-btn");


/* =====================================================
   HELPERS
===================================================== */

function deadlineBadge(daysLeft) {

    if (daysLeft <= 0) {
        return '<span class="deadline urgent">Closing today</span>';
    }

    const label = daysLeft === 1 ? "1 day left" : daysLeft + " days left";

    return '<span class="deadline soon">' + label + "</span>";
}

function cardHTML(item) {

    return `
        <article class="opp-card">

            <div class="card-top">
                <div class="company-logo">${esc(item.company.charAt(0))}</div>
                ${deadlineBadge(item.daysLeft)}
            </div>

            <h3 class="opp-title">${esc(item.title)}</h3>

            <div class="meta company">${icons.company}<span>${esc(item.company)}</span></div>
            <div class="meta">${icons.location}<span>${esc(item.location)}</span></div>
            <div class="meta">${icons.pay}<span>${esc(item.pay)}</span></div>

            <p class="opp-desc">${esc(item.description)}</p>

            <div class="card-bottom">
                <span class="eligibility">${esc(item.eligibility)}</span>

                <a class="view-btn" href="${esc(Api.safeUrl(item.link))}" target="_blank" rel="noopener noreferrer">
                    View ${icons.external}
                </a>
            </div>

        </article>
    `;
}


/* =====================================================
   RENDER + FILTER
===================================================== */

function render() {

    const searchText = searchInput.value.toLowerCase().trim();

    const results = opportunities.filter(function (item) {

        const typeMatch =
            selectedType === "all" || item.type === selectedType;

        const searchMatch =
            searchText === "" ||
            item.title.toLowerCase().includes(searchText) ||
            item.company.toLowerCase().includes(searchText) ||
            item.location.toLowerCase().includes(searchText);

        return typeMatch && searchMatch;
    });

    cardsGrid.innerHTML = results.map(cardHTML).join("");

    emptyState.classList.toggle("show", results.length === 0);
}


/* =====================================================
   EVENTS
===================================================== */

typeButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        typeButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });

        this.classList.add("active");

        selectedType = this.dataset.type;

        render();
    });
});

searchInput.addEventListener("input", render);


/* LOGOUT */

document.getElementById("logoutBtn").addEventListener("click", function () {
    Api.logout();
});


/* LIGHT MODE BUTTON */

document.getElementById("themeBtn").addEventListener("click", function () {
    alert("Light mode will be added in the next version.");
});


/* SCROLL TO TOP */

const scrollTopBtn = document.getElementById("scrollTop");

window.addEventListener("scroll", function () {
    scrollTopBtn.classList.toggle("show", window.scrollY > 350);
});

scrollTopBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
});


/* INITIAL LOAD */
searchInput.value = Api.param("q");

Api.get("/api/opportunities")
    .then(function (data) {
        opportunities = data.opportunities;
        render();
    })
    .catch(function (err) {
        emptyState.textContent = err.message;
        emptyState.classList.add("show");
    });
