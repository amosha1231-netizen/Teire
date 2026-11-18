// ---------- שפות: עברית, English, Français, Español ----------
// העברית היא שפת המקור של כל האתר. בשפה אחרת, הקובץ הזה מחליף כל טקסט עברי שמופיע במסך
// בתרגום שלו מהמילון js/lang/<שפה>.js (המפתח הוא הטקסט העברי המדויק, כמו שהוא בקוד).
// {n} במילון = מקום שבו הקוד משלב מספר או שם, למשל "שאלה {n} מתוך {n}".
// טקסט שאין לו תרגום (למשל השאלות עצמן, שנמצאות ב-content/) נשאר בעברית, מימין לשמאל.
// לבדיקה מה עוד חסר: node scripts/i18n-missing.mjs
(function () {
  const KEY = "teire.lang";
  const LANGS = [
    { id: "he", name: "עברית", flag: "🇮🇱", dir: "rtl" },
    { id: "en", name: "English", flag: "🇬🇧", dir: "ltr" },
    { id: "fr", name: "Français", flag: "🇫🇷", dir: "ltr" },
    { id: "es", name: "Español", flag: "🇪🇸", dir: "ltr" },
  ];
  let lang = "he";
  try { lang = localStorage.getItem(KEY) || "he"; } catch (e) { /* ignore */ }
  if (!LANGS.some(l => l.id === lang)) lang = "he";
  const info = LANGS.find(l => l.id === lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = info.dir;

  const NOTE = {
    en: "The questions are still in Hebrew. The rest of the game is in English.",
    fr: "Les questions sont encore en hébreu. Le reste du jeu est en français.",
    es: "Las preguntas todavía están en hebreo. El resto del juego está en español.",
  };

  const I18N = {
    lang, langs: LANGS, rtl: info.dir === "rtl", missing: new Set(),
    t: s => s,
    // רשימת הטקסטים שלא נמצא להם תרגום (בקונסול: I18N.dumpMissing()), להעתקה למילון
    dumpMissing: () => [...I18N.missing].join("\n"),
    // הודעה קטנה מעל שאלון: השאלות עוד בעברית
    contentNote: () => lang === "he" ? "" : `<div class="i18n-note" lang="${lang}">🌐 ${NOTE[lang]}</div>`,
    set(id) {
      try { localStorage.setItem(KEY, id); } catch (e) { /* ignore */ }
      location.reload();
    },
    pickerHTML: () => `<div class="lang-pick" role="group" aria-label="Language">${LANGS.map(l =>
      `<button type="button" class="lang-btn ${l.id === lang ? "on" : ""}" data-lang="${l.id}" lang="${l.id}" translate="no">${l.flag} ${l.name}</button>`).join("")}</div>`,
  };
  window.I18N = I18N;
  window.T = s => I18N.t(s);
  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest("[data-lang]");
    if (b && b.dataset.lang !== lang) { ev.preventDefault(); I18N.set(b.dataset.lang); }
  });
  if (lang === "he") return;

  // המילון נטען מיד (לפני שאר הקבצים), כדי שהמסך הראשון כבר יופיע בשפה הנבחרת
  document.write(`<script src="js/lang/${lang}.js"><\/script>`);

  const HEB = /[א-ת]/;
  // תוכן תורני (שאלות, תשובות, פסוקים) לא מתורגם, כדי לא להחליף בטעות מילה בשאלה
  const SKIP = "[translate=no], .qtext, .answers, .verse, .explain, .quote, [data-noi18n], textarea, input, script, style";
  const EDGE = /^[\s\p{Extended_Pictographic}️‍\d·•:;,.\-–—+=×✓✔✕✗➜➡⬅▸←→‹›()[\]"'«»/|%#!?…]*/u;
  const EDGE_END = /[\s\p{Extended_Pictographic}️‍\d·•:;,.\-–—+=×✓✔✕✗➜➡⬅▸←→‹›()[\]"'«»/|%#!?…]*$/u;
  let dict = {}, templates = [];

  function prepare() {
    dict = window.TEIRE_LANG || {};
    templates = [];
    for (let k in dict) {
      if (!k.includes("{n}")) continue;
      // שני משתנים צמודים ({n}{n}) אי אפשר להפריד בטקסט, אז מתייחסים אליהם כמשתנה אחד
      if (k.includes("{n}{n}")) { const v = dict[k].replace(/\{n\}\{n\}/g, "{n}"); k = k.replace(/\{n\}\{n\}/g, "{n}"); templates.push([rx(k), v]); continue; }
      templates.push([rx(k), dict[k]]);
    }
  }
  function rx(k) {
    return new RegExp("^" + k.split("{n}").map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("([\\s\\S]+?)") + "$");
  }
  const norm = s => s.replace(/\s+/g, " ").trim();
  function exact(s) {
    if (dict[s] != null) return dict[s];
    const a = s.match(EDGE)[0], rest = s.slice(a.length);
    const b = rest.match(EDGE_END)[0], core = rest.slice(0, rest.length - b.length);
    if (core && core !== s && dict[core] != null) return a + dict[core] + b;
    return null;
  }
  function fill(tpl, parts) {
    let i = 0;
    return tpl.replace(/\{(n|\d)\}/g, (_, w) => {
      const v = w === "n" ? parts[i++] : parts[Number(w) - 1];
      return v == null ? "" : v;
    });
  }
  const cache = new Map();
  function tr(raw, depth = 0) {
    const s = norm(raw);
    if (!s || !HEB.test(s)) return null;
    if (cache.has(s)) return cache.get(s);
    let out = exact(s);
    if (out == null) {
      for (const [re, val] of templates) {
        const m = s.match(re);
        if (!m) continue;
        const parts = m.slice(1).map(p => (depth < 2 && HEB.test(p) && tr(p, depth + 1)) || p);
        out = fill(val, parts);
        break;
      }
    }
    // טקסט מחובר מכמה חלקים ("תנא · ירושלים"): מתרגמים כל חלק בנפרד
    if (out == null && depth < 2) {
      const parts = s.split(/( · |, | \/ | - |: )/);
      if (parts.length > 1) {
        let any = false;
        const done = parts.map((p, i) => { if (i % 2) return p; const t = HEB.test(p) ? tr(p, depth + 1) : null; if (t != null) any = true; return t != null ? t : p; });
        if (any) out = done.join("");
      }
    }
    if (out == null && depth === 0) I18N.missing.add(s);
    if (depth === 0 || out != null) cache.set(s, out);
    return out;
  }
  I18N.t = s => (typeof s === "string" && tr(s)) || s;

  function doText(node) {
    const v = node.nodeValue;
    if (!v || !HEB.test(v)) return;
    const p = node.parentElement;
    if (!p || p.closest(SKIP)) { if (p) mark(p); return; }
    const out = tr(v);
    if (out != null) {
      const lead = v.match(/^\s*/)[0], tail = v.match(/\s*$/)[0];
      node.nodeValue = lead + out + tail;
    } else mark(p);
  }
  // טקסט שנשאר בעברית: מימין לשמאל, ומסומן כעברית
  function mark(el) {
    if (!el.hasAttribute("dir")) el.setAttribute("dir", "auto");
    if (!el.hasAttribute("lang")) el.setAttribute("lang", "he");
  }
  const ATTRS = ["placeholder", "title", "aria-label", "alt"];
  function doAttrs(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v && HEB.test(v)) { const out = tr(v); if (out != null) el.setAttribute(a, out); }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = w.nextNode())) n.nodeType === 3 ? doText(n) : doAttrs(n);
  }
  function start() {
    prepare();
    document.title = I18N.t(document.title);
    walk(document.body);
    new MutationObserver(list => {
      for (const m of list) {
        if (m.type === "characterData") doText(m.target);
        else if (m.type === "attributes") doAttrs(m.target);
        else m.addedNodes.forEach(walk);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  // הבודי עוד לא קיים כשהקובץ נטען (בראש העמוד), אז מתחילים ברגע שהוא נוצר
  if (document.body) start();
  else new MutationObserver((_, obs) => { if (document.body) { obs.disconnect(); start(); } }).observe(document.documentElement, { childList: true });
})();
