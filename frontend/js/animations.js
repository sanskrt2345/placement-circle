/* =====================================================
   PLACEMENT CIRCLE - SHARED ANIMATIONS (JS)
   1. Cards / rows ko ek-ek karke upar slide karna
   2. Numbers ka count-up (0 se value tak)
   3. Heatmap wave
   4. Page change pe smooth fade-out
   Kisi page ka code badalna nahi padta, ye alag se kaam karta hai.
===================================================== */

(function () {

    "use strict";

    var reduceMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* ---------- Kin elements ko animate karna hai ---------- */

    var RISE = [
        ".page-header", ".page-top", ".welcome-section",
        ".filter-panel", ".search-wrapper", ".you-card",
        ".question-row", ".board-row",
        ".opp-card", ".story-card",
        ".grid > .card", ".panel",
        ".top-grid > *", ".two-column-grid > *",
        ".dashboard-card", ".leaderboard-card",
        ".question-grid > *", ".prep-info > *",
        ".hero-content > *", ".hero .mission-card",
        ".login-form-container", ".left-content", ".signup-form"
    ].join(",");

    var COUNT = [
        ".mini-stats strong", ".stat-tile strong",
        ".lb-points", ".you-points strong",
        ".ring-text strong", ".stat h2",
        ".streak-stats strong"
    ].join(",");


    /* ---------- 1. Slide-up entrance ---------- */

    function collect(root, out) {

        if (!root || root.nodeType !== 1) return;

        if (root.matches(RISE)) out.push(root);

        root.querySelectorAll(RISE).forEach(function (el) {
            out.push(el);
        });
    }

    function applyRise(list) {

        var i = 0;

        list.forEach(function (el) {

            if (el.dataset.pcRise) return;

            // agar parent bhi animate ho raha hai toh bachche ko alag se nahi
            if (el.parentElement && el.parentElement.closest(RISE)) return;

            el.dataset.pcRise = "1";
            el.style.setProperty("--i", Math.min(i++, 9));
            el.classList.add("pc-rise");
        });
    }


    /* ---------- 2. Count-up numbers ---------- */

    var counted = new WeakSet();

    function countUp(el) {

        if (counted.has(el)) return;
        counted.add(el);

        var text = el.textContent.trim();

        if (text.indexOf("/") !== -1) return;          // "0/3" jaisa text chhod do

        var m = text.match(/(\d[\d,]*)/);
        if (!m) return;

        var target = parseInt(m[1].replace(/,/g, ""), 10);
        if (!target) return;                           // 0 ko animate nahi karna

        var hasComma = m[1].indexOf(",") !== -1;
        var prefix = text.slice(0, m.index);
        var suffix = text.slice(m.index + m[1].length);
        var duration = 1000;
        var start = null;

        el.textContent = prefix + "0" + suffix;

        function format(n) {
            return hasComma ? n.toLocaleString("en-US") : String(n);
        }

        function step(now) {

            if (start === null) start = now;

            var t = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - t, 3);        // easeOutCubic

            el.textContent = prefix + format(Math.round(target * eased)) + suffix;

            if (t < 1) requestAnimationFrame(step);
        }

        setTimeout(function () {
            requestAnimationFrame(step);
        }, 250);
    }

    function applyCounts(root) {

        if (reduceMotion || !root || root.nodeType !== 1) return;

        if (root.matches(COUNT)) countUp(root);

        root.querySelectorAll(COUNT).forEach(countUp);
    }


    /* ---------- 3. Heatmap wave (column ke hisaab se delay) ---------- */

    function applyHeat() {

        var cells = document.querySelectorAll(".heat-cell:not([data-c])");
        var offset = document.querySelectorAll(".heat-cell[data-c]").length;

        cells.forEach(function (cell, i) {
            cell.dataset.c = "1";
            cell.style.setProperty("--c", Math.floor((offset + i) / 7));
        });
    }


    /* ---------- Initial run ---------- */

    function init() {

        if (reduceMotion) return;

        var list = [];
        collect(document.body, list);
        applyRise(list);

        applyCounts(document.body);
        applyHeat();

        // jo cheezein baad mein JS se bani (filter, search, naya card) unko bhi animate karo
        new MutationObserver(function (mutations) {

            var added = [];

            mutations.forEach(function (m) {
                m.addedNodes.forEach(function (node) {

                    if (node.nodeType !== 1) return;

                    collect(node, added);
                    applyCounts(node);
                });
            });

            if (added.length) applyRise(added);

            applyHeat();

        }).observe(document.body, { childList: true, subtree: true });
    }

    init();


    /* ---------- 4. Page change pe smooth fade-out ---------- */

    document.addEventListener("click", function (e) {

        if (reduceMotion) return;
        if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var link = e.target.closest ? e.target.closest("a[href]") : null;
        if (!link) return;

        if (!link.matches(".nav-item, .login-link, .get-started, .primary-btn, .secondary-btn")) return;

        var href = link.getAttribute("href");

        if (!href || href.charAt(0) === "#" || link.target === "_blank") return;
        if (/^(https?:|mailto:|tel:|javascript:)/i.test(href)) return;

        // same page par ho toh normal chalne do
        if (link.href.split("#")[0] === window.location.href.split("#")[0]) return;

        e.preventDefault();

        document.body.classList.add("pc-leave");

        setTimeout(function () {
            window.location.href = link.href;
        }, 170);
    });

    // browser ke Back button se wapas aao toh page dikhna chahiye
    window.addEventListener("pageshow", function () {
        document.body.classList.remove("pc-leave");
    });

})();
