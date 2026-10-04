/* =====================================================
   INTERNSHIPS / OPPORTUNITIES JAVASCRIPT
===================================================== */

/* =====================================================
   DATA  (apna data yahan edit / add kar sakte ho)
   type     : "internship" ya "job"
   daysLeft : 0 = "Closing today", baaki = "N days left"
===================================================== */

const opportunities = [
    {
        title: "Digital Cadre",
        company: "TCS",
        type: "job",
        location: "Pan India",
        pay: "₹7.5 LPA",
        description: "Fast-track programme for high performers.",
        eligibility: "Final year",
        daysLeft: 0,
        link: "https://www.tcs.com/careers"
    },
    {
        title: "SDE Intern",
        company: "Amazon",
        type: "internship",
        location: "Bengaluru",
        pay: "₹90,000/month",
        description: "Build customer-obsessed products at scale.",
        eligibility: "Final year B.Tech",
        daysLeft: 0,
        link: "https://www.amazon.jobs"
    },
    {
        title: "Software Engineering Intern",
        company: "Google",
        type: "internship",
        location: "Bengaluru",
        pay: "₹1,00,000/month",
        description: "Work with Google engineers on real production systems. Areas: Search, Ads, Cloud.",
        eligibility: "3rd/Final year B.Tech CSE/IT",
        daysLeft: 0,
        link: "https://www.google.com/about/careers/"
    },
    {
        title: "SDE-1 (Full-time)",
        company: "Flipkart",
        type: "job",
        location: "Bengaluru",
        pay: "₹28 LPA",
        description: "Own the largest e-commerce stack in India.",
        eligibility: "Final year B.Tech / M.Tech",
        daysLeft: 0,
        link: "https://www.flipkartcareers.com"
    },
    {
        title: "Explore Program (SDE Intern)",
        company: "Microsoft",
        type: "internship",
        location: "Hyderabad",
        pay: "₹80,000/month",
        description: "12-week rotational program across PM, SDE and Design.",
        eligibility: "2nd year B.Tech",
        daysLeft: 0,
        link: "https://careers.microsoft.com"
    },
    {
        title: "Consulting Analyst",
        company: "Deloitte",
        type: "job",
        location: "Mumbai",
        pay: "₹9 LPA",
        description: "Advise Fortune 500 clients on strategy and operations.",
        eligibility: "Final year",
        daysLeft: 0,
        link: "https://www.deloitte.com/global/en/careers.html"
    },
    {
        title: "Engineering Intern",
        company: "Atlassian",
        type: "internship",
        location: "Remote",
        pay: "$3,500/month",
        description: "Work fully remote with the Jira / Confluence teams.",
        eligibility: "Any year",
        daysLeft: 0,
        link: "https://www.atlassian.com/company/careers"
    },
    {
        title: "Product Intern",
        company: "Adobe",
        type: "internship",
        location: "Noida",
        pay: "₹70,000/month",
        description: "Ship features used by millions of creators worldwide.",
        eligibility: "Pre-final year",
        daysLeft: 4,
        link: "https://www.adobe.com/careers.html"
    }
];


/* =====================================================
   ICONS (inline SVG)
===================================================== */

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
                <div class="company-logo">${item.company.charAt(0)}</div>
                ${deadlineBadge(item.daysLeft)}
            </div>

            <h3 class="opp-title">${item.title}</h3>

            <div class="meta company">${icons.company}<span>${item.company}</span></div>
            <div class="meta">${icons.location}<span>${item.location}</span></div>
            <div class="meta">${icons.pay}<span>${item.pay}</span></div>

            <p class="opp-desc">${item.description}</p>

            <div class="card-bottom">
                <span class="eligibility">${item.eligibility}</span>

                <a class="view-btn" href="${item.link}" target="_blank" rel="noopener noreferrer">
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
    window.location.href = "login.html";
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

render();
