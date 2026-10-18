(function () {
  const db = window.TeireDB;
  const cfg = window.TEIRE_CONFIG;
  const app = document.getElementById("app");

  const CATEGORIES = [
    { id: "torah", name: "חומש", icon: "📜", desc: "פרשות, דמויות וסיפורי התורה" },
    { id: "gemara", name: "משנה וגמרא", icon: "📖", desc: "מסכתות, משניות ופרקי אבות" },
    { id: "halacha", name: "הלכה ומנהג", icon: "🕯️", desc: "ברכות, תפילה וחגים" },
    { id: "all", name: "משימת ערבוב", icon: "🎲", desc: "שאלות מכל התחומים" },
  ];
  const catName = id => (CATEGORIES.find(c => c.id === id) || {}).name || id;

  const LEVELS = [
    { min: 0, name: "מתחיל" },
    { min: 100, name: "תלמיד" },
    { min: 300, name: "חבר" },
    { min: 600, name: "למדן" },
    { min: 1000, name: "חכם" },
    { min: 1600, name: "גאון" },
  ];

  // ---------- מצב השחקן (נשמר בדפדפן) ----------
  const PKEY = "teire.player.v1";
  function loadPlayer() {
    try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; }
  }
  let player = Object.assign({ name: "", points: 0, best: {}, missions: 0 }, loadPlayer());
  function savePlayer() {
    try { localStorage.setItem(PKEY, JSON.stringify(player)); } catch (e) { /* ignore */ }
    renderPlayer();
  }
  function levelOf(points) {
    let i = 0;
    while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].min) i++;
    const cur = LEVELS[i], next = LEVELS[i + 1];
    const pct = next ? Math.round(((points - cur.min) / (next.min - cur.min)) * 100) : 100;
    return { name: cur.name, next, pct };
  }
  function renderPlayer() {
    const lv = levelOf(player.points);
    document.getElementById("player").innerHTML =
      `${esc(player.name || "אורח")} · <b>${player.points}</b> נקודות<br><span class="small">דרגה: ${lv.name}</span>`;
  }

  // ---------- עזרים ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const LETTERS = ["א", "ב", "ג", "ד"];
  function setTab(tab) {
    document.querySelectorAll(".tabs a").forEach(a => a.classList.toggle("active", a.dataset.tab === tab));
  }
  function errorBox(e) {
    return `<div class="notice err">משהו השתבש: ${esc(e && e.message ? e.message : e)}</div>`;
  }

  // ---------- דף הבית ----------
  async function viewHome() {
    setTab("home");
    const lv = levelOf(player.points);
    app.innerHTML = `
      <section class="hero">
        <h1>משימות בתורה</h1>
        <p>בחרו משימה, ענו על ${cfg.QUESTIONS_PER_MISSION} שאלות ואספו נקודות</p>
      </section>
      <div class="card">
        ${player.name ? "" : `
          <label for="pname">איך קוראים לך?</label>
          <div class="row" style="margin-top:0">
            <input id="pname" placeholder="השם שלך" style="flex:1">
            <button class="btn" id="savename">שמירה</button>
          </div>`}
        <div class="level" style="margin-top:${player.name ? 0 : 16}px">
          <b>${lv.name}</b>
          <div class="level-bar"><span style="width:${lv.pct}%"></span></div>
          <span class="small muted">${lv.next ? `עוד ${lv.next.min - player.points} ל${lv.next.name}` : "הדרגה הגבוהה ביותר!"}</span>
        </div>
      </div>
      <div class="missions" id="missions"><p class="muted">טוען...</p></div>`;

    const btn = document.getElementById("savename");
    if (btn) btn.onclick = () => {
      const v = document.getElementById("pname").value.trim();
      if (v) { player.name = v; savePlayer(); viewHome(); }
    };

    try {
      const counts = await db.counts();
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      document.getElementById("missions").innerHTML = CATEGORIES.map(c => {
        const n = c.id === "all" ? total : (counts[c.id] || 0);
        const best = player.best[c.id];
        return `<button class="mission" data-cat="${c.id}" ${n ? "" : "disabled"}>
          <div class="icon">${c.icon}</div>
          <h3>${c.name}</h3>
          <div class="small muted">${c.desc}</div>
          <div class="small muted">${n} שאלות</div>
          ${best != null ? `<div class="best">שיא: ${best}/${cfg.QUESTIONS_PER_MISSION}</div>` : ""}
        </button>`;
      }).join("");
      document.querySelectorAll(".mission").forEach(b => b.onclick = () => { location.hash = "#/play/" + b.dataset.cat; });
    } catch (e) {
      document.getElementById("missions").innerHTML = errorBox(e);
    }
  }

  // ---------- משימה ----------
  async function viewPlay(category) {
    setTab("home");
    app.innerHTML = `<p class="muted">טוען שאלות...</p>`;
    let questions;
    try {
      questions = db.shuffle(await db.approved(category)).slice(0, cfg.QUESTIONS_PER_MISSION);
    } catch (e) { app.innerHTML = errorBox(e); return; }
    if (!questions.length) { app.innerHTML = `<div class="card">אין עדיין שאלות בנושא הזה. <a href="#/suggest">הציעו שאלה!</a></div>`; return; }

    let idx = 0, score = 0;
    function show() {
      const q = questions[idx];
      // מערבבים את סדר התשובות ושומרים איזו מהן נכונה
      const order = db.shuffle([0, 1, 2, 3]);
      app.innerHTML = `
        <div class="card">
          <div class="progress"><span>${catName(category)}</span><span>שאלה ${idx + 1} מתוך ${questions.length} · ${score} נכונות</span></div>
          <div class="qtext">${esc(q.question)}</div>
          <div class="answers">
            ${order.map((orig, i) => `<button class="answer" data-orig="${orig}"><span class="letter">${LETTERS[i]}</span>${esc(q.answers[orig])}</button>`).join("")}
          </div>
          <div id="fb"></div>
        </div>`;
      document.querySelectorAll(".answer").forEach(btn => btn.onclick = () => {
        const chosen = Number(btn.dataset.orig);
        const ok = chosen === q.correct;
        if (ok) score++;
        document.querySelectorAll(".answer").forEach(b => {
          b.disabled = true;
          if (Number(b.dataset.orig) === q.correct) b.classList.add("correct");
        });
        if (!ok) btn.classList.add("wrong");
        const last = idx === questions.length - 1;
        document.getElementById("fb").innerHTML = `
          <div class="feedback ${ok ? "good" : "bad"}">${ok ? "כל הכבוד! תשובה נכונה ✓" : "לא נורא, התשובה הנכונה מסומנת בירוק"}</div>
          ${q.source ? `<div class="small muted">מקור: ${esc(q.source)}</div>` : ""}
          <div class="row"><button class="btn" id="next">${last ? "לסיום המשימה" : "לשאלה הבאה"}</button></div>`;
        document.getElementById("next").onclick = () => { if (last) finish(); else { idx++; show(); } };
      });
    }
    function finish() {
      const perfect = score === questions.length;
      const earned = score * 10 + (perfect ? 20 : 0);
      player.points += earned;
      player.missions += 1;
      if (player.best[category] == null || score > player.best[category]) player.best[category] = score;
      savePlayer();
      const ratio = score / questions.length;
      const stars = ratio >= .9 ? 3 : ratio >= .6 ? 2 : ratio > 0 ? 1 : 0;
      app.innerHTML = `
        <div class="card result">
          <h2>${perfect ? "מושלם! אשריך!" : stars >= 2 ? "יישר כח!" : "המשיכו להתאמץ!"}</h2>
          <div class="stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div>
          <div class="big">${score}/${questions.length}</div>
          <p>הרווחתם <b>${earned}</b> נקודות${perfect ? " (כולל בונוס 20 על משימה מושלמת)" : ""}</p>
          <div class="row" style="justify-content:center">
            <button class="btn gold" id="again">עוד משימה כזאת</button>
            <a class="btn ghost" href="#/">לכל המשימות</a>
          </div>
        </div>`;
      document.getElementById("again").onclick = () => viewPlay(category);
    }
    show();
  }

  // ---------- טופס הצעת שאלה ----------
  function questionForm(q) {
    q = q || { category: "torah", question: "", answers: ["", "", "", ""], correct: 0, source: "" };
    return `
      <label>נושא</label>
      <select name="category">
        ${CATEGORIES.filter(c => c.id !== "all").map(c => `<option value="${c.id}" ${q.category === c.id ? "selected" : ""}>${c.name}</option>`).join("")}
      </select>
      <label>השאלה</label>
      <textarea name="question" rows="2" required maxlength="300">${esc(q.question)}</textarea>
      <label>ארבע תשובות <span class="hint">(סמנו את העיגול ליד התשובה הנכונה)</span></label>
      ${[0, 1, 2, 3].map(i => `
        <div class="opt">
          <input type="radio" name="correct" value="${i}" ${q.correct === i ? "checked" : ""} aria-label="תשובה נכונה">
          <input name="a${i}" required maxlength="150" placeholder="תשובה ${LETTERS[i]}" value="${esc(q.answers[i])}">
        </div>`).join("")}
      <label>מקור <span class="hint">(לא חובה, למשל: בראשית א, א או ברכות ב, א)</span></label>
      <input name="source" maxlength="100" value="${esc(q.source || "")}">`;
  }
  function readForm(form) {
    const f = new FormData(form);
    return {
      category: f.get("category"),
      question: f.get("question").trim(),
      answers: [0, 1, 2, 3].map(i => f.get("a" + i).trim()),
      correct: Number(f.get("correct")),
      source: (f.get("source") || "").trim(),
    };
  }

  function viewSuggest() {
    setTab("suggest");
    app.innerHTML = `
      <div class="card">
        <h2>הציעו שאלה</h2>
        <p class="muted small">השאלה תופיע באתר אחרי שמנהל יאשר אותה.</p>
        <form id="sform">
          ${questionForm()}
          <label>השם שלך <span class="hint">(לא חובה)</span></label>
          <input name="author" maxlength="50" value="${esc(player.name)}">
          <div class="row"><button class="btn" type="submit">שליחה לאישור</button></div>
          <div id="smsg" style="margin-top:12px"></div>
        </form>
      </div>`;
    const form = document.getElementById("sform");
    form.onsubmit = async ev => {
      ev.preventDefault();
      const q = readForm(form);
      const msg = document.getElementById("smsg");
      if (new Set(q.answers).size < 4) { msg.innerHTML = `<div class="notice err">כל ארבע התשובות צריכות להיות שונות זו מזו.</div>`; return; }
      q.author_name = (new FormData(form).get("author") || "").trim() || null;
      form.querySelector("button[type=submit]").disabled = true;
      try {
        await db.submit(q);
        msg.innerHTML = `<div class="notice ok">תודה! השאלה נשלחה ותופיע אחרי אישור.</div>`;
        form.reset();
        form.querySelector("input[name=author]").value = player.name;
      } catch (e) {
        msg.innerHTML = errorBox(e);
      }
      form.querySelector("button[type=submit]").disabled = false;
    };
  }

  // ---------- ניהול ----------
  async function viewAdmin() {
    setTab("admin");
    app.innerHTML = `<p class="muted">בודק הרשאות...</p>`;
    let admin = false;
    try { admin = await db.isAdmin(); } catch (e) { /* not admin */ }
    if (!admin) return viewLogin();

    app.innerHTML = `
      <div class="row" style="justify-content:space-between;margin:0 0 12px">
        <h2 style="margin:0">שאלות שממתינות לאישור</h2>
        <button class="btn ghost" id="logout">יציאה</button>
      </div>
      <div id="plist"><p class="muted">טוען...</p></div>`;
    document.getElementById("logout").onclick = async () => { await db.logout(); viewAdmin(); };

    let list;
    try { list = await db.pending(); } catch (e) { document.getElementById("plist").innerHTML = errorBox(e); return; }
    const box = document.getElementById("plist");
    if (!list.length) { box.innerHTML = `<div class="card muted">אין שאלות חדשות לאישור 🎉</div>`; return; }

    box.innerHTML = list.map(q => `
      <div class="card pending" data-id="${q.id}">
        <div><span class="chip">${esc(catName(q.category))}</span><span class="small muted">${q.author_name ? "מאת " + esc(q.author_name) : "אנונימי"}</span></div>
        <h3 style="margin-top:8px">${esc(q.question)}</h3>
        <ol>${q.answers.map((a, i) => `<li class="${i === q.correct ? "is-correct" : ""}">${esc(a)}${i === q.correct ? " ✓" : ""}</li>`).join("")}</ol>
        ${q.source ? `<div class="small muted">מקור: ${esc(q.source)}</div>` : ""}
        <div class="row">
          <button class="btn good" data-act="approve">אישור</button>
          <button class="btn ghost" data-act="edit">עריכה</button>
          <button class="btn bad" data-act="reject">דחייה</button>
        </div>
      </div>`).join("");

    box.querySelectorAll("button[data-act]").forEach(btn => btn.onclick = async () => {
      const card = btn.closest(".pending");
      const id = Number(card.dataset.id);
      const q = list.find(x => x.id === id);
      const act = btn.dataset.act;
      if (act === "edit") return editCard(card, q);
      card.querySelectorAll("button").forEach(b => b.disabled = true);
      try {
        await db.setStatus(id, act === "approve" ? "approved" : "rejected");
        card.innerHTML = `<div class="notice ${act === "approve" ? "ok" : ""}">${act === "approve" ? "השאלה אושרה ונוספה למשימות" : "השאלה נדחתה"}</div>`;
      } catch (e) { card.insertAdjacentHTML("beforeend", errorBox(e)); }
    });
  }

  function editCard(card, q) {
    card.innerHTML = `<form>${questionForm(q)}
      <div class="row"><button class="btn good" type="submit">שמירה ואישור</button><button class="btn ghost" type="button" id="cancel">ביטול</button></div></form>`;
    const form = card.querySelector("form");
    card.querySelector("#cancel").onclick = () => viewAdmin();
    form.onsubmit = async ev => {
      ev.preventDefault();
      try {
        await db.update(q.id, { ...readForm(form), status: "approved" });
        card.innerHTML = `<div class="notice ok">השאלה עודכנה ואושרה</div>`;
      } catch (e) { card.insertAdjacentHTML("beforeend", errorBox(e)); }
    };
  }

  function viewLogin() {
    const isLocal = db.mode === "local";
    app.innerHTML = `
      <div class="card">
        <h2>כניסת מנהל</h2>
        ${isLocal ? `<p class="notice">האתר עובד כרגע במצב מקומי: הצעות נשמרות רק בדפדפן הזה. כדי לאשר הצעות של כל המשתמשים צריך לחבר את Supabase (הוראות בקובץ README).</p>` : ""}
        <form id="lform">
          ${isLocal ? "" : `<label>אימייל</label><input name="email" type="email" required autocomplete="username">`}
          <label>${isLocal ? "קוד מנהל" : "סיסמה"}</label>
          <input name="pw" type="password" required autocomplete="current-password">
          <div class="row"><button class="btn" type="submit">כניסה</button></div>
          <div id="lmsg" style="margin-top:12px"></div>
        </form>
      </div>`;
    const form = document.getElementById("lform");
    form.onsubmit = async ev => {
      ev.preventDefault();
      const f = new FormData(form);
      try { await db.login(f.get("email"), f.get("pw")); viewAdmin(); }
      catch (e) { document.getElementById("lmsg").innerHTML = `<div class="notice err">${esc(e.message)}</div>`; }
    };
  }

  // ---------- ניתוב ----------
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [page, arg] = h.split("/");
    window.scrollTo(0, 0);
    if (page === "play" && arg) return viewPlay(arg);
    if (page === "suggest") return viewSuggest();
    if (page === "admin") return viewAdmin();
    return viewHome();
  }
  window.addEventListener("hashchange", route);
  document.getElementById("foot").textContent =
    db.mode === "local" ? "מצב מקומי · הנתונים נשמרים בדפדפן הזה בלבד" : "מחובר למסד הנתונים המשותף";
  renderPlayer();
  route();
})();
