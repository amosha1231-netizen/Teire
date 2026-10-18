(function () {
  const db = window.TeireDB;
  const cfg = window.TEIRE_CONFIG;
  const { PLACES, ITEMS, SKINS, HAIR, avatarSVG } = window.TeireWorld;
  const app = document.getElementById("app");
  const placeById = id => PLACES.find(p => p.id === id);

  // ---------- מצב השחקן (נשמר בדפדפן) ----------
  const PKEY = "teire.player.v2";
  const DEFAULT_LOOK = { gender: "boy", skin: SKINS[0], hair: HAIR[0], hat: "kippah", shirt: "#3b82f6", extra: "none" };
  function loadPlayer() {
    try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; }
  }
  let player = Object.assign({ name: "", look: { ...DEFAULT_LOOK }, owned: [], coins: 0, stars: {} }, loadPlayer());
  function savePlayer() {
    try { localStorage.setItem(PKEY, JSON.stringify(player)); } catch (e) { /* ignore */ }
    renderHud();
  }
  const totalStars = () => Object.values(player.stars).reduce((a, b) => a + b, 0);
  const owns = (slot, item) => item.price === 0 || player.owned.includes(slot + ":" + item.id);
  // תחנה פתוחה אם זו הראשונה, או שבתחנה הקודמת יש לפחות כוכב אחד
  const isOpen = i => i === 0 || (player.stars[PLACES[i - 1].id] || 0) >= 1;

  function renderHud() {
    document.getElementById("hud").innerHTML = player.name ? `
      <span class="pill">⭐ ${totalStars()}</span>
      <span class="pill">🪙 ${player.coins}</span>` : "";
  }

  // ---------- עזרים ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const LETTERS = ["א", "ב", "ג", "ד"];
  function setTab(tab) {
    document.querySelectorAll(".bottomnav a").forEach(a => a.classList.toggle("active", a.dataset.tab === tab));
  }
  function errorBox(e) {
    return `<div class="notice err">משהו השתבש: ${esc(e && e.message ? e.message : e)}</div>`;
  }
  function bubble(place, text, mood) {
    return `<div class="guide ${mood || ""}">
      <div class="guide-face" style="background:${place.color}">${place.guide.emoji}</div>
      <div class="speech"><b>${esc(place.guide.name)}:</b> ${text}</div>
    </div>`;
  }
  function confetti() {
    const box = document.createElement("div");
    box.className = "confetti";
    const colors = ["#f5c542", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
    for (let i = 0; i < 40; i++) {
      const c = document.createElement("i");
      c.style.left = Math.random() * 100 + "%";
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = Math.random() * .6 + "s";
      c.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(c);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2600);
  }

  // ---------- היכרות: יצירת דמות ----------
  function viewOnboarding() {
    setTab("map");
    const look = { ...player.look };
    function draw() {
      app.innerHTML = `
        <div class="card center">
          <h1>ברוכים הבאים למסע!</h1>
          <p class="muted">צרו את הדמות שלכם ויוצאים לדרך במפת התורה</p>
          <div class="avatar-stage">${avatarSVG(look, 120)}</div>
          <div class="seg">
            <button class="${look.gender === "boy" ? "on" : ""}" data-g="boy">בן</button>
            <button class="${look.gender === "girl" ? "on" : ""}" data-g="girl">בת</button>
          </div>
          <div class="swatches">${SKINS.map(c => `<button class="sw ${look.skin === c ? "on" : ""}" data-skin="${c}" style="background:${c}" aria-label="צבע עור"></button>`).join("")}</div>
          <div class="swatches">${HAIR.map(c => `<button class="sw ${look.hair === c ? "on" : ""}" data-hair="${c}" style="background:${c}" aria-label="צבע שיער"></button>`).join("")}</div>
          <input id="pname" placeholder="איך קוראים לך?" maxlength="20" value="${esc(typed)}">
          <button class="btn big-btn" id="go">יוצאים לדרך!</button>
        </div>`;
      app.querySelectorAll("[data-g]").forEach(b => b.onclick = () => {
        look.gender = b.dataset.g;
        look.hat = look.gender === "girl" ? "none" : "kippah";
        keepName(); draw();
      });
      app.querySelectorAll("[data-skin]").forEach(b => b.onclick = () => { look.skin = b.dataset.skin; keepName(); draw(); });
      app.querySelectorAll("[data-hair]").forEach(b => b.onclick = () => { look.hair = b.dataset.hair; keepName(); draw(); });
      document.getElementById("go").onclick = () => {
        const name = document.getElementById("pname").value.trim();
        if (!name) { document.getElementById("pname").focus(); return; }
        player.name = name; player.look = look; savePlayer(); viewMap();
      };
    }
    let typed = player.name;
    function keepName() { const el = document.getElementById("pname"); if (el) typed = el.value; }
    draw();
  }

  // ---------- המפה ----------
  async function viewMap() {
    if (!player.name) return viewOnboarding();
    setTab("map");
    const STEP = 150, TOP = 100;
    const xs = [50, 78, 50, 22];
    const pts = PLACES.map((p, i) => ({ x: xs[i % xs.length], y: TOP + i * STEP }));
    const H = TOP + (PLACES.length - 1) * STEP + 120;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], my = (a.y + b.y) / 2;
      d += ` C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
    }
    let current = 0;
    PLACES.forEach((p, i) => { if (isOpen(i)) current = i; });

    const deco = ["☁️", "🌴", "✨", "🌿", "☁️", "🪨", "🌵", "✨", "🌸", "☁️"];
    app.innerHTML = `
      <div class="map-head">
        <div class="mini-avatar">${avatarSVG(player.look, 44)}</div>
        <div><b>שלום ${esc(player.name)}!</b><div class="small muted">בחרו תחנה במסע. כל תחנה שעוברים פותחת את הבאה.</div></div>
      </div>
      <div class="map" style="height:${H}px">
        <svg class="map-path" viewBox="0 0 100 ${H}" preserveAspectRatio="none" width="100%" height="${H}">
          <path d="${d}" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".7"/>
          <path d="${d}" fill="none" stroke="#c9a46a" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        </svg>
        ${deco.map((e, i) => `<span class="deco" style="top:${40 + i * (H - 80) / deco.length}px;${i % 2 ? "left" : "right"}:${4 + (i * 7) % 14}%">${e}</span>`).join("")}
        ${PLACES.map((p, i) => {
          const open = isOpen(i), st = player.stars[p.id] || 0;
          return `<button class="station ${open ? "" : "locked"} ${i === current ? "current" : ""}" data-place="${p.id}" ${open ? "" : "disabled"}
              style="left:${pts[i].x}%;top:${pts[i].y}px;--c:${p.color}">
            <span class="station-icon">${open ? p.icon : "🔒"}</span>
            <span class="station-name">${p.name}</span>
            <span class="station-stars">${"★".repeat(st)}<span class="dim">${"★".repeat(3 - st)}</span></span>
            ${i === current ? `<span class="here">${avatarSVG(player.look, 46)}</span>` : ""}
          </button>`;
        }).join("")}
      </div>`;
    app.querySelectorAll(".station:not(.locked)").forEach(b => b.onclick = () => { location.hash = "#/place/" + b.dataset.place; });
    const cur = app.querySelector(".station.current");
    if (cur && current > 1) cur.scrollIntoView({ block: "center" });
  }

  // ---------- תחנה: פתיחה, שאלות וסיום ----------
  async function viewPlace(placeId) {
    const place = placeById(placeId);
    if (!place || !player.name) return viewMap();
    setTab("map");
    const idxPlace = PLACES.indexOf(place);
    if (!isOpen(idxPlace)) return viewMap();

    app.innerHTML = `<p class="muted center">טוען...</p>`;
    let pool;
    try { pool = await db.approved(placeId); } catch (e) { app.innerHTML = errorBox(e); return; }
    const st = player.stars[placeId] || 0;
    app.innerHTML = `
      <div class="place-hero" style="--c:${place.color}">
        <div class="place-icon">${place.icon}</div>
        <h1>${place.name}</h1>
        <p>${place.desc}</p>
        <div class="station-stars big-stars">${"★".repeat(st)}<span class="dim">${"★".repeat(3 - st)}</span></div>
      </div>
      ${bubble(place, esc(place.guide.hello))}
      <div class="card center">
        ${pool.length
          ? `<p>${Math.min(pool.length, cfg.QUESTIONS_PER_MISSION)} שאלות מחכות לכם. כל תשובה נכונה = 🪙 10</p>
             <button class="btn big-btn" id="start">מתחילים את המשימה!</button>`
          : `<p>אין עדיין שאלות במקום הזה.</p>`}
        <div class="row center-row"><a class="btn ghost" href="#/">חזרה למפה</a><a class="btn ghost" href="#/suggest/${place.id}">הציעו שאלה למקום הזה</a></div>
      </div>`;
    const start = document.getElementById("start");
    if (start) start.onclick = () => runMission(place, pool);
  }

  function runMission(place, pool) {
    const questions = db.shuffle(pool).slice(0, cfg.QUESTIONS_PER_MISSION);
    let idx = 0, score = 0;
    const cheers = ["כל הכבוד!", "יישר כח!", "מצוין!", "אשריך!", "נפלא!"];
    function show() {
      const q = questions[idx];
      const order = db.shuffle([0, 1, 2, 3]);
      app.innerHTML = `
        <div class="dots">${questions.map((_, i) => `<span class="${i < idx ? "done" : i === idx ? "now" : ""}"></span>`).join("")}</div>
        ${bubble(place, `שאלה ${idx + 1} מתוך ${questions.length}`)}
        <div class="card">
          <div class="qtext">${esc(q.question)}</div>
          <div class="answers">
            ${order.map((orig, i) => `<button class="answer" data-orig="${orig}"><span class="letter">${LETTERS[i]}</span>${esc(q.answers[orig])}</button>`).join("")}
          </div>
          <div id="fb"></div>
        </div>`;
      app.querySelectorAll(".answer").forEach(btn => btn.onclick = () => {
        const ok = Number(btn.dataset.orig) === q.correct;
        if (ok) score++;
        app.querySelectorAll(".answer").forEach(b => {
          b.disabled = true;
          if (Number(b.dataset.orig) === q.correct) b.classList.add("correct");
        });
        if (!ok) btn.classList.add("wrong");
        const guide = app.querySelector(".guide");
        guide.classList.add(ok ? "happy" : "sad");
        guide.querySelector(".speech").innerHTML = `<b>${esc(place.guide.name)}:</b> ${ok ? cheers[idx % cheers.length] + " +🪙10" : "לא נורא! התשובה הנכונה מסומנת בירוק."}`;
        const last = idx === questions.length - 1;
        document.getElementById("fb").innerHTML = `
          ${q.source ? `<div class="small muted" style="margin-top:12px">מקור: ${esc(q.source)}</div>` : ""}
          <button class="btn big-btn" id="next">${last ? "לסיום המשימה" : "לשאלה הבאה"}</button>`;
        document.getElementById("next").onclick = () => { if (last) finish(); else { idx++; show(); } };
      });
    }
    function finish() {
      const n = questions.length, ratio = score / n;
      const stars = ratio === 1 ? 3 : ratio >= .75 ? 2 : ratio >= .5 ? 1 : 0;
      const coins = score * 10 + (stars === 3 ? 20 : 0);
      const before = player.stars[place.id] || 0;
      player.coins += coins;
      if (stars > before) player.stars[place.id] = stars;
      savePlayer();
      const i = PLACES.indexOf(place);
      const unlocked = before === 0 && stars >= 1 && PLACES[i + 1];
      if (stars >= 2) confetti();
      app.innerHTML = `
        ${bubble(place, stars === 3 ? "מושלם! אתם אלופים!" : stars >= 1 ? "יפה מאוד! עברתם את התחנה." : "כמעט! צריך חצי מהתשובות נכונות כדי לעבור. נסו שוב!", stars ? "happy" : "")}
        <div class="card center result">
          <div class="result-stars">${[0, 1, 2].map(k => `<span class="${k < stars ? "on" : ""}" style="animation-delay:${k * .25}s">★</span>`).join("")}</div>
          <div class="big">${score}/${n}</div>
          <p>הרווחתם <b>🪙 ${coins}</b>${stars === 3 ? " (כולל בונוס 20 על משימה מושלמת)" : ""}</p>
          ${unlocked ? `<div class="notice ok">נפתחה תחנה חדשה: ${unlocked.icon} ${unlocked.name}!</div>` : ""}
          <div class="row center-row">
            <button class="btn gold" id="again">שוב</button>
            <a class="btn" href="#/">למפה</a>
            <a class="btn ghost" href="#/me">לחנות 🪙</a>
          </div>
        </div>`;
      document.getElementById("again").onclick = () => runMission(place, pool);
    }
    show();
  }

  // ---------- הדמות שלי וחנות ----------
  function viewMe() {
    if (!player.name) return viewOnboarding();
    setTab("me");
    const SLOTS = [["hat", "כובעים"], ["shirt", "חולצות"], ["extra", "אביזרים"]];
    const preview = (slot, it) => avatarSVG({ ...player.look, [slot]: it.id }, 60);
    app.innerHTML = `
      <div class="card center">
        <div class="avatar-stage">${avatarSVG(player.look, 120)}</div>
        <h2>${esc(player.name)}</h2>
        <div class="row center-row"><span class="pill dark">⭐ ${totalStars()} כוכבים</span><span class="pill dark">🪙 ${player.coins} מטבעות</span></div>
        <div id="shopmsg"></div>
      </div>
      ${SLOTS.map(([slot, title]) => `
        <h3 class="shop-title">${title}</h3>
        <div class="shop">
          ${ITEMS[slot].map(it => {
            const have = owns(slot, it), on = player.look[slot] === it.id;
            return `<button class="item ${on ? "on" : ""} ${have ? "" : "buy"}" data-slot="${slot}" data-id="${it.id}">
              <span class="item-prev">${preview(slot, it)}</span>
              <span class="item-name">${it.name}</span>
              <span class="item-price">${on ? "לבוש ✓" : have ? "ללבוש" : "🪙 " + it.price}</span>
            </button>`;
          }).join("")}
        </div>`).join("")}
      <div class="row center-row"><button class="btn ghost" id="redo">שינוי שם ומראה</button></div>`;

    app.querySelectorAll(".item").forEach(b => b.onclick = () => {
      const slot = b.dataset.slot, it = ITEMS[slot].find(x => x.id === b.dataset.id);
      if (!owns(slot, it)) {
        if (player.coins < it.price) {
          document.getElementById("shopmsg").innerHTML = `<div class="notice err">חסרים לכם ${it.price - player.coins} מטבעות. ענו על עוד שאלות במפה!</div>`;
          return;
        }
        player.coins -= it.price;
        player.owned.push(slot + ":" + it.id);
        confetti();
      }
      player.look[slot] = it.id;
      savePlayer(); viewMe();
    });
    document.getElementById("redo").onclick = viewOnboarding;
  }

  // ---------- טופס הצעת שאלה ----------
  function questionForm(q) {
    q = q || { place: PLACES[0].id, question: "", answers: ["", "", "", ""], correct: 0, source: "" };
    return `
      <label>לאיזה מקום במפה?</label>
      <select name="place">
        ${PLACES.map(p => `<option value="${p.id}" ${q.place === p.id ? "selected" : ""}>${p.icon} ${p.name} (${p.desc})</option>`).join("")}
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
      place: f.get("place"),
      question: f.get("question").trim(),
      answers: [0, 1, 2, 3].map(i => f.get("a" + i).trim()),
      correct: Number(f.get("correct")),
      source: (f.get("source") || "").trim(),
    };
  }

  function viewSuggest(placeId) {
    setTab("suggest");
    app.innerHTML = `
      <div class="card">
        <h2>הציעו שאלה</h2>
        <p class="muted small">השאלה תופיע במפה אחרי שמנהל יאשר אותה.</p>
        <form id="sform">
          ${questionForm(placeId ? { place: placeId, question: "", answers: ["", "", "", ""], correct: 0 } : null)}
          <label>השם שלך <span class="hint">(לא חובה)</span></label>
          <input name="author" maxlength="50" value="${esc(player.name)}">
          <button class="btn big-btn" type="submit">שליחה לאישור</button>
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
    app.innerHTML = `<p class="muted center">בודק הרשאות...</p>`;
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
    if (!list.length) { box.innerHTML = `<div class="card muted center">אין שאלות חדשות לאישור 🎉</div>`; return; }

    box.innerHTML = list.map(q => {
      const p = placeById(q.place) || { icon: "", name: q.place };
      return `
      <div class="card pending" data-id="${q.id}">
        <div><span class="chip">${p.icon} ${esc(p.name)}</span><span class="small muted">${q.author_name ? "מאת " + esc(q.author_name) : "אנונימי"}</span></div>
        <h3 style="margin-top:8px">${esc(q.question)}</h3>
        <ol>${q.answers.map((a, i) => `<li class="${i === q.correct ? "is-correct" : ""}">${esc(a)}${i === q.correct ? " ✓" : ""}</li>`).join("")}</ol>
        ${q.source ? `<div class="small muted">מקור: ${esc(q.source)}</div>` : ""}
        <div class="row">
          <button class="btn good" data-act="approve">אישור</button>
          <button class="btn ghost" data-act="edit">עריכה</button>
          <button class="btn bad" data-act="reject">דחייה</button>
        </div>
      </div>`;
    }).join("");

    box.querySelectorAll("button[data-act]").forEach(btn => btn.onclick = async () => {
      const card = btn.closest(".pending");
      const id = Number(card.dataset.id);
      const q = list.find(x => x.id === id);
      const act = btn.dataset.act;
      if (act === "edit") return editCard(card, q);
      card.querySelectorAll("button").forEach(b => b.disabled = true);
      try {
        await db.setStatus(id, act === "approve" ? "approved" : "rejected");
        card.innerHTML = `<div class="notice ${act === "approve" ? "ok" : ""}">${act === "approve" ? "השאלה אושרה ונוספה למפה" : "השאלה נדחתה"}</div>`;
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
          <button class="btn big-btn" type="submit">כניסה</button>
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
    if (page === "place" && arg) return viewPlace(arg);
    if (page === "me") return viewMe();
    if (page === "suggest") return viewSuggest(arg);
    if (page === "admin") return viewAdmin();
    return viewMap();
  }
  window.addEventListener("hashchange", route);
  renderHud();
  route();
})();
