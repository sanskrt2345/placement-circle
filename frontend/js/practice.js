/* =====================================================
   PRACTICE LIBRARY JAVASCRIPT
===================================================== */


/* =====================================================
   VARIABLES
===================================================== */

let selectedCategory = "all";
let selectedDifficulty = "all";


const searchInput =
    document.getElementById("searchInput");

const questionRows =
    document.querySelectorAll(".question-row");

const emptyState =
    document.getElementById("emptyState");


/* =====================================================
   FILTER QUESTIONS
===================================================== */

function filterQuestions() {

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();

    let visibleCount = 0;


    questionRows.forEach(function(row) {

        const category =
            row.dataset.category;

        const difficulty =
            row.dataset.difficulty;

        const searchData =
            row.dataset.search.toLowerCase();


        const categoryMatch =
            selectedCategory === "all" ||
            category === selectedCategory;


        const difficultyMatch =
            selectedDifficulty === "all" ||
            difficulty === selectedDifficulty;


        const searchMatch =
            searchText === "" ||
            searchData.includes(searchText);


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


/* =====================================================
   LOGOUT
===================================================== */

const logoutBtn =
    document.getElementById("logoutBtn");


logoutBtn.addEventListener(
    "click",
    function() {

        window.location.href = "login.html";

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


/* =====================================================
   INITIAL LOAD
===================================================== */

filterQuestions();