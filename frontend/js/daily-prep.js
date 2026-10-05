/* =========================================================
   DAILY PREP JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const startButtons = document.querySelectorAll(".start-btn");

    const completedCount =
        document.getElementById("completedCount");

    const missionStatus =
        document.getElementById("missionStatus");

    const themeBtn =
        document.getElementById("themeBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");


    /* =====================================================
       START QUESTION
       ===================================================== */

    startButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const question =
                button.dataset.question;

            const type =
                button.dataset.type;

            /*
             * For now we store the selected question.
             * Later this can be connected to the backend.
             */

            localStorage.setItem(
                "selectedQuestion",
                question
            );

            localStorage.setItem(
                "selectedQuestionType",
                type
            );


            /*
             * Temporary navigation.
             *
             * Later:
             * daily-question.html
             */

            window.location.href =
                "daily-question.html";

        });

    });


    /* =====================================================
       THEME
       ===================================================== */

    if (localStorage.getItem("placementTheme") === "light") {

        document.body.classList.add("light-mode");

        if (themeBtn) {

            themeBtn.innerHTML =
                "<span>☾</span><span>Dark mode</span>";

        }

    }


    if (themeBtn) {

        themeBtn.addEventListener("click", function () {

            document.body.classList.toggle("light-mode");


            if (document.body.classList.contains("light-mode")) {

                localStorage.setItem(
                    "placementTheme",
                    "light"
                );

                themeBtn.innerHTML =
                    "<span>☾</span><span>Dark mode</span>";

            } else {

                localStorage.setItem(
                    "placementTheme",
                    "dark"
                );

                themeBtn.innerHTML =
                    "<span>☼</span><span>Light mode</span>";

            }

        });

    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener("click", function () {

            const confirmLogout =
                confirm("Are you sure you want to log out?");

            if (confirmLogout) {

                window.location.href =
                    "login.html";

            }

        });

    }


    /* =====================================================
       MISSION DISPLAY
       ===================================================== */

    function updateMission() {

        let completed =
            Number(localStorage.getItem("dailyCompleted")) || 0;

        if (completed > 3) {
            completed = 3;
        }

        if (completedCount) {

            completedCount.textContent =
                completed;

        }

        if (missionStatus) {

            const left =
                3 - completed;

            missionStatus.textContent =
                left + (left === 1 ? " left" : " left");

        }

    }


    updateMission();

});