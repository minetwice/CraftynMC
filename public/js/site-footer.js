/* CraftynMC / FearLauncher — site footer
 * ------------------------------------------------------------------
 * A small footer at the bottom of the app with the legal links every real
 * site has: Privacy Policy, Terms of Use, Content Rules and Licensing.
 */
(function () {
  "use strict";

  var ID = "flSiteFooter";
  var LINKS = [
    { href: "/legal/privacy", text: "Privacy Policy" },
    { href: "/legal/terms", text: "Terms of Use" },
    { href: "/legal/rules", text: "Content Rules" },
    { href: "/legal/licence", text: "Licensing" }
  ];

  function inject() {
    if (document.getElementById(ID)) return;
    var auth = document.getElementById("authView");
    if (auth && auth.classList.contains("active")) return;   // not on the login screen

    var main = document.querySelector("main.main-content") || document.querySelector("main");
    if (!main) return;

    var f = document.createElement("footer");
    f.id = ID;
    f.style.cssText = "margin:40px 0 12px;padding:18px 10px 0;border-top:1px solid var(--border-color);" +
      "color:var(--text-secondary);font-size:12.5px;text-align:center;line-height:1.9";
    f.innerHTML =
      '<div style="margin-bottom:8px">© ' + new Date().getFullYear() +
        ' <b style="color:#fff">CraftynMC</b> — an independent Minecraft project.</div>' +
      LINKS.map(function (l) {
        return '<a href="' + l.href + '" style="color:var(--text-secondary);text-decoration:none;' +
          'margin:0 8px;border-bottom:1px solid transparent">' + l.text + '</a>';
      }).join("") +
      '<div style="margin-top:10px;opacity:.7;font-size:11.5px">Minecraft is a trademark of Mojang Synergies AB. ' +
        'CraftynMC is not affiliated with or endorsed by Mojang or Microsoft.</div>';
    main.appendChild(f);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
  setInterval(inject, 2500);   // the page re-renders sections as you navigate
})();
