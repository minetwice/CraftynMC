/* CraftynMC / FearLauncher — Cosmetics section parked
 * ------------------------------------------------------------------
 * The Cosmetics section is being reworked, so for now it is hidden and
 * emptied (nav item + section) so nobody lands on a half-finished page.
 * To bring it back later, just drop this script from src/index.js.
 */
(function () {
  "use strict";

  var NAV_SEL = '.nav-item[data-section="cosmetics-shop"]';
  var SEC_ID = "cosmetics-shop";

  function park() {
    var nav = document.querySelector(NAV_SEL);
    if (nav && nav.style.display !== "none") nav.style.display = "none";

    var sec = document.getElementById(SEC_ID);
    if (!sec) return;
    if (sec.innerHTML !== "") sec.innerHTML = "";
    if (sec.style.display !== "none") sec.style.display = "none";
    if (sec.classList.contains("active")) sec.classList.remove("active");
  }

  function init() {
    park();
    setInterval(park, 1200);   // the page may re-render it on navigation
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
