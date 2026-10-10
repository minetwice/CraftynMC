/* CraftynMC / FearLauncher — Rich Description Editor + Upload Type Tray
 * ------------------------------------------------------------------
 * 1) Upgrades the admin "Upload Asset" description box (#assetDesc) into a
 *    WYSIWYG editor with Write / Code / Preview tabs and JSON formatting,
 *    without changing the page markup: it finds the existing textarea and
 *    replaces it in place.
 *
 * 2) Adds an upload-type "tray" at the top of the same form, so an admin can
 *    pick Mod / Plugin / Resource Pack / Shader / FearLauncher Client first.
 *    The chosen type drives the file input (e.g. Plugin accepts only .jar),
 *    while title, lore, description, icon and preview image stay available
 *    for every type.
 *
 * The value written back to #assetDesc is display-ready, sanitised HTML
 * (JSON is pretty-printed + coloured, plain text keeps its line breaks),
 * so the existing upload handler and the public asset pages render it
 * correctly with no further changes.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  function escapeHtmlText(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Returns the parsed value only for JSON objects/arrays, otherwise
  // undefined (so a plain description like "1.20" is never mistaken for JSON).
  function tryParseStructuredJson(text) {
    var t = String(text || "").trim();
    if (!t || (t[0] !== "{" && t[0] !== "[")) return undefined;
    try { return JSON.parse(t); } catch (e) { return undefined; }
  }

  // Colours a JSON value by walking the pretty-printed text character by
  // character (no regex, so there are no escaping surprises in the source).
  function highlightJsonBlock(value) {
    var json = JSON.stringify(value, null, 2);
    var n = json.length;
    var out = "";
    var i = 0;
    var CODE_QUOTE = 34, CODE_BACKSLASH = 92, CODE_COLON = 58;
    function isDigit(c) { return c >= 48 && c <= 57; }
    function isSpace(c) { return c === 32 || c === 9 || c === 10 || c === 13; }
    while (i < n) {
      var code = json.charCodeAt(i);
      if (code === CODE_QUOTE) {
        var j = i + 1;
        while (j < n) {
          var cj = json.charCodeAt(j);
          if (cj === CODE_BACKSLASH) { j += 2; continue; }
          if (cj === CODE_QUOTE) { j++; break; }
          j++;
        }
        var k = j;
        while (k < n && isSpace(json.charCodeAt(k))) k++;
        var cls = json.charCodeAt(k) === CODE_COLON ? "j-key" : "j-str";
        out += '<span class="' + cls + '">' + escapeHtmlText(json.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      if (isDigit(code) || code === 45) {
        var d = i;
        while (d < n) {
          var cd = json.charCodeAt(d);
          if (isDigit(cd) || cd === 46 || cd === 101 || cd === 69 || cd === 43 || cd === 45) d++;
          else break;
        }
        out += '<span class="j-num">' + escapeHtmlText(json.slice(i, d)) + "</span>";
        i = d;
        continue;
      }
      var word4 = json.slice(i, i + 4);
      var word5 = json.slice(i, i + 5);
      if (word5 === "false") { out += '<span class="j-bool">false</span>'; i += 5; continue; }
      if (word4 === "true") { out += '<span class="j-bool">true</span>'; i += 4; continue; }
      if (word4 === "null") { out += '<span class="j-null">null</span>'; i += 4; continue; }
      out += escapeHtmlText(json.charAt(i));
      i++;
    }
    return '<pre class="rt-json">' + out + "</pre>";
  }

  var RT_BLOCKED_TAGS = ["script", "style", "iframe", "object", "embed", "link", "meta", "form", "input", "button", "textarea", "select", "svg", "math", "base", "noscript"];

  function sanitizeRichHtml(html) {
    var doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    var nodes = doc.body.querySelectorAll("*");
    Array.prototype.forEach.call(nodes, function (el) {
      var tag = el.tagName.toLowerCase();
      if (RT_BLOCKED_TAGS.indexOf(tag) !== -1) { el.remove(); return; }
      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        var val = attr.value || "";
        if (name.indexOf("on") === 0) el.removeAttribute(attr.name);
        else if ((name === "href" || name === "src" || name === "xlink:href") && /^\s*(javascript|data):/i.test(val)) el.removeAttribute(attr.name);
        else if (name === "style" && /expression|javascript:|url\s*\(/i.test(val)) el.removeAttribute(attr.name);
      });
    });
    return doc.body.innerHTML;
  }

  /* ---------------- Markdown support ---------------- */

  function looksLikeMarkdown(t) {
    return /(^|\n)\s{0,3}#{1,6}\s/.test(t) ||
      /\*\*[^*\n]+\*\*/.test(t) ||
      /(^|\n)\s{0,3}([-*+]|\d+\.)\s+/.test(t) ||
      /(^|\n)\s{0,3}>\s?/.test(t) ||
      /(^|\n)\s*\|.+\|/.test(t) ||
      /\[[^\]\n]+\]\((https?:|[/])[^)\s]+\)/.test(t) ||
      /(^|\n)\s{0,3}(-{3,}|\*{3,}|_{3,})\s*(\n|$)/.test(t);
  }

  function mdInline(s) {
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
    s = s.replace(/\[([^\]\n]+)\]\((https?:|[/])[^)\s]*\)/g, function (m, txt) {
      var url = m.slice(m.indexOf("](") + 2, -1);
      return '<a href="' + url + '" target="_blank" rel="noopener">' + txt + "</a>";
    });
    return s;
  }

  function mdCells(line) {
    return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); });
  }

  function mdIsTableSep(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
  }

  function renderMarkdown(md) {
    var lines = escapeHtmlText(String(md).replace(/\r\n?/g, "\n")).split("\n");
    var out = [];
    var i = 0;
    var listRe = /^\s*(?:[-*+]|\d+\.)\s+/;
    var headRe = /^(#{1,6})\s+(.*)$/;
    var hrRe = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
    var bqRe = /^\s*>\s?/;
    while (i < lines.length) {
      var line = lines[i];
      if (line.indexOf("|") !== -1 && i + 1 < lines.length && mdIsTableSep(lines[i + 1])) {
        var head = mdCells(line);
        var rows = [];
        i += 2;
        while (i < lines.length && lines[i].indexOf("|") !== -1 && lines[i].trim() !== "") { rows.push(mdCells(lines[i])); i++; }
        out.push("<table><thead><tr>" + head.map(function (h) { return "<th>" + mdInline(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          rows.map(function (r) { return "<tr>" + head.map(function (_, ci) { return "<td>" + mdInline(r[ci] || "") + "</td>"; }).join("") + "</tr>"; }).join("") +
          "</tbody></table>");
        continue;
      }
      var hm = line.match(headRe);
      if (hm) { var lvl = Math.min(hm[1].length + 2, 6); out.push("<h" + lvl + ">" + mdInline(hm[2]) + "</h" + lvl + ">"); i++; continue; }
      if (hrRe.test(line)) { out.push("<hr>"); i++; continue; }
      if (bqRe.test(line)) {
        var q = [];
        while (i < lines.length && bqRe.test(lines[i])) { q.push(lines[i].replace(bqRe, "")); i++; }
        out.push("<blockquote>" + mdInline(q.join(" ")) + "</blockquote>");
        continue;
      }
      if (listRe.test(line)) {
        var ordered = /^\s*\d+\.\s+/.test(line);
        var items = [];
        while (i < lines.length && listRe.test(lines[i])) { items.push(lines[i].replace(listRe, "")); i++; }
        out.push("<" + (ordered ? "ol" : "ul") + ">" + items.map(function (t) { return "<li>" + mdInline(t) + "</li>"; }).join("") + "</" + (ordered ? "ol" : "ul") + ">");
        continue;
      }
      if (line.trim() === "") { i++; continue; }
      var para = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== "" && !headRe.test(lines[i]) && !listRe.test(lines[i]) && !bqRe.test(lines[i]) && !hrRe.test(lines[i]) &&
             !(lines[i].indexOf("|") !== -1 && i + 1 < lines.length && mdIsTableSep(lines[i + 1]))) { para.push(lines[i]); i++; }
      out.push("<p>" + para.map(mdInline).join("<br>") + "</p>");
    }
    return out.join("\n");
  }

  // Renders an asset description for any surface (admin preview + public pages).
  // Handles: JSON (pretty + coloured), rich HTML (sanitised), Markdown, plain text.
  function renderAssetDescription(raw, fallbackText) {
    var text = String(raw == null ? "" : raw).trim();
    if (!text) return escapeHtmlText(fallbackText || "");
    var parsed = tryParseStructuredJson(text);
    if (parsed !== undefined) return highlightJsonBlock(parsed);
    // Only treat it as rich HTML if it contains a REAL html tag (so that
    // markdown like <player> / <fruit> is not mistaken for HTML).
    if (/<\s*(p|div|span|br|hr|h[1-6]|ul|ol|li|table|thead|tbody|tr|td|th|strong|b|em|i|u|a|img|blockquote|pre|code|section|article|figure|figcaption|video|audio|source)\b[^>]*>/i.test(text)) return sanitizeRichHtml(text);
    if (looksLikeMarkdown(text)) return renderMarkdown(text);
    return escapeHtmlText(text).replace(/\n/g, "<br>");
  }

  function showUploadMessage(el, text, ok) {
    if (!el) return;
    if (typeof window.showMsg === "function") { window.showMsg(el, text, ok); return; }
    el.textContent = text;
    el.style.color = ok ? "#00ff88" : "#ff6b8b";
  }

  /* ------------------------------------------------------------------ */
  /* Styles                                                              */
  /* ------------------------------------------------------------------ */

  var CSS = [
    ".rt-editor{border:1px solid var(--border-color);border-radius:14px;background:rgba(10,12,18,.6);overflow:hidden;margin-bottom:16px}",
    ".rt-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:8px 10px;background:rgba(255,255,255,.03);border-bottom:1px solid var(--border-color)}",
    ".rt-btn{width:auto;min-width:0;background:transparent;border:1px solid transparent;color:var(--text-secondary);border-radius:8px;padding:7px 10px;font-size:13px;line-height:1;cursor:pointer;box-shadow:none;font-family:inherit}",
    ".rt-btn:hover{color:#fff;background:rgba(255,0,72,.15);border-color:var(--border-hover);transform:none;box-shadow:none}",
    ".rt-tabs{display:flex;gap:6px;padding:8px 10px 0}",
    ".rt-tab{width:auto;min-width:0;background:rgba(255,255,255,.04);border:1px solid var(--border-color);color:var(--text-secondary);border-radius:9px 9px 0 0;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;box-shadow:none;font-family:inherit}",
    ".rt-tab:hover{color:#fff;transform:none;box-shadow:none}",
    ".rt-tab.active{color:#fff;background:rgba(255,0,72,.2);border-color:var(--primary-red)}",
    ".rt-pane{display:block;width:100%;box-sizing:border-box;min-height:170px;padding:14px 16px;color:#fff;font-size:14px;line-height:1.65;border:none;background:transparent;outline:none;margin:0}",
    ".rt-rich:empty:before{content:attr(data-placeholder);color:var(--text-secondary);opacity:.65}",
    ".rt-rich h3,.rt-preview h3{font-family:'Outfit',sans-serif;font-size:18px;margin:8px 0;color:#fff}",
    ".rt-rich blockquote,.rt-preview blockquote{border-left:3px solid var(--primary-red);margin:8px 0;padding:4px 12px;color:#ffd700;font-style:italic}",
    ".rt-rich ul,.rt-rich ol,.rt-preview ul,.rt-preview ol{padding-left:22px;margin:8px 0}",
    ".rt-rich a,.rt-preview a{color:var(--primary-red)}",
    ".mr-desc table,.rt-rich table,.rt-preview table{border-collapse:collapse;width:100%;margin:12px 0;font-size:13px}",
    ".mr-desc th,.mr-desc td,.rt-rich th,.rt-rich td,.rt-preview th,.rt-preview td{border:1px solid var(--border-color);padding:8px 10px;text-align:left;vertical-align:top}",
    ".mr-desc th,.rt-rich th,.rt-preview th{background:rgba(255,0,72,.12);color:#fff;font-weight:700}",
    ".mr-desc hr,.rt-rich hr,.rt-preview hr{border:none;border-top:1px solid var(--border-color);margin:14px 0}",
    ".mr-desc code,.rt-rich code,.rt-preview code{background:rgba(0,0,0,.4);border-radius:6px;padding:1px 6px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}",
    ".rt-rich pre,.rt-preview pre,.asset-desc-rendered pre{background:rgba(0,0,0,.45);border:1px solid var(--border-color);border-radius:10px;padding:12px 14px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;line-height:1.5}",
    ".rt-code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;resize:vertical;background:rgba(0,0,0,.35);color:#8ff0a4;white-space:pre}",
    ".rt-preview{overflow:auto}",
    ".rt-json .j-key{color:#7cc4ff}.rt-json .j-str{color:#8ff0a4}.rt-json .j-num{color:#ffd479}.rt-json .j-bool{color:#ff8fb0}.rt-json .j-null{color:#c792ea}",
    ".asset-desc-rendered h3{font-family:'Outfit',sans-serif;font-size:17px;margin:10px 0 6px;color:#fff}",
    ".asset-desc-rendered blockquote{border-left:3px solid var(--primary-red);margin:8px 0;padding:4px 12px;color:#ffd700;font-style:italic}",
    ".asset-desc-rendered ul,.asset-desc-rendered ol{padding-left:22px;margin:8px 0}",
    ".asset-desc-rendered a{color:var(--primary-red)}",
    ".cat-tray{position:relative;margin-bottom:18px}",
    ".cat-tray-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-radius:14px;border:1px solid var(--border-color);background:rgba(10,12,18,.6);color:#fff;font-weight:600;font-size:14px;cursor:pointer;box-shadow:none;font-family:inherit}",
    ".cat-tray-toggle:hover{border-color:var(--primary-red);box-shadow:none;transform:none}",
    ".cat-tray-current{display:flex;align-items:center;gap:10px}",
    ".cat-tray-current>i{color:var(--primary-red)}",
    ".cat-tray-current b{color:#fff}",
    ".cat-tray-chevron{transition:transform .25s ease;color:var(--text-secondary)}",
    ".cat-tray.open .cat-tray-chevron{transform:rotate(180deg)}",
    ".cat-tray-panel{display:none;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:10px;padding:12px;border:1px solid var(--border-color);border-radius:14px;background:rgba(10,12,18,.85)}",
    ".cat-tray.open .cat-tray-panel{display:grid}",
    ".cat-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px 10px;border-radius:12px;border:1px solid var(--border-color);background:rgba(255,255,255,.03);color:var(--text-secondary);cursor:pointer;box-shadow:none;font-weight:600;font-size:13px;font-family:inherit;width:auto;min-width:0}",
    ".cat-tile i{font-size:22px}",
    ".cat-tile:hover{color:#fff;border-color:var(--border-hover);background:rgba(255,0,72,.12);transform:none;box-shadow:none}",
    ".cat-tile.active{color:#fff;border-color:var(--primary-red);background:rgba(255,0,72,.2);box-shadow:0 0 20px rgba(255,0,72,.25)}"
  ].join("");

  function injectStyles() {
    if (document.getElementById("rtEditorStyles")) return;
    var st = document.createElement("style");
    st.id = "rtEditorStyles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ------------------------------------------------------------------ */
  /* Upload-type tray                                                    */
  /* ------------------------------------------------------------------ */

  var CATEGORIES = [
    { key: "mods", label: "Mod", icon: "fa-cube", accept: ".jar,.zip", fileLabel: "Select Mod File (.jar / .zip)" },
    { key: "plugins", label: "Plugin", icon: "fa-plug", accept: ".jar", fileLabel: "Select Plugin File (.jar only)" },
    { key: "resources", label: "Resource Pack", icon: "fa-box", accept: ".zip", fileLabel: "Select Resource Pack (.zip)" },
    { key: "shaders", label: "Shader", icon: "fa-sun", accept: ".zip", fileLabel: "Select Shaderpack (.zip)" },
    { key: "launcher", label: "FearLauncher Client", icon: "fa-rocket", accept: ".exe,.jar,.apk,.zip", fileLabel: "Select Launcher / Asset File (.exe, .jar, .apk, .zip)" }
  ];

  function categoryByKey(key) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].key === key) return CATEGORIES[i];
    return CATEGORIES[0];
  }

  function buildCategoryTray() {
    var select = document.getElementById("assetCategory");
    var fileInput = document.getElementById("assetFile");
    var card = select ? select.closest(".card") : null;
    if (!select || !fileInput || !card || document.getElementById("catTray")) return null;

    // The tray replaces the plain "Category" dropdown.
    var selLabel = select.previousElementSibling;
    if (selLabel && selLabel.tagName === "LABEL") selLabel.style.display = "none";
    select.style.display = "none";

    var tray = document.createElement("div");
    tray.className = "cat-tray";
    tray.id = "catTray";
    var tiles = CATEGORIES.map(function (c) {
      return '<button type="button" class="cat-tile" data-cat="' + c.key + '"><i class="fas ' + c.icon + '"></i><span>' + c.label + "</span></button>";
    }).join("");
    tray.innerHTML =
      '<button type="button" class="cat-tray-toggle" id="catTrayToggle">' +
        '<span class="cat-tray-current"><i class="fas fa-shapes"></i><span>Upload type: <b id="catTrayCurrent">' + CATEGORIES[0].label + "</b></span></span>" +
        '<i class="fas fa-chevron-down cat-tray-chevron"></i>' +
      "</button>" +
      '<div class="cat-tray-panel" id="catTrayPanel">' + tiles + "</div>";

    var firstLabel = card.querySelector("label.field-label");
    if (firstLabel) card.insertBefore(tray, firstLabel);
    else card.appendChild(tray);

    function apply(catKey) {
      var def = categoryByKey(catKey);
      select.value = def.key;
      try { select.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
      var cur = document.getElementById("catTrayCurrent");
      if (cur) cur.textContent = def.label;
      Array.prototype.forEach.call(tray.querySelectorAll(".cat-tile"), function (t) {
        t.classList.toggle("active", t.getAttribute("data-cat") === def.key);
      });
      fileInput.setAttribute("accept", def.accept);
      var fl = fileInput.previousElementSibling;
      if (fl && fl.tagName === "LABEL") fl.textContent = def.fileLabel;
      tray.classList.remove("open");
    }

    document.getElementById("catTrayToggle").addEventListener("click", function () {
      tray.classList.toggle("open");
    });
    Array.prototype.forEach.call(tray.querySelectorAll(".cat-tile"), function (t) {
      t.addEventListener("click", function () { apply(t.getAttribute("data-cat")); });
    });

    apply(select.value || "mods");
    return { apply: apply, current: function () { return select.value; }, def: function () { return categoryByKey(select.value); }, fileInput: fileInput };
  }

  /* ------------------------------------------------------------------ */
  /* Rich description editor                                             */
  /* ------------------------------------------------------------------ */

  var TOOLBAR = [
    '<button type="button" class="rt-btn" data-cmd="bold" title="Bold"><i class="fas fa-bold"></i></button>',
    '<button type="button" class="rt-btn" data-cmd="italic" title="Italic"><i class="fas fa-italic"></i></button>',
    '<button type="button" class="rt-btn" data-cmd="underline" title="Underline"><i class="fas fa-underline"></i></button>',
    '<button type="button" class="rt-btn" data-cmd="insertUnorderedList" title="Bullet list"><i class="fas fa-list-ul"></i></button>',
    '<button type="button" class="rt-btn" data-cmd="insertOrderedList" title="Numbered list"><i class="fas fa-list-ol"></i></button>',
    '<span class="rt-sep"></span>',
    '<button type="button" class="rt-btn" data-block="h3" title="Heading"><i class="fas fa-heading"></i></button>',
    '<button type="button" class="rt-btn" data-block="blockquote" title="Quote"><i class="fas fa-quote-right"></i></button>',
    '<button type="button" class="rt-btn" data-block="pre" title="Code block"><i class="fas fa-code"></i></button>',
    '<button type="button" class="rt-btn" data-cmd="createLink" title="Insert link"><i class="fas fa-link"></i></button>',
    '<span class="rt-sep"></span>',
    '<button type="button" class="rt-btn" data-cmd="removeFormat" title="Clear formatting"><i class="fas fa-eraser"></i></button>',
    '<span class="rt-spacer"></span>',
    '<button type="button" class="rt-btn" id="rtFormatJson" title="Format / validate JSON"><i class="fas fa-brackets-curly"></i> Format JSON</button>'
  ].join("");

  var TABS = [
    '<button type="button" class="rt-tab active" data-rt-tab="rich"><i class="fas fa-pen"></i> Write</button>',
    '<button type="button" class="rt-tab" data-rt-tab="code"><i class="fas fa-code"></i> Code</button>',
    '<button type="button" class="rt-tab" data-rt-tab="preview"><i class="fas fa-eye"></i> Preview</button>'
  ].join("");

  function buildEditor(hidden) {
    var wrap = document.createElement("div");
    wrap.className = "rt-editor";
    wrap.id = "rtEditor";
    wrap.innerHTML =
      '<div class="rt-toolbar">' + TOOLBAR + "</div>" +
      '<div class="rt-tabs">' + TABS + "</div>" +
      '<div class="rt-pane rt-rich" id="rtRich" contenteditable="true" data-placeholder="Describe the launcher features, lore, optimization improvements... Use the toolbar for bold / headings / lists, or paste JSON and hit Preview."></div>' +
      '<textarea class="rt-pane rt-code" id="rtCode" spellcheck="false" style="display:none"></textarea>' +
      '<div class="rt-pane rt-preview" id="rtPreview" style="display:none"></div>';

    hidden.parentNode.insertBefore(wrap, hidden);
    hidden.style.display = "none";
    hidden.setAttribute("aria-hidden", "true");

    var rich = wrap.querySelector("#rtRich");
    var code = wrap.querySelector("#rtCode");
    var preview = wrap.querySelector("#rtPreview");
    var activeTab = "rich";

    function getSource() { return activeTab === "code" ? code.value : rich.innerHTML; }
    function sync() { hidden.value = renderAssetDescription(getSource(), ""); }

    function renderPreview() {
      preview.innerHTML = renderAssetDescription(getSource(), "Nothing to preview yet. Start typing in the Write tab.");
    }

    function setTab(tab) {
      if (tab !== "code" && activeTab === "code") rich.innerHTML = sanitizeRichHtml(code.value);
      if (tab === "code" && activeTab !== "code") code.value = rich.innerHTML;
      activeTab = tab;
      rich.style.display = tab === "rich" ? "block" : "none";
      code.style.display = tab === "code" ? "block" : "none";
      preview.style.display = tab === "preview" ? "block" : "none";
      Array.prototype.forEach.call(wrap.querySelectorAll(".rt-tab"), function (b) {
        b.classList.toggle("active", b.getAttribute("data-rt-tab") === tab);
      });
      if (tab === "preview") renderPreview();
      sync();
    }

    Array.prototype.forEach.call(wrap.querySelectorAll(".rt-btn[data-cmd]"), function (btn) {
      btn.addEventListener("click", function () {
        var cmd = btn.getAttribute("data-cmd");
        if (cmd === "createLink") {
          var url = prompt("Enter link URL:", "https://");
          if (url) document.execCommand("createLink", false, url);
        } else {
          document.execCommand(cmd, false, null);
        }
        rich.focus();
        sync();
      });
    });

    Array.prototype.forEach.call(wrap.querySelectorAll(".rt-btn[data-block]"), function (btn) {
      btn.addEventListener("click", function () {
        document.execCommand("formatBlock", false, btn.getAttribute("data-block"));
        rich.focus();
        sync();
      });
    });

    wrap.querySelector("#rtFormatJson").addEventListener("click", function () {
      var parsed = tryParseStructuredJson(getSource());
      if (parsed === undefined) { alert("Not valid JSON. Paste a JSON object or array (starting with { or [) to format it."); return; }
      var pretty = JSON.stringify(parsed, null, 2);
      if (activeTab === "code") code.value = pretty; else rich.textContent = pretty;
      sync();
    });

    Array.prototype.forEach.call(wrap.querySelectorAll(".rt-tab"), function (tabBtn) {
      tabBtn.addEventListener("click", function () { setTab(tabBtn.getAttribute("data-rt-tab")); });
    });

    rich.addEventListener("input", sync);
    code.addEventListener("input", sync);

    function reset() {
      rich.innerHTML = "";
      code.value = "";
      preview.innerHTML = "";
      setTab("rich");
      hidden.value = "";
    }

    setTab("rich");
    return { sync: sync, reset: reset, getSource: getSource };
  }

  /* ------------------------------------------------------------------ */
  /* Upload button: validate file type, then run the original handler     */
  /* ------------------------------------------------------------------ */

  function wrapUploadButton(editor, hidden, tray) {
    var btn = document.getElementById("uploadAssetBtn");
    if (!btn || btn.__flWrapped) return;
    btn.__flWrapped = true;
    var orig = btn.onclick;

    btn.onclick = function () {
      if (tray) {
        var def = tray.def();
        var file = tray.fileInput.files && tray.fileInput.files[0];
        if (def && file) {
          var name = file.name.toLowerCase();
          var ok = def.accept.split(",").some(function (ext) {
            return name.slice(-ext.trim().length).toLowerCase() === ext.trim().toLowerCase();
          });
          if (!ok) {
            showUploadMessage(document.getElementById("assetUploadMsg"),
              def.label + " uploads only accept " + def.accept + " files. Please pick a matching file.", false);
            return;
          }
        }
      }
      if (editor) editor.sync();
      var res = orig && orig.apply(this, arguments);
      if (res && typeof res.then === "function") {
        res.then(function () { if (editor && hidden && !hidden.value) editor.reset(); });
      }
      return res;
    };
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */

  function init() {
    injectStyles();
    var tray = buildCategoryTray();

    var hidden = document.getElementById("assetDesc");
    var editor = (hidden && !document.getElementById("rtEditor")) ? buildEditor(hidden) : null;

    wrapUploadButton(editor, hidden, tray);

    window.FearLauncherRichDesc = { render: renderAssetDescription, editor: editor, categories: CATEGORIES };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
