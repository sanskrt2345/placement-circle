document.addEventListener("DOMContentLoaded", function () {

    console.log("Placement Circle Dashboard Loaded");


    // =====================================================
    // LIGHT MODE
    // =====================================================

    const lightModeButton =
        document.querySelector(".bottom-item");

    if (lightModeButton) {

        lightModeButton.addEventListener("click", function () {

            document.body.classList.toggle("light-mode");

        });

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    const bottomButtons =
        document.querySelectorAll(".bottom-item");

    if (bottomButtons.length > 1) {

        const logoutButton = bottomButtons[1];

        logoutButton.addEventListener("click", function () {

            window.location.href = "login.html";

        });

    }


    // =====================================================
    // CONTINUE TODAY'S PREP
    // =====================================================

    const prepButton =
        document.querySelector(".primary-button");

    if (prepButton) {

        prepButton.addEventListener("click", function () {

            window.location.href = "daily-prep.html";

        });

    }


    // =====================================================
    // SIDEBAR NAVIGATION
    // =====================================================

    const navItems =
        document.querySelectorAll(".nav-item");


    navItems.forEach(function (item) {

        item.addEventListener("click", function (event) {

            const link =
                this.getAttribute("href");


            // If it is a real page link,
            // allow browser navigation.
            if (
                link &&
                link !== "#" &&
                link !== ""
            ) {

                // Do NOT prevent default.
                // Browser will open the page normally.

                navItems.forEach(function (nav) {

                    nav.classList.remove("active");

                });

                this.classList.add("active");

                return;

            }


            // For placeholder "#" links
            event.preventDefault();


            navItems.forEach(function (nav) {

                nav.classList.remove("active");

            });

            this.classList.add("active");

        });

    });


    // =====================================================
    // NOTIFICATION
    // =====================================================

    const notificationButton =
        document.querySelector(".notification");

    if (notificationButton) {

        notificationButton.addEventListener("click", function () {

            console.log("Notifications clicked");

        });

    }

});