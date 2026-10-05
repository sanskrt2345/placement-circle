/* =====================================================
   PRACTICE LIBRARY JAVASCRIPT
   The question list comes from GET /api/questions.
   Filtering + search happen in the browser (instant).
   Opening  practice.html?q=Graphs  pre-fills the search box.
===================================================== */


/* =====================================================
   VARIABLES
===================================================== */

let selectedCategory = "all";
let selectedDifficulty = "all";
let questions = [];


const searchInput =
    document.getElementById("searchInput");

const questionList =
    document.getElementById("questionList");

const emptyState =
    document.getElementById("emptyState");

const esc = Api.esc;


/* =====================================================
   RENDER
===================================================== */

function rowHTML(q) {

    const searchData = [q.title, q.topic, q.category]
        .concat(q.companies)
        .join(" ");

    return `
        <div
            class="question-row"
            data-id="${q.id}"
            data-category="${esc(q.category)}"
            data-difficulty="${esc(q.difficulty)}"
            data-search="${esc(searchData)}"
            style="cursor:pointer">
            <div class="question-title">
                <h3>${q.solved ? "✓ " : ""}${esc(q.title)}</h3>
                <p>${esc([q.topic].concat(q.companies.length ? [q.companies.join(", ")] : []).join(" · "))}</p>
            </div>
            <div>
                <span class="category-badge">${esc(q.category)}</span>
            </div>
            <div class="difficulty ${esc(q.difficulty.toLowerCase())}">
                ${esc(q.difficulty)}
            </div>
            <div class="time">
                ${q.timeMinutes} min
            </div>
        </div>`;
}


/* =====================================================
   FILTER QUESTIONS
===================================================== */

function filterQuestions() {

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();

    let visibleCount = 0;


    questionList.querySelectorAll(".question-row").forEach(function(row) {

        const categoryMatch =
            selectedCategory === "all" ||
            row.dataset.category === selectedCategory;


        const difficultyMatch =
            selectedDifficulty === "all" ||
            row.dataset.difficulty === selectedDifficulty;


        const searchMatch =
            searchText === "" ||
            row.dataset.search.toLowerCase().includes(searchText);


        if (
            categoryMatch &&
            difficultyMatch &&
            searchMatch
        ) {

            row.style.display = "grid";

            visibleCount++;

        } else {

            row.style.display = "none";

        }

    });


    /* EMPTY STATE */

    if (visibleCount === 0) {

        emptyState.classList.add("show");

    } else {

        emptyState.classList.remove("show");

    }

}


/* =====================================================
   LOAD FROM THE BACKEND
===================================================== */

Api.get("/api/questions")
    .then(function(data) {

        questions = data.questions;

        questionList.innerHTML = questions.map(rowHTML).join("");

        filterQuestions();

    })
    .catch(function(err) {

        emptyState.textContent = err.message;

        emptyState.classList.add("show");

    });


/* Click a row -> open the question */

questionList.addEventListener("click", function(event) {

    const row = event.target.closest(".question-row");

    if (row) {

        window.location.href = "question.html?id=" + row.dataset.id;

    }

});


/* =====================================================
   CATEGORY FILTER
===================================================== */

const categoryButtons =
    document.querySelectorAll(
        "#categoryFilters .filter-btn"
    );


categoryButtons.forEach(function(button) {

    button.addEventListener(
        "click",
        function() {

            categoryButtons.forEach(
                function(btn) {

                    btn.classList.remove("active");

                }
            );


            this.classList.add("active");


            selectedCategory =
                this.dataset.category;


            filterQuestions();

        }
    );

});


/* =====================================================
   DIFFICULTY FILTER
===================================================== */

const difficultyButtons =
    document.querySelectorAll(
        "#difficultyFilters .filter-btn"
    );


difficultyButtons.forEach(function(button) {

    button.addEventListener(
        "click",
        function() {

            difficultyButtons.forEach(
                function(btn) {

                    btn.classList.remove("active");

                }
            );


            this.classList.add("active");


            selectedDifficulty =
                this.dataset.difficulty;


            filterQuestions();

        }
    );

});


/* =====================================================
   SEARCH
===================================================== */

searchInput.addEventListener(
    "input",
    function() {

        filterQuestions();

    }
);

/* ?q=Graphs from a dashboard recommendation */
searchInput.value = Api.param("q");


/* =====================================================
   LOGOUT
===================================================== */

const logoutBtn =
    document.getElementById("logoutBtn");


logoutBtn.addEventListener(
    "click",
    function() {

        Api.logout();

    }
);


/* =====================================================
   SCROLL TO TOP
===================================================== */

const scrollTop =
    document.getElementById("scrollTop");


window.addEventListener(
    "scroll",
    function() {

        if (window.scrollY > 350) {

            scrollTop.classList.add("show");

        } else {

            scrollTop.classList.remove("show");

        }

    }
);


scrollTop.addEventListener(
    "click",
    function() {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }
);


/* =====================================================
   LIGHT MODE BUTTON
===================================================== */

const themeBtn =
    document.getElementById("themeBtn");


themeBtn.addEventListener(
    "click",
    function() {

        alert(
            "Light mode will be added in the next version."
        );

    }
);
