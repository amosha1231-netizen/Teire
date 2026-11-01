(function () {
  const db = window.TeireDB;
  const cfg = window.TEIRE_CONFIG;
  const { PLACES, ITEMS, SKINS, HAIR, avatarSVG } = window.TeireWorld;
  const Parasha = window.TEIRE_PARASHA, Parashot = window.TEIRE_PARASHOT;
  const Sages = window.TeireSages, City = window.TeireCity;
  const app = document.getElementById("app");
  const placeById = id => PLACES.find(p => p.id === id);

  // ---------- מצב השחקן (נשמר בדפדפן) ----------
  const PKEY = "teire.player.v2";
  const DEFAULT_LOOK = { gender: "boy", skin: SKINS[0], hair: HAIR[0], hat: "kippah", shirt: "#3b82f6", extra: "none" };
  function loadPlayer() {
    try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; }
  }
  let player = Object.assign({ name: "", look: { ...DEFAULT_LOOK }, owned: [], coins: 0, stars: {}, souls: [], activeSoul: null, pos: null }, loadPlayer());
  // חשבון שחקן: ההתקדמות נשמרת בשרת, ורק אחרי שנטענה בהצלחה (כדי לא לדרוס אותה בטעות)
  const accountState = { user: null, loaded: false };
  let progressTimer = 0;
  function saveProgressSoon() {
    if (!db.accounts || !accountState.loaded) return;
    clearTimeout(progressTimer);
    progressTimer = setTimeout(() => db.saveProgress(player).catch(() => toast("לא הצלחנו לשמור את ההתקדמות. בדקו את החיבור")), 800);
  }
  // ---------- כמה שחקנים באותו מכשיר ----------
  // כל שחקן נשמר גם ברשימת השחקנים של המכשיר, כדי שאפשר יהיה להתנתק ולחזור אליו, או להחליף לשחקן אחר.
  const PROFILES_KEY = "teire.profiles.v1";
  function loadProfiles() {
    try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || {}; } catch (e) { return {}; }
  }
  function storeProfiles(all) {
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
  }
  const newPid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function rememberProfile() {
    if (db.accounts || !player.name) return; // בחשבונות שרת ההתקדמות נשמרת בשרת
    if (!player.pid) player.pid = newPid();
    const all = loadProfiles();
    all[player.pid] = player;
    storeProfiles(all);
  }
  function savePlayer() {
    rememberProfile();
    try { localStorage.setItem(PKEY, JSON.stringify(player)); } catch (e) { /* ignore */ }
    saveProgressSoon();
    renderHud();
    syncScore();
  }
  // טבלת האלופים: רק מי שבחר להצטרף. המזהה הסודי (secret) נשמר רק בדפדפן ומשמש לעדכון השורה שלו.
  let scoreTimer = 0;
  function syncScore() {
    if (!player.board || !player.secret) return;
    clearTimeout(scoreTimer);
    scoreTimer = setTimeout(() => db.submitScore(player.secret, player.name, totalStars(), player.souls.length), 1500);
  }
  const totalStars = () => Object.values(player.stars).reduce((a, b) => a + b, 0);
  const owns = (slot, item) => item.price === 0 || player.owned.includes(slot + ":" + item.id);
  // תחנה פתוחה אם זו הראשונה, או שבתחנה הקודמת יש לפחות כוכב אחד
  const isOpen = i => i === 0 || (PLACES[i] && PLACES[i].free) || (player.stars[PLACES[i - 1].id] || 0) >= 1 || (PLACES[i] && (player.stars[PLACES[i].id] || 0) >= 1);
  // שלבים: שלב 1 שומר כוכבים תחת שם המקום, שלבים גבוהים תחת "מקום@שלב"
  const LEVEL_MAX = 8;
  const LEVEL_NAMES = ["", "שלב 1: קל", "שלב 2: בינוני", "שלב 3: קשה", "שלב 4: מאתגר", "שלב 5: מתקדם", "שלב 6: למתקדמים", "שלב 7: קשה מאוד", "שלב 8: ממש קשה"];
  const LEVEL_REWARD = [0, 10, 15, 25, 35, 50, 70, 90, 120];
  const starKey = (placeId, lvl) => lvl > 1 ? placeId + "@" + lvl : placeId;
  const levelStars = (placeId, lvl) => player.stars[starKey(placeId, lvl)] || 0;
  const bankFor = (placeId, lvl) => ((window.TEIRE_LEVELS || {})[placeId] || {})[lvl] || [];

  function renderHud() {
    document.getElementById("hud").innerHTML = player.name ? `
      <span class="pill">🕯️ ${player.souls.length}</span>
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
  // שחקן חדש: הכול במסך אחד. מראה, שם, סוג טלפון ובחירת משחק ראשון (קל, בינוני או קשה).
  // המרוץ הבינוני מסומן מראש כמומלץ. אחרי "יוצאים לדרך" נכנסים ישר למשחק שבחרו.
  function viewOnboarding() {
    setTab("map");
    const look = { ...player.look };
    const isNew = !player.name;
    let typed = player.name, dev = player.device || "", pick = 1, tried = false;
    function draw() {
      app.innerHTML = `
        <div class="card center onb">
          <h1>${isNew ? "ברוכים הבאים למסע!" : "שינוי שם ומראה"}</h1>
          ${isNew ? `<p class="muted">יוצרים דמות, ויוצאים לשחק</p>` : ""}
          <div class="avatar-stage">${avatarSVG(look, 110)}</div>
          <div class="seg">
            <button class="${look.gender === "boy" ? "on" : ""}" data-g="boy">בן</button>
            <button class="${look.gender === "girl" ? "on" : ""}" data-g="girl">בת</button>
          </div>
          <div class="swatches">${SKINS.map(c => `<button class="sw ${look.skin === c ? "on" : ""}" data-skin="${c}" style="background:${c}" aria-label="צבע עור"></button>`).join("")}</div>
          <div class="swatches">${HAIR.map(c => `<button class="sw ${look.hair === c ? "on" : ""}" data-hair="${c}" style="background:${c}" aria-label="צבע שיער"></button>`).join("")}</div>
          <h3 class="onb-q">1. איך קוראים לך?</h3>
          <input id="pname" class="${tried && !typed.trim() ? "need" : ""}" placeholder="השם שלך" maxlength="20" value="${esc(typed)}">
          ${isNew ? `
          <h3 class="onb-q">2. איזה טלפון יש לך?</h3>
          <div class="device-pick ${tried && !dev ? "need" : ""}">${DEVICES.map(d => `<button class="device-btn ${dev === d.id ? "on" : ""}" data-dev="${d.id}"><span>${d.icon}</span>${d.name}</button>`).join("")}</div>
          <h3 class="onb-q">3. במה מתחילים?</h3>
          <div class="level-pick">${JOURNEY.map((s, i) => `
            <button class="level-btn ${s.cls} ${pick === i ? "on" : ""}" data-pick="${i}">
              ${i === 1 ? `<span class="rec">⭐ מומלץ</span>` : ""}
              <span class="lv-icon">${s.icon}</span>
              <span class="jtag ${s.cls}">${s.tag}</span>
              <b>${s.title}</b>
            </button>`).join("")}</div>
          <p class="small muted">${esc(JOURNEY[pick].desc)}</p>
          <p class="small muted">שומרים רק את השם ואת סוג הטלפון, כדי לדעת איזו אפליקציה להכין.</p>` : ""}
          <button class="btn gold big-btn" id="go">${isNew ? "יוצאים לדרך!" : "שמירה"}</button>
          ${isNew && hasProfiles() ? `<div><a class="link-btn" href="#/players" id="to-players">חזרה לבחירת שחקן</a></div>` : ""}
        </div>`;
      const tp = document.getElementById("to-players");
      if (tp) tp.onclick = () => { creatingNew = false; };
      const nameEl = document.getElementById("pname");
      nameEl.oninput = () => { typed = nameEl.value; };
      app.querySelectorAll("[data-g]").forEach(b => b.onclick = () => {
        look.gender = b.dataset.g;
        look.hat = look.gender === "girl" ? "none" : "kippah";
        draw();
      });
      app.querySelectorAll("[data-skin]").forEach(b => b.onclick = () => { look.skin = b.dataset.skin; draw(); });
      app.querySelectorAll("[data-hair]").forEach(b => b.onclick = () => { look.hair = b.dataset.hair; draw(); });
      app.querySelectorAll("[data-dev]").forEach(b => b.onclick = () => { dev = b.dataset.dev; draw(); });
      app.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { pick = Number(b.dataset.pick); draw(); });
      document.getElementById("go").onclick = () => {
        const name = typed.trim();
        if (!name || (isNew && !dev)) {
          tried = true; draw();
          const miss = !name ? document.getElementById("pname") : app.querySelector(".device-pick");
          if (miss) { miss.scrollIntoView({ block: "center", behavior: "smooth" }); if (!name) miss.focus(); }
          toast(!name ? "מה השם שלך?" : "איזה טלפון יש לך?");
          return;
        }
        player.name = name; player.look = look;
        if (!isNew) { savePlayer(); location.hash = "#/"; return void viewCity(); }
        player.device = dev; player.tester = false;
        player.pid = newPid(); player.lastPlayed = Date.now(); creatingNew = false;
        player.tour = 0; // אחרי המשחק הראשון, כשחוזרים למפה, מתחילה ההדרכה
        player.journey = { step: pick, start: pick }; // המסע מתחיל מהמשחק שבחרו וממשיך משם לקשה יותר
        weeklyLater(); // שאלת השבוע תוצע רק מהכניסה הבאה
        savePlayer(); sendDevice();
        startJourneyStop(pick);
      };
    }
    draw();
  }

  // ---------- מסע הפתיחה לשחקן חדש ----------
  // ביצירת הדמות בוחרים במה מתחילים (קל, בינוני או קשה), והמסע ממשיך משם אל הקשה, ובסוף תיבת אוצר.
  // התחנות הן ההיכלות הקיימים (אוהל אברהם, מרוץ המקורות, מסע בגמרא), לא מערכת נפרדת.
  const DEVICES = [
    { id: "android", icon: "🤖", name: "אנדרואיד" },
    { id: "iphone", icon: "🍎", name: "אייפון" },
    { id: "computer", icon: "💻", name: "רק מחשב" },
  ];
  const deviceName = id => (DEVICES.find(d => d.id === id) || { name: "לא נבחר" }).name;
  const JOURNEY = [
    { kind: "place", place: "ohel", level: 1, tag: "קל", cls: "easy", icon: "⛺", title: "היכל השאלות הנחמדות", where: "אוהל אברהם, עם גמלי",
      desc: "שאלות נחמדות על אברהם, יצחק ויעקב. למשל: מי היה הנכד של אברהם אבינו?", pass: "כוכב אחד (חצי מהתשובות נכונות)" },
    { kind: "race", need: 3, tag: "בינוני", cls: "mid", icon: "🏎️", title: "מרוץ המקורות", where: "קריית התורה",
      desc: "נוהגים בכביש! לכל משפט יש שני מקורות, ועוברים לנתיב של המקור הנכון לפני השער.", pass: "לעבור 3 שערים" },
    { kind: "place", place: "gemara", level: 2, tag: "קשה", cls: "hard", icon: "📖", title: "האתגר של פומבדיתא", where: "מסע בגמרא, עם נמלי",
      desc: "שאלות קשות יותר על סיפורי הגמרא ועל החכמים. מי שעובר כאן, הוא כבר תלמיד חכם קטן!", pass: "כוכב אחד (חצי מהתשובות נכונות)" },
  ];
  const JOURNEY_PRIZE = 100;
  const journeyOn = () => !!(player.journey && !player.journey.done);
  function ensureSecret() {
    if (player.secret) return;
    const a = new Uint8Array(16); crypto.getRandomValues(a);
    player.secret = Array.from(a, x => x.toString(16).padStart(2, "0")).join("");
  }
  // שולחים לשרת רק שם, סוג טלפון והאם מוכנים לעזור בבדיקה. אם הטבלה עוד לא קיימת (update-9.sql), שומרים רק בדפדפן.
  function sendDevice() {
    if (!player.device) return;
    ensureSecret(); savePlayer();
    db.saveDevice(player.secret, player.name, player.device, !!player.tester).catch(() => { /* הטבלה עוד לא קיימת */ });
  }

  // באיזה טלפון אתם משתמשים? (start = חלק מההרשמה של שחקן חדש)
  function viewDevice(arg) {
    if (!player.name) return viewOnboarding();
    const start = arg === "start";
    setTab(start ? "map" : "me");
    let sel = player.device || "", tester = !!player.tester;
    function draw() {
      app.innerHTML = `
        <div class="card center">
          <div class="avatar-stage">${avatarSVG(player.look, 96)}</div>
          <h1>שלום ${esc(player.name)}! 👋</h1>
          <p>שאלה קטנה לפני שיוצאים לדרך: <b>באיזה טלפון אתם משתמשים?</b></p>
          <div class="device-pick">${DEVICES.map(d => `<button class="device-btn ${sel === d.id ? "on" : ""}" data-dev="${d.id}"><span>${d.icon}</span>${d.name}</button>`).join("")}</div>
          ${sel === "android" ? `<label class="tester-box"><input type="checkbox" id="tester" ${tester ? "checked" : ""}> 🛠️ אשמח לעזור לבדוק את האפליקציה לאנדרואיד לפני שהיא יוצאת לחנות</label>` : ""}
          <p class="small muted">אנחנו שומרים רק את השם שבחרתם ואת סוג הטלפון, כדי לדעת איזו אפליקציה להכין.</p>
          <button class="btn big-btn" id="go" ${sel ? "" : "disabled"}>${start ? "ממשיכים ➜" : "שמירה"}</button>
          ${start ? `<div><button class="link-btn" id="skip">אחר כך</button></div>` : ""}
        </div>`;
      app.querySelectorAll("[data-dev]").forEach(b => b.onclick = () => { sel = b.dataset.dev; const t = document.getElementById("tester"); if (t) tester = t.checked; draw(); });
      const t = document.getElementById("tester");
      if (t) t.onchange = () => { tester = t.checked; };
      document.getElementById("go").onclick = () => {
        if (!sel) return;
        player.device = sel; player.tester = sel === "android" && tester;
        savePlayer(); sendDevice();
        if (start) location.hash = journeyOn() ? "#/journey" : "#/";
        else { toast("נשמר! תודה 🙏"); location.hash = "#/me"; }
      };
      const sk = document.getElementById("skip");
      if (sk) sk.onclick = () => { location.hash = journeyOn() ? "#/journey" : "#/"; };
    }
    draw();
  }

  function viewJourney(arg) {
    if (!player.name) return viewOnboarding();
    setTab("map");
    if (!player.journey) { player.journey = { step: 0 }; savePlayer(); } // שחקן ותיק שנכנס למסע מהמפה
    const J = player.journey;
    if (arg === "skip" && journeyOn()) { advanceJourney(); return void (location.hash = "#/journey"); } // דילוג על תחנה אחרי ניסיון
    if (arg === "leave") { J.done = true; J.left = true; savePlayer(); return void (location.hash = "#/"); }
    const fresh = J.done && !J.left && !J.seenPrize;
    if (fresh) { J.seenPrize = true; savePlayer(); setTimeout(confetti, 200); }
    // תחנות לפני המשחק שבחרו בהתחלה לא נחשבות "עברתם", אבל פתוחות למי שרוצה לנסות
    const state = i => i < (J.start || 0) ? "open" : J.done || i < J.step ? "done" : i === J.step ? "now" : "next";
    app.innerHTML = `
      <div class="place-hero journey-hero" style="--c:#2b4c8c">
        <div class="place-icon">🧭</div>
        <h1>מסע הפתיחה</h1>
        <p>שלוש תחנות, מהקל אל הקשה. בסוף מחכה לכם תיבת אוצר!</p>
      </div>
      <div class="jpath">
        ${JOURNEY.map((s, i) => `
          <div class="jstop ${state(i)}">
            <div class="jdot">${state(i) === "done" ? "✓" : s.icon}</div>
            <div class="card jbody">
              <div class="jhead"><span class="jtag ${s.cls}">${s.tag}</span><span class="small muted">${s.where}</span></div>
              <h3>${i + 1}. ${s.title}</h3>
              <p class="small">${s.desc}</p>
              <div class="small muted">🎯 כדי לעבור: ${s.pass}</div>
              ${state(i) === "now" ? `<button class="btn gold big-btn" data-go="${i}">${i === (J.start || 0) ? "יוצאים לדרך!" : "לתחנה הבאה!"}</button>`
                : state(i) === "done" ? `<button class="btn ghost small-btn" data-go="${i}">לשחק שוב</button>`
                : state(i) === "open" ? `<button class="btn ghost small-btn" data-go="${i}">לנסות גם כאן</button>` : `<div class="small">🔒 נפתח אחרי התחנה הקודמת</div>`}
            </div>
          </div>`).join("")}
        <div class="jstop prize ${J.done && !J.left ? "done" : "next"}">
          <div class="jdot">🎁</div>
          <div class="card jbody center">
            ${J.done && !J.left ? `<h3>פתחתם את תיבת האוצר!</h3><p>קיבלתם <b>🪙 ${JOURNEY_PRIZE}</b>. עכשיו כל המפה שלכם.</p><a class="btn" href="#/me">לחנות הדמויות</a>`
              : `<h3>תיבת האוצר</h3><p class="small">🪙 ${JOURNEY_PRIZE} מטבעות לחנות הדמויות</p>`}
          </div>
        </div>
      </div>
      <div class="row center-row">
        ${journeyOn() ? `<a class="link-btn" href="#/journey/leave">לדלג על המסע וללכת למפה</a>` : `<a class="btn" href="#/">למפה הגדולה 🗺️</a>`}
      </div>`;
    app.querySelectorAll("[data-go]").forEach(b => b.onclick = () => startJourneyStop(Number(b.dataset.go)));
  }

  async function startJourneyStop(i) {
    const s = JOURNEY[i];
    if (s.kind === "race") {
      location.hash = "#/race";
      setTimeout(() => toast(`🎯 מסע הפתיחה: עברו ${s.need} שערים כדי להמשיך`), 300);
      return;
    }
    const place = placeById(s.place);
    app.innerHTML = `<p class="muted center">טוען...</p>`;
    let dbPool = [];
    try { dbPool = await db.approved(s.place); } catch (e) { /* משחקים עם השאלות המובנות */ }
    const pool = dbPool.filter(q => (q.level || 1) === s.level).concat(bankFor(s.place, s.level));
    runMission(place, pool, s.level, "#/journey");
  }

  function advanceJourney() {
    const J = player.journey;
    J.step++;
    if (J.step >= JOURNEY.length) { J.done = true; player.coins += JOURNEY_PRIZE; }
    savePlayer();
  }
  // מוצג בסוף משימה או מרוץ. אם זו התחנה הנוכחית במסע: עוברים לתחנה הבאה, או מציעים לנסות שוב.
  function journeyAfter(match, passed) {
    if (!journeyOn()) return "";
    const i = player.journey.step, s = JOURNEY[i];
    if (!match(s)) return "";
    if (!passed) return `
      <div class="card center journey-next">
        <p>🧭 <b>מסע הפתיחה:</b> כדי לעבור את התחנה צריך ${s.pass}. כמעט! נסו שוב.</p>
        <div class="row center-row"><a class="btn ghost small-btn" href="#/journey">חזרה למסע</a><a class="link-btn" href="#/journey/skip">לדלג לתחנה הבאה</a></div>
      </div>`;
    advanceJourney();
    const nx = JOURNEY[i + 1];
    return `
      <div class="card center journey-next ok">
        <p>🧭 <b>עברתם את תחנה ${i + 1} במסע!</b> ${nx ? `התחנה הבאה: ${nx.icon} ${nx.title} <span class="jtag ${nx.cls}">${nx.tag}</span>` : "סיימתם את כל המסע 🎉"}</p>
        <a class="btn gold big-btn" href="#/journey">${nx ? "ממשיכים במסע ➜" : "🎁 לפתוח את תיבת האוצר"}</a>
      </div>`;
  }
  // ---------- חשבון שחקן ----------
  // שחקן חדש מתחיל מהתחלה. ההתקדמות של מי שנכנס נטענת מהשרת בלבד, ולא מהדפדפן.
  const freshPlayer = () => ({ name: "", look: { ...DEFAULT_LOOK }, owned: [], coins: 0, stars: {}, souls: [], activeSoul: null, pos: null });
  async function loadAccountProgress() {
    const data = await db.loadProgress();
    player = data ? Object.assign(freshPlayer(), data) : freshPlayer();
    try { localStorage.setItem(PKEY, JSON.stringify(player)); } catch (e) { /* ignore */ }
    accountState.loaded = true;
    if (!data) await db.saveProgress(player);
  }
  async function startAccount() {
    if (!db.accounts) return;
    try {
      accountState.user = await db.currentUser();
      if (accountState.user) await loadAccountProgress();
    } catch (e) {
      accountState.loaded = false;
      toast("לא הצלחנו לטעון את ההתקדמות שלכם. נסו לרענן את העמוד");
    }
  }
  function viewAccount(mode = "login", msg = "") {
    setTab("map");
    app.innerHTML = `
      <div class="card center">
        <h1>מסע בתורה</h1>
        <p class="muted">${mode === "signup" ? "פתחו חשבון חדש. ההתקדמות שלכם תישמר, וכך תוכלו לשחק מכל מכשיר." : "היכנסו לחשבון שלכם כדי להמשיך מאיפה שעצרתם."}</p>
        <div class="seg">
          <button class="${mode === "login" ? "on" : ""}" data-m="login">כניסה</button>
          <button class="${mode === "signup" ? "on" : ""}" data-m="signup">הרשמה</button>
        </div>
        <input id="uname" placeholder="שם משתמש (אנגלית, ספרות או _)" maxlength="20" autocomplete="username" autocapitalize="off">
        <input id="upw" type="password" placeholder="סיסמה (לפחות 6 תווים)" maxlength="72" autocomplete="${mode === "signup" ? "new-password" : "current-password"}">
        <button class="btn big-btn" id="acc-go">${mode === "signup" ? "פותחים חשבון" : "נכנסים"}</button>
        <div id="accmsg" style="margin-top:12px">${msg}</div>
      </div>`;
    app.querySelectorAll("[data-m]").forEach(b => b.onclick = () => viewAccount(b.dataset.m));
    const go = document.getElementById("acc-go");
    go.onclick = async () => {
      const u = document.getElementById("uname").value, pw = document.getElementById("upw").value;
      go.disabled = true;
      try {
        if (mode === "signup") await db.signUp(u, pw); else await db.signIn(u, pw);
        accountState.user = await db.currentUser();
        await loadAccountProgress();
        location.hash = "#/";
        route();
      } catch (e) {
        go.disabled = false;
        document.getElementById("accmsg").innerHTML = errorBox(e);
      }
    };
  }
  // ---------- בחירת שחקן (התנתקות והחלפת שחקן במכשיר) ----------
  const hasProfiles = () => Object.keys(loadProfiles()).length > 0;
  let creatingNew = false; // לחצו "שחקן חדש": מראים את יצירת הדמות ולא את בחירת השחקן
  function setPlayer(p) {
    player = Object.assign(freshPlayer(), p);
    try { localStorage.setItem(PKEY, JSON.stringify(player)); } catch (e) { /* ignore */ }
    renderHud();
  }
  // התנתקות: השחקן נשמר במכשיר, ועוברים למסך בחירת השחקן
  function signOutLocal() {
    if (player.name) rememberProfile();
    setPlayer({});
    try { localStorage.removeItem(PKEY); } catch (e) { /* ignore */ }
    renderHud();
    location.hash = "#/players";
    route();
  }
  function viewPlayers() {
    setTab("me");
    document.body.classList.add("no-player");
    const all = Object.values(loadProfiles()).sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
    let removing = null;
    function draw() {
      app.innerHTML = `
        <div class="card center players-card">
          <div class="players-logo">📜</div>
          <h1>מי משחק עכשיו?</h1>
          <p class="muted">${all.length ? "בחרו את השחקן שלכם, או צרו שחקן חדש" : "עוד אין שחקנים במכשיר הזה"}</p>
          <div class="players-list">
            ${all.map(p => `
              <div class="player-row ${player.pid === p.pid ? "on" : ""}">
                <button class="player-pick" data-pid="${esc(p.pid)}">
                  <span class="player-av">${avatarSVG(p.look || DEFAULT_LOOK, 54)}</span>
                  <span class="player-info"><b>${esc(p.name)}</b>
                    <span class="small muted">⭐ ${Object.values(p.stars || {}).reduce((a, b) => a + b, 0)} · 🪙 ${p.coins || 0} · 🕯️ ${(p.souls || []).length}</span></span>
                  <span class="player-go">${removing === p.pid ? "" : "◀"}</span>
                </button>
                ${removing === p.pid
                  ? `<div class="player-del-ask"><span class="small">למחוק את ${esc(p.name)} מהמכשיר?</span><button class="btn bad small-btn" data-del-yes="${esc(p.pid)}">מחיקה</button><button class="btn ghost small-btn" data-del-no>ביטול</button></div>`
                  : `<button class="player-del" data-del="${esc(p.pid)}" aria-label="מחיקת ${esc(p.name)}">🗑️</button>`}
              </div>`).join("")}
          </div>
          <button class="btn gold big-btn" id="newp">➕ שחקן חדש</button>
          ${db.accounts ? "" : `<p class="small muted">השחקנים נשמרים במכשיר הזה. כל שחקן ממשיך מאיפה שעצר.</p>`}
        </div>`;
      app.querySelectorAll("[data-pid]").forEach(b => b.onclick = () => {
        const p = loadProfiles()[b.dataset.pid];
        if (!p) return;
        document.body.classList.remove("no-player");
        setPlayer(p); player.lastPlayed = Date.now(); savePlayer();
        toast(`שלום ${player.name}! 👋`);
        location.hash = "#/"; route();
      });
      app.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { removing = b.dataset.del; draw(); });
      app.querySelectorAll("[data-del-no]").forEach(b => b.onclick = () => { removing = null; draw(); });
      app.querySelectorAll("[data-del-yes]").forEach(b => b.onclick = () => {
        const all2 = loadProfiles(); delete all2[b.dataset.delYes]; storeProfiles(all2);
        const i = all.findIndex(p => p.pid === b.dataset.delYes); if (i >= 0) all.splice(i, 1);
        removing = null; draw();
      });
      document.getElementById("newp").onclick = () => {
        document.body.classList.remove("no-player");
        setPlayer({}); creatingNew = true;
        if ((location.hash || "#/") === "#/") viewOnboarding(); else location.hash = "#/";
      };
    }
    draw();
  }

  async function logoutPlayer() {
    try { await db.signOutPlayer(); } catch (e) { /* ignore */ }
    accountState.user = null; accountState.loaded = false;
    clearTimeout(progressTimer);
    player = freshPlayer();
    try { localStorage.removeItem(PKEY); } catch (e) { /* ignore */ }
    location.hash = "#/";
    route();
  }

  // ---------- התפריט (☰ בסרגל העליון) ----------
  // כל הקישורים שלא צריכים להיות על המפה: הנשמה, מסע הפתיחה, טבלת האלופים, היכל עלמא, הטלפון, החלפת שחקן
  function closeMenu() {
    document.querySelectorAll(".menu-wrap").forEach(e => e.remove());
    document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
  }
  function openMenu() {
    if (document.querySelector(".menu-wrap")) return closeMenu();
    if (!player.name) return;
    const soul = player.activeSoul && Sages.byId(player.activeSoul);
    const J = player.journey;
    const items = [
      ["#/souls", "🕯️", soul ? `נשמת ${soul.name}` : "היכל הנשמות", `${player.souls.length}/${Sages.SAGES.length} נשמות`],
      ["#/journey", "🧭", "מסע הפתיחה", journeyOn() ? `תחנה ${Math.min(J.step, JOURNEY.length - 1) + 1}/${JOURNEY.length}` : J && J.done ? "הושלם ✓" : ""],
      ["#/leaders", "🏆", "טבלת האלופים", ""],
      ["#/olama", "🌐", "היכל עלמא", "משחק חי עם כל החדר"],
      ["#/device", "📱", "באיזה טלפון אתם משחקים?", deviceName(player.device)],
      ["#/review", "📋", "כל השאלות והמקורות", ""],
      ["tour", "🎓", "הדרכה למתחילים", "לראות שוב איך משחקים"],
    ];
    const wrap = document.createElement("div");
    wrap.className = "menu-wrap";
    wrap.innerHTML = `
      <aside class="menu-sheet" role="dialog" aria-label="תפריט">
        <div class="menu-me">
          <span class="menu-av">${avatarSVG(player.look, 58)}</span>
          <div><b>${esc(player.name)}</b>
            <div class="small">${db.accounts && accountState.user ? "שם משתמש: " + esc(accountState.user.username) : `⭐ ${totalStars()} · 🪙 ${player.coins}`}</div></div>
          <button class="menu-x" aria-label="סגירה">✕</button>
        </div>
        <nav class="menu-list">
          ${items.map(([href, icon, title, sub]) => `
            <a class="menu-item" href="${href === "tour" ? "#/" : href}" ${href === "tour" ? `data-tour="1"` : ""}>
              <span class="menu-ic">${icon}</span><span class="menu-t">${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ""}</span><span class="menu-arrow">‹</span>
            </a>`).join("")}
        </nav>
        <div class="menu-foot">
          <button class="btn ghost" id="m-out">🚪 התנתקות / החלפת שחקן</button>
        </div>
      </aside>`;
    wrap.onclick = ev => { if (ev.target === wrap || ev.target.closest(".menu-x")) closeMenu(); };
    wrap.querySelectorAll(".menu-item").forEach(a => a.addEventListener("click", () => {
      const tour = a.dataset.tour;
      closeMenu();
      if (tour) { player.tour = 0; savePlayer(); if ((location.hash || "#/") === "#/") setTimeout(startTour, 50); }
    }));
    wrap.querySelector("#m-out").onclick = () => { closeMenu(); if (db.accounts) logoutPlayer(); else signOutLocal(); };
    document.body.appendChild(wrap);
    document.getElementById("menuBtn").setAttribute("aria-expanded", "true");
  }
  document.getElementById("menuBtn").onclick = openMenu;

  // ---------- הדרכה לשחקן חדש ----------
  // כמו במשחקים: אחרי המשחק הראשון, דמות מלווה מראה על המסך מה כל דבר עושה, צעד אחרי צעד.
  // player.tour = מספר הצעד (מתחיל ב-0 אצל שחקן חדש), ו-"done" כשסיימו. לשחקנים ותיקים אין הדרכה.
  const TOUR_GIFT = 20;
  const TOUR = [
    { sel: null, text: n => `שלום ${n}! אני ינשופי 🦉 ואני אלווה אותך בצעדים הראשונים. זה ייקח רק רגע.` },
    { sel: "#me", text: (n, girl) => `${girl ? "זאת את" : "זה אתה"}! הדמות שלך הולכת במפה של ארץ ישראל, מעיר לעיר.` },
    { sel: ".bld[data-b='jerusalem']", text: () => "כל בית במפה הוא מקום עם משימות. מקישים על מקום, הדמות הולכת אליו, ונכנסים לשחק." },
    { sel: "#hud", text: () => "כאן רואים מה אספת: 🕯️ נשמות של חכמים, ⭐ כוכבים על משימות, ו-🪙 מטבעות שקונים בהם בגדים לדמות." },
    { sel: ".bottomnav", text: () => "בתפריט התחתון: המפה, הנשמות שאספת, הדמות והחנות, ותיבה להציע שאלה משלך." },
    { sel: "#menuBtn", text: () => "וכאן התפריט: טבלת האלופים, היכל עלמא, מסע הפתיחה, וגם החלפת שחקן או התנתקות." },
    { sel: null, text: (n, girl) => `זהו, ${girl ? "את מוכנה" : "אתה מוכן"}! הנה מתנה לדרך: ${TOUR_GIFT} מטבעות 🪙. בהצלחה במסע!`, last: true },
  ];
  function startTour() {
    document.querySelectorAll(".tour").forEach(e => e.remove());
    if (typeof player.tour !== "number" || !document.getElementById("city")) return;
    const step = TOUR[player.tour];
    if (!step) { player.tour = "done"; savePlayer(); return; }
    const target = step.sel && document.querySelector(step.sel);
    const box = document.createElement("div");
    box.className = "tour";
    box.innerHTML = `
      <div class="tour-hole"></div>
      <div class="tour-card" role="dialog" aria-label="הדרכה">
        <div class="tour-guide">🦉</div>
        <div class="tour-body">
          <p>${esc(step.text(player.name, player.look && player.look.gender === "girl"))}</p>
          <div class="tour-row">
            <span class="tour-dots">${TOUR.map((_, i) => `<i class="${i === player.tour ? "on" : i < player.tour ? "done" : ""}"></i>`).join("")}</span>
            ${step.last ? "" : `<button class="link-btn" id="tour-skip">דילוג</button>`}
            <button class="btn gold small-btn" id="tour-next">${step.last ? "יוצאים לדרך! 🎁" : player.tour === 0 ? "בואו נתחיל" : "הבא ➜"}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(box);
    const hole = box.querySelector(".tour-hole"), card = box.querySelector(".tour-card");
    const r = target && target.getBoundingClientRect();
    if (r && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth) {
      const pad = 8;
      Object.assign(hole.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px" });
      // הכרטיס בצד השני של המסך מהדבר שמסמנים
      card.classList.add(r.top + r.height / 2 > innerHeight / 2 ? "at-top" : "at-bottom");
    } else {
      hole.classList.add("none");
      card.classList.add("at-middle");
    }
    const finish = gift => {
      box.remove();
      player.tour = "done";
      if (gift) { player.coins += TOUR_GIFT; confetti(); toast(`🪙 +${TOUR_GIFT} מטבעות!`); }
      savePlayer();
    };
    box.querySelector("#tour-next").onclick = () => {
      if (step.last) return finish(true);
      player.tour++; savePlayer(); startTour();
    };
    const sk = box.querySelector("#tour-skip");
    if (sk) sk.onclick = () => finish(false);
  }

  // ---------- שאלת השבוע ----------
  // פעם בשבוע, כשנכנסים למפה, קופצת הצעה לענות על שאלת השבוע מהיכל הפרשה. לא בכניסה הראשונה.
  const weekNo = () => Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
  function weeklyQuestion() {
    const all = (Parasha.COMMENTATORS || []).flatMap(c => [1, 2, 3, 4, 5, 6, 7, 8].flatMap(l => (((window.TEIRE_LEVELS || {})["parasha-" + c.id] || {})[l] || []).map(q => ({ ...q, commentator: c }))));
    if (!all.length) return null;
    return all[weekNo() % all.length];
  }
  // שחקן חדש: השבוע הזה כבר נחשב "הוצע", כך שההצעה הראשונה תגיע בשבוע הבא
  function weeklyLater() { player.weeklySeen = weekNo(); }
  function offerWeekly() {
    if (player.weeklySeen === weekNo() || document.querySelector(".weekly-pop, .tour")) return;
    const q = weeklyQuestion();
    if (!q || !document.getElementById("city")) return;
    player.weeklySeen = weekNo(); savePlayer();
    const pop = document.createElement("div");
    pop.className = "weekly-pop";
    pop.innerHTML = `
      <div class="card center weekly-card" role="dialog" aria-label="שאלת השבוע">
        <div class="weekly-tag">📜 שאלת השבוע · ${esc(Parasha.current.name || "")}</div>
        <div class="qtext">${esc(q.question)}</div>
        <a class="btn gold big-btn" href="#/place/parasha-${q.commentator.id}">לענות עכשיו</a>
        <div><button class="link-btn" id="wk-later">בפעם אחרת</button></div>
      </div>`;
    const close = () => pop.remove();
    pop.querySelector("a").onclick = close;
    pop.querySelector("#wk-later").onclick = close;
    pop.onclick = ev => { if (ev.target === pop) close(); };
    document.body.appendChild(pop);
  }

  // ---------- העיר ----------
  let cityLoop = null, townPeers = null;
  function stopCity() {
    if (townPeers) { townPeers.leave(); townPeers = null; }
    if (cityLoop) { cancelAnimationFrame(cityLoop.raf); window.removeEventListener("keydown", cityLoop.onKey); window.removeEventListener("keyup", cityLoop.onKey); cityLoop = null; }
    document.body.classList.remove("in-city");
  }

  // מידע על מקום במפה: האם פתוח, כמה כוכבים ולאן נכנסים
  function locInfo(L) {
    const t = L.torah && placeById(L.torah);
    if (t && t.soon) return { name: L.name, icon: L.icon, color: L.color, open: false, soon: true, stars: 0, href: "#/" };
    const torahOpen = !t || isOpen(PLACES.indexOf(t));
    const hasSages = Sages.SAGES.some(s => s.building === L.id);
    return {
      name: L.name, icon: L.icon, color: L.color,
      open: torahOpen || hasSages || L.duel || !!Towns.byId(L.id), // לעיר עם עולם פנימי תמיד אפשר להיכנס
      stars: t ? player.stars[t.id] || 0 : 0,
      href: L.href || (Towns.byId(L.id) ? "#/town/" + L.id : "#/b/" + L.id),
    };
  }
  const locOfTorah = placeId => City.LOCATIONS.find(L => L.torah === placeId);
  // לאן חוזרים מעמוד של מקום: לעולם של העיר אם יש לה, אחרת לעמוד המקום או למפה
  const backOf = bid => !bid ? "#/" : Towns.byId(bid) ? "#/town/" + bid : "#/b/" + bid;

  function viewCity() {
    if (!player.name) return viewOnboarding();
    setTab("map");
    document.body.classList.add("in-city");
    const { W, H, LAND, SINAI, BAVEL, EUROPE, MIZRACH, LOCATIONS, LABELS, START } = City;
    const soul = player.activeSoul && Sages.byId(player.activeSoul);
    const pos = Object.assign({}, player.pos || START);
    const pts = arr => arr.map(p => p.join(",")).join(" ");

    app.innerHTML = `
      <div class="city" id="city">
        <div class="world" id="world" style="width:${W}px;height:${H}px">
          <svg class="map-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
            <defs>
              <linearGradient id="landg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#6cc25a"/><stop offset=".45" stop-color="#9fd266"/>
                <stop offset=".62" stop-color="#e3cf7a"/><stop offset="1" stop-color="#e7a85a"/>
              </linearGradient>
              <radialGradient id="seag" cx=".45" cy=".5" r=".75">
                <stop offset="0" stop-color="#47b3ea"/><stop offset=".6" stop-color="#2f8fd6"/><stop offset="1" stop-color="#1d63b0"/>
              </radialGradient>
              <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".1"/>
              </linearGradient>
              <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>
              <pattern id="waves" width="80" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 20 q10 -8 20 0 t20 0" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="3" stroke-linecap="round"/>
              </pattern>
              <pattern id="grass" width="46" height="38" patternUnits="userSpaceOnUse">
                <path d="M8 30 l3 -7 l3 7 M30 12 l2.5 -6 l2.5 6" fill="none" stroke="rgba(40,90,20,.1)" stroke-width="2" stroke-linecap="round"/>
              </pattern>
            </defs>
            <rect width="${W}" height="${H}" fill="url(#seag)"/>
            <rect width="${W}" height="${H}" fill="url(#waves)" class="waves"/>
            ${mapScenery.back(pts)}
            ${[LAND, SINAI, BAVEL, EUROPE, MIZRACH].map(shape => `<polygon points="${pts(shape)}" fill="#f5dc8c" stroke="#f5dc8c" stroke-width="34" stroke-linejoin="round"/>`).join("")}
            <polygon points="${pts(LAND)}" fill="url(#landg)" stroke="#8fbf5a" stroke-width="4" stroke-linejoin="round"/>
            <polygon points="${pts(LAND)}" fill="url(#grass)"/>
            <polygon points="${pts(LAND)}" fill="url(#sun)"/>
            <polygon points="${pts(SINAI)}" fill="#e9b468" stroke="#d39a4a" stroke-width="4" stroke-linejoin="round"/>
            <polygon points="${pts(BAVEL)}" fill="#e8c27a" stroke="#c99a50" stroke-width="4" stroke-linejoin="round"/>
            <polygon points="${pts(EUROPE)}" fill="#9ccf7a" stroke="#6fa34f" stroke-width="4" stroke-linejoin="round"/>
            <polygon points="${pts(MIZRACH)}" fill="#ecc98a" stroke="#c99a50" stroke-width="4" stroke-linejoin="round"/>
            <path d="M712 432 C 725 600, 705 800, 722 1000 S 712 1080, 706 1110" fill="none" stroke="#3fa0e0" stroke-width="9" stroke-linecap="round"/>
            <ellipse cx="712" cy="395" rx="28" ry="42" fill="#3fa0e0" stroke="#f5dc8c" stroke-width="6"/>
            <ellipse cx="706" cy="1215" rx="24" ry="100" fill="#4fb3d9" stroke="#f5dc8c" stroke-width="6"/>
            <path d="M840 600 C 860 760, 850 900, 870 1060" fill="none" stroke="#3fa0e0" stroke-width="7" stroke-linecap="round" opacity=".8"/>
            <path d="M560 1060 L 520 1060" stroke="#c9a46a" stroke-width="0"/>
            ${mapScenery.front()}
          </svg>
          ${mapScenery.cloudShadows()}
          ${LABELS.map(l => `<span class="map-label ${l.cls}" style="left:${l.x}px;top:${l.y}px">${l.text}</span>`).join("")}
          ${mapDecorations()}
          ${LOCATIONS.map(L => {
            const info = locInfo(L);
            const sages = Sages.SAGES.filter(s => s.building === L.id);
            return `<button class="bld ${info.open ? "" : "locked"} ${L.duel ? "arena" : ""}" data-b="${L.id}" style="left:${L.x}px;top:${L.y}px;--c:${info.color};z-index:${L.y + 40}">
              <span class="bld-roof"></span>
              <span class="bld-body"><span class="bld-icon">${info.open ? info.icon : "🔒"}</span></span>
              ${sages.length ? `<span class="bld-sages">${sages.map(s => `<span class="${player.souls.includes(s.id) ? "got" : ""}">${Sages.sageSVG(s, 30)}</span>`).join("")}</span>` : ""}
              <span class="bld-name">${info.name}${info.stars ? ` <span class="bld-stars">${"★".repeat(info.stars)}</span>` : ""}${L.duel ? " ⚔️" : ""}</span>
            </button>`;
          }).join("")}
          ${meHtml(soul, pos)}
        </div>
        ${mapScenery.sky()}
        <div class="city-shade"></div>
        <div class="city-hint" id="hint">👆 הקישו על מקום כדי ללכת אליו</div>
      </div>`;

    if (typeof player.tour === "number") setTimeout(startTour, 600);
    else Parasha.ready.then(() => setTimeout(offerWeekly, 700));
    startWalker({
      W, H, pos,
      savePos: p => { player.pos = p; savePlayer(); },
      onBuilding(bEl, walkTo) {
        const b = City.byId(bEl.dataset.b), info = locInfo(b);
        if (info.soon) { walkTo(b.x, b.y + 62, () => toast(`🔒 ${info.name}, ${b.desc}: השאלות יתווספו בקרוב`)); return; }
        if (!info.open) { toast("🔒 " + info.name + " ייפתח אחרי שתעברו את המשימה הקודמת במסע"); return; }
        walkTo(b.x, b.y + 62, () => { location.hash = info.href; });
      },
    });
  }

  const meHtml = (soul, pos) => `
    <div class="me ${soul ? "has-soul" : ""}" id="me" style="left:${pos.x}px;top:${pos.y}px">
      ${soul ? `<span class="me-soul">🕯️ ${esc(soul.name)}</span>` : `<span class="me-name">${esc(player.name)}</span>`}
      <span class="me-body">${avatarSVG(player.look, 52)}</span>
      <span class="me-shadow"></span>
    </div>
    <div class="target" id="target"></div>`;

  // מנוע ההליכה, משותף למפת הארץ ולעולמות שבתוך הערים.
  // onBuilding(el, walkTo) נקרא בלחיצה על מקום; blocked = מלבנים שהדמות עוקפת ולא נכנסת אליהם.
  // onMove(pos, target) מדווח על תזוזה (למשל לשחקנים אחרים באותה עיירה); target = null כשהדמות עומדת.
  function startWalker({ W, H, pos, savePos, onBuilding, onGround, onMove, blocked = [] }) {
    const city = document.getElementById("city"), world = document.getElementById("world");
    const me = document.getElementById("me"), body = me.querySelector(".me-body"), tgt = document.getElementById("target");
    const sky = document.getElementById("sky");
    const SPEED = 260; // פיקסלים לשנייה
    // בטלפון מקטינים את העולם כדי לראות יותר
    const S = Math.min(1, Math.max(.6, city.clientWidth / 640));
    const banner = document.getElementById("pre-shabbat");
    city.style.top = (banner.hidden ? document.querySelector(".topbar") : banner).getBoundingClientRect().bottom + "px";
    let path = [], onArrive = null, last = performance.now();
    const keys = {};
    const cam = { x: 0, y: 0 };
    const store = () => savePos({ x: Math.round(pos.x), y: Math.round(pos.y) });

    // ---- עקיפת אזורים חסומים ----
    const PAD = 14;
    const inside = (p, r) => p.x > r.x1 && p.x < r.x2 && p.y > r.y1 && p.y < r.y2;
    function crosses(a, b, r) { // האם הקטע a->b עובר בתוך המלבן
      let t0 = 0, t1 = 1;
      const dx = b.x - a.x, dy = b.y - a.y;
      const ps = [-dx, dx, -dy, dy], qs = [a.x - r.x1, r.x2 - a.x, a.y - r.y1, r.y2 - a.y];
      for (let i = 0; i < 4; i++) {
        if (ps[i] === 0) { if (qs[i] <= 0) return false; continue; }
        const t = qs[i] / ps[i];
        if (ps[i] < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
        if (t0 >= t1) return false;
      }
      return true;
    }
    function plan(a, b) {
      const r = blocked.find(r => crosses(a, b, r));
      if (!r) return [b];
      const C = [{ x: r.x1 - PAD, y: r.y1 - PAD }, { x: r.x2 + PAD, y: r.y1 - PAD }, { x: r.x2 + PAD, y: r.y2 + PAD }, { x: r.x1 - PAD, y: r.y2 + PAD }];
      const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y), ok = (p, q) => !crosses(p, q, r);
      let best = [b], bl = Infinity;
      C.forEach((c, i) => {
        if (!ok(a, c)) return;
        if (ok(c, b) && d(a, c) + d(c, b) < bl) { bl = d(a, c) + d(c, b); best = [c, b]; }
        [C[(i + 1) % 4], C[(i + 3) % 4]].forEach(c2 => {
          const l = d(a, c) + d(c, c2) + d(c2, b);
          if (ok(c2, b) && l < bl) { bl = l; best = [c, c2, b]; }
        });
      });
      return best;
    }
    function outside(p) { // נקודה בתוך אזור חסום עוברת לשפה הקרובה
      const r = blocked.find(r => inside(p, r));
      if (!r) return p;
      const opts = [{ x: r.x1 - PAD, y: p.y }, { x: r.x2 + PAD, y: p.y }, { x: p.x, y: r.y1 - PAD }, { x: p.x, y: r.y2 + PAD }];
      return opts.reduce((m, o) => d2(o, p) < d2(m, p) ? o : m);
    }
    const d2 = (p, q) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2;

    function camera(snap) {
      const vw = city.clientWidth, vh = city.clientHeight, w = W * S, h = H * S;
      const wantX = w <= vw ? (w - vw) / 2 : Math.min(Math.max(pos.x * S - vw / 2, 0), w - vw);
      const wantY = h <= vh ? (h - vh) / 2 : Math.min(Math.max(pos.y * S - vh / 2, 0), h - vh);
      if (!snap && Math.abs(wantX - cam.x) < .2 && Math.abs(wantY - cam.y) < .2) return; // המצלמה במקום, אין מה לצייר
      cam.x = snap ? wantX : cam.x + (wantX - cam.x) * .15;
      cam.y = snap ? wantY : cam.y + (wantY - cam.y) * .15;
      world.style.transform = `translate(${-cam.x}px, ${-cam.y}px) scale(${S})`;
      // העננים גבוהים יותר מהקרקע, ולכן זזים מהר יותר ממנה: זה נותן תחושת עומק
      if (sky) sky.style.transform = `translate(${-cam.x * 1.35}px, ${-cam.y * 1.35}px) scale(${S})`;
    }

    function walkTo(x, y, cb) {
      const t = outside({ x: Math.min(Math.max(x, 20), W - 20), y: Math.min(Math.max(y, 40), H - 10) });
      path = plan({ x: pos.x, y: pos.y }, t);
      onArrive = cb || null;
      tgt.style.left = t.x + "px"; tgt.style.top = t.y + "px"; tgt.classList.add("show");
      document.getElementById("hint").classList.add("hide");
      if (onMove) onMove(pos, path[path.length - 1]);
    }
    let lastSent = 0;

    function frame(now) {
      const dt = Math.min((now - last) / 1000, .05); last = now;
      const manual = keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown;
      let dx = 0, dy = 0;
      if (keys.ArrowLeft) dx -= 1; if (keys.ArrowRight) dx += 1;
      if (keys.ArrowUp) dy -= 1; if (keys.ArrowDown) dy += 1;
      if (manual) { path = []; onArrive = null; tgt.classList.remove("show"); }
      else if (path.length) { dx = path[0].x - pos.x; dy = path[0].y - pos.y; }
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        const step = manual ? SPEED * dt : Math.min(SPEED * dt, dist);
        const nx = Math.min(Math.max(pos.x + dx / dist * step, 20), W - 20);
        const ny = Math.min(Math.max(pos.y + dy / dist * step, 40), H - 10);
        if (!blocked.some(r => inside({ x: nx, y: ny }, r))) { pos.x = nx; pos.y = ny; }
        me.style.left = pos.x + "px"; me.style.top = pos.y + "px";
        me.style.zIndex = Math.round(pos.y);
        if (Math.abs(dx) > 1) body.style.transform = dx < 0 ? "scaleX(-1)" : "";
        me.classList.add("walking");
        if (manual && onMove && now - lastSent > 400) { lastSent = now; onMove(pos, null); }
      } else {
        me.classList.remove("walking");
      }
      if (path.length && Math.hypot(path[0].x - pos.x, path[0].y - pos.y) < 1) {
        path.shift();
        if (!path.length) {
          tgt.classList.remove("show"); me.classList.remove("walking");
          store();
          if (onMove) onMove(pos, null);
          // ממשיכים את הלולאה גם אחרי ההגעה (בעולם של עיר נשארים באותו מסך)
          if (onArrive) { const cb = onArrive; onArrive = null; camera(false); cityLoop.raf = requestAnimationFrame(frame); cb(); return; }
        }
      }
      camera(false);
      cityLoop.raf = requestAnimationFrame(frame);
    }

    city.addEventListener("click", ev => {
      if (ev.target.closest(".soul-chip, .town-info, .town-sign")) return;
      const bEl = ev.target.closest(".bld");
      if (bEl) { onBuilding(bEl, walkTo); return; }
      if (onGround) onGround();
      const r = city.getBoundingClientRect();
      walkTo((ev.clientX - r.left + cam.x) / S, (ev.clientY - r.top + cam.y) / S);
    });

    const onKey = ev => {
      if (!ev.key.startsWith("Arrow") || ev.target.closest("input, textarea, select")) return;
      keys[ev.key] = ev.type === "keydown"; ev.preventDefault();
      if (ev.type === "keyup") { store(); if (onMove) onMove(pos, null); }
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);
    cityLoop = { raf: 0, onKey };
    me.style.zIndex = Math.round(pos.y);
    camera(true);
    cityLoop.raf = requestAnimationFrame(frame);
  }

  // ---------- עולם בתוך עיר (ירושלים) ----------
  async function viewTown(id) {
    const T = Towns.byId(id);
    if (!T || !player.name) return viewCity();
    if (id === "parasha") await Parasha.ready; // שם הפרשה של השבוע מוצג בעיירה
    if (id === "sea") T.from = portHere(); // לא מציעים להפליג לנמל שבו כבר נמצאים
    setTab("map");
    document.body.classList.add("in-city");
    const soul = player.activeSoul && Sages.byId(player.activeSoul);
    player.townPos = player.townPos || {};
    const pos = Object.assign({}, player.townPos[id] || T.start);
    app.innerHTML = `
      <div class="city town" id="city">
        <div class="world" id="world" style="width:${T.W}px;height:${T.H}px">
          ${T.svg(T.W, T.H)}
          ${T.labels.map(l => `<span class="map-label ${l.cls}" style="left:${l.x}px;top:${l.y}px">${l.text}</span>`).join("")}
          ${T.decorations.map(([e, x, y]) => `<span class="deco" style="left:${x}px;top:${y}px">${e}</span>`).join("")}
          ${T.spots.map(sp => {
            if (sp.area) return `<button class="bld area-spot" data-b="${sp.id}" style="left:${sp.x}px;top:${sp.y}px;--c:${sp.color}">
                <span class="area-icon">${sp.icon}</span><span class="bld-name">${sp.name}</span></button>`;
            const sages = sp.sagesOf ? Sages.SAGES.filter(s => s.building === sp.sagesOf) : [];
            return `<button class="bld ${sp.exit ? "exit-spot" : ""} ${sp.duel ? "arena" : ""}" data-b="${sp.id}" style="left:${sp.x}px;top:${sp.y}px;--c:${sp.color}">
              <span class="bld-roof"></span>
              <span class="bld-body"><span class="bld-icon">${sp.icon}</span></span>
              ${sages.length ? `<span class="bld-sages">${sages.map(s => `<span class="${player.souls.includes(s.id) ? "got" : ""}">${Sages.sageSVG(s, 30)}</span>`).join("")}</span>` : ""}
              <span class="bld-name">${sp.name}${sp.duel ? " ⚔️" : ""}</span>
            </button>`;
          }).join("")}
          ${meHtml(soul, pos)}
        </div>
        <a class="town-sign" href="#/">⬅ ${esc(T.name)} · למפת הארץ</a>
        <div class="city-hint" id="hint">👆 הקישו על מקום כדי ללכת אליו</div>
        <div class="town-info card" id="townInfo" hidden></div>
        <div class="soul-chip peers-chip" id="peersChip" hidden></div>
      </div>`;
    townPeers = joinTown(id, pos, soul);
    const box = document.getElementById("townInfo");
    const hideInfo = () => { box.hidden = true; };
    function showInfo(sp) {
      box.innerHTML = `<button class="close-x" aria-label="סגירה">✕</button>
        <h3>${sp.info.title}</h3><p>${esc(sp.info.text)}</p>
        ${sp.info.links.map(([label, href]) => {
          const pl = href.startsWith("#/place/") && placeById(href.slice(8));
          return pl && !isOpen(PLACES.indexOf(pl)) ? `<span class="chip">🔒 ${label}</span>` : `<a class="btn small-btn" href="${href}">${label}</a>`;
        }).join("")}`;
      box.hidden = false;
      box.querySelector(".close-x").onclick = hideInfo;
    }
    startWalker({
      W: T.W, H: T.H, pos, blocked: T.blocked,
      savePos: p => { player.townPos[id] = p; savePlayer(); },
      onMove: (p, t) => townPeers && townPeers.move(p, t),
      onGround: hideInfo,
      onBuilding(bEl, walkTo) {
        const sp = T.spots.find(x => x.id === bEl.dataset.b);
        hideInfo();
        const pl = sp.href && sp.href.startsWith("#/place/") && placeById(sp.href.slice(8));
        if (pl && !isOpen(PLACES.indexOf(pl))) { toast("🔒 " + pl.name + " ייפתח אחרי המשימה הקודמת במסע"); return; }
        walkTo(sp.ax != null ? sp.ax : sp.x, sp.ay != null ? sp.ay : sp.y + 62, () => {
          if (sp.exit) { player.townPos[id] = null; savePlayer(); }
          if (sp.href) location.hash = sp.href; else showInfo(sp);
        });
      },
    });
  }

  // ---------- היכל הים: הפלגה ליבשה אחרת ----------
  // הנמל הקרוב לדמות במפה הוא הנמל שבו נמצאים
  function portHere() {
    const p = player.pos || City.START;
    let best = "israel", bd = Infinity;
    Object.entries(City.PORTS).forEach(([k, P]) => {
      const L = City.byId(P.loc), d = Math.hypot(L.x - p.x, L.y - p.y);
      if (d < bd) { bd = d; best = k; }
    });
    return best;
  }
  let sailT = 0;
  function viewSail(dest) {
    const P = City.PORTS[dest];
    if (!P || !player.name) return viewCity();
    setTab("map");
    const from = City.PORTS[portHere()];
    app.innerHTML = `
      <div class="voyage" id="voyage">
        <div class="voy-sky"><span class="voy-sun"></span><span class="voy-bird">🕊️</span></div>
        <div class="voy-sea"><div class="voy-wave w1"></div><div class="voy-wave w2"></div><div class="voy-wave w3"></div></div>
        <div class="voy-ship">${P.icon}</div>
        <div class="voy-title">מפליגים מ${from.name} אל ${P.name}...</div>
        <div class="voy-bar"><i></i></div>
      </div>
      <div class="card center"><p>"יורדי הים באניות, עשי מלאכה במים רבים" (תהלים קז, כג)</p>
        <p class="small muted">ארבעה צריכים להודות, והראשונים שבהם: יורדי הים (ברכות נד, ב).</p></div>`;
    clearTimeout(sailT);
    sailT = setTimeout(() => {
      if (!location.hash.startsWith("#/sail/")) return;
      const L = City.byId(P.loc);
      player.pos = { x: L.x, y: L.y + 62 };
      player.townPos = player.townPos || {}; player.townPos.sea = null;
      savePlayer();
      location.hash = "#/";
      toast(`⚓ הגעתם ל${P.name}! יורדי הים מודים לה' כשמגיעים בשלום`);
    }, 4200);
  }

  // ---------- שחקנים אחרים באותה עיירה ----------
  // כל מי שנמצא באותה עיירה רואה את האחרים הולכים (רק בעיירות, לא במפת הארץ). נשלחים רק שם, מראה הדמות ומיקום.
  const TAB_ID = Math.random().toString(36).slice(2, 8);
  window.addEventListener("pagehide", () => { if (townPeers) { townPeers.leave(); townPeers = null; } });
  function joinTown(townId, pos, soul) {
    if (!player.id) { player.id = Math.random().toString(36).slice(2, 10); savePlayer(); }
    const SPEED = 260;
    let meta = { id: player.id + "-" + TAB_ID, name: player.name, look: player.look, soul: soul ? soul.name : "", x: Math.round(pos.x), y: Math.round(pos.y), tx: null, ty: null };
    const els = {};
    function place(el, p) {
      // מציבים בנקודה הנוכחית, ואם יש יעד, הולכים אליו באותה מהירות של השחקן
      const from = { x: p.x, y: p.y };
      el.style.transition = "none";
      el.style.left = from.x + "px"; el.style.top = from.y + "px"; el.style.zIndex = Math.round(from.y);
      if (p.tx == null) { el.classList.remove("walking"); return; }
      const dist = Math.hypot(p.tx - from.x, p.ty - from.y), sec = dist / SPEED;
      el.querySelector(".me-body").style.transform = p.tx < from.x ? "scaleX(-1)" : "";
      void el.offsetWidth;
      el.style.transition = `left ${sec}s linear, top ${sec}s linear`;
      el.style.left = p.tx + "px"; el.style.top = p.ty + "px"; el.style.zIndex = Math.round(p.ty);
      el.classList.add("walking");
      clearTimeout(el._stop); el._stop = setTimeout(() => el.classList.remove("walking"), sec * 1000);
    }
    function onPeers(list) {
      const world = document.getElementById("world"), chip = document.getElementById("peersChip");
      if (!world) return;
      const others = list.filter(p => p && p.id !== meta.id && p.name);
      const seen = new Set();
      others.forEach(p => {
        seen.add(p.id);
        let el = els[p.id];
        if (!el) {
          el = document.createElement("div");
          el.className = "me other";
          el.innerHTML = `<span class="me-name">${esc(p.soul ? "🕯️ " + p.soul : p.name)}</span><span class="me-body">${avatarSVG(p.look, 46)}</span><span class="me-shadow"></span>`;
          world.appendChild(el); els[p.id] = el;
        }
        const key = [p.x, p.y, p.tx, p.ty].join();
        if (el._key !== key) { el._key = key; place(el, p); }
      });
      Object.keys(els).forEach(k => { if (!seen.has(k)) { els[k].remove(); delete els[k]; } });
      if (chip) { chip.hidden = !others.length; chip.textContent = `👥 עוד ${others.length === 1 ? "שחקן אחד" : others.length + " שחקנים"} כאן`; }
    }
    let t;
    try { t = TeireDuel.transport("town-" + townId, onPeers, () => {}); t.join(meta); } catch (e) { return null; }
    let timer = null;
    return {
      move(p, target) {
        meta = { ...meta, x: Math.round(p.x), y: Math.round(p.y), tx: target ? Math.round(target.x) : null, ty: target ? Math.round(target.y) : null };
        // לא שולחים יותר מפעם בשליש שנייה
        clearTimeout(timer); timer = setTimeout(() => t.update(meta), 120);
      },
      leave() { clearTimeout(timer); t.close(); },
    };
  }

  // ---------- הכותל המערבי ----------
  function viewKotel() {
    if (!player.name) return viewCity();
    setTab("map");
    const rows = [];
    for (let r = 0; r < 8; r++) for (let c = -1; c < 9; c++) {
      const w = 52 + ((r * 7 + c * 13) % 3) * 6, x = c * 50 + (r % 2 ? 25 : 0) + ((r * 5 + c) % 4);
      rows.push(`<rect x="${x}" y="${30 + r * 24}" width="${w - 4}" height="21" rx="5" fill="${["#e3cf9b", "#d9c28a", "#ead9ad", "#d2b97e"][(r + c * 3 + 8) % 4]}"/>`);
    }
    app.innerHTML = `
      <div class="kotel-scene">
        <svg viewBox="0 0 400 230" width="100%" aria-hidden="true">
          <rect width="400" height="230" fill="#9fd3f5"/>
          <rect y="26" width="400" height="200" fill="#bfa36b"/>
          ${rows.join("")}
          <g fill="#6f9d3f"><circle cx="70" cy="62" r="9"/><circle cx="78" cy="56" r="7"/><circle cx="300" cy="110" r="8"/><circle cx="292" cy="116" r="6"/><circle cx="190" cy="40" r="7"/></g>
          <rect y="222" width="400" height="8" fill="#f2e6c8"/>
        </svg>
        <span class="kotel-dove">🕊️</span>
        <span class="kotel-note" id="flynote">📜</span>
      </div>
      ${guideBubble({ name: "בכותל", face: "🧱", color: "#b08d57" }, "\"שערי דמעה לא ננעלו\" (ברכות לב, ב). כתבו פתק עם תפילה או בקשה, והכניסו אותו בין אבני הכותל.")}
      <div class="card">
        <textarea id="note" rows="3" maxlength="200" placeholder="רבונו של עולם..."></textarea>
        <button class="btn gold big-btn" id="put">🙏 הכניסו את הפתק לכותל</button>
        <p class="small muted center" style="margin:8px 0 0">הפתק לא נשמר ולא נשלח לאף אחד. פתקים שהכנסתם: <b id="cnt">${player.notes || 0}</b></p>
      </div>
      <div class="row center-row"><a class="btn ghost" href="#/town/jerusalem">חזרה לירושלים</a></div>`;
    const note = document.getElementById("note"), fly = document.getElementById("flynote");
    document.getElementById("put").onclick = () => {
      if (!note.value.trim()) { toast("כתבו קודם משהו בפתק"); return; }
      note.value = "";
      fly.classList.remove("go"); void fly.offsetWidth; fly.classList.add("go");
      player.notes = (player.notes || 0) + 1;
      const today = new Date().toDateString();
      if (player.kotelDay !== today) { player.kotelDay = today; player.coins += 5; toast("🙏 הפתק בכותל! +🪙5 (פעם ביום)"); }
      else toast("🙏 הפתק בכותל!");
      savePlayer();
      document.getElementById("cnt").textContent = player.notes;
    };
  }

  // ---------- נוף המפה: עומק ותלת מימד ----------
  // הארץ נראית כמו אי מוגבה: צוק וצל מתחת לחוף, מים רדודים ליד החוף, הרים מוצללים, יערות עם צל,
  // ועננים שזזים מהר יותר מהקרקע כשהמצלמה זזה (פרלקסה).
  const mapScenery = (() => {
    const { LAND, SINAI, BAVEL, EUROPE, MIZRACH, LOCATIONS, LABELS, W, H } = City;
    const SHAPES = [LAND, SINAI, BAVEL, EUROPE, MIZRACH];
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const inPoly = (x, y, poly) => {
      let c = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    // מקום פנוי: רחוק מהבניינים, מהשמות, מהירדן ומהימים הפנימיים
    const free = (x, y, r) => LOCATIONS.every(L => Math.hypot(L.x - x, (L.y + 20) - y) > r + 62)
      && LABELS.every(l => Math.hypot(l.x - x, l.y - y) > r + 40)
      && !(x > 680 && x < 745 && y > 330 && y < 1330) && Math.hypot(x - 520, y - 1060) > 70;
    const where = (x, y) => SHAPES.find(p => inPoly(x, y, p));

    // הרים: [x, y, רוחב, גובה, שלג]
    const HILLS = [[748, 78, 120, 80, 1], [690, 120, 80, 52], [430, 300, 80, 50], [560, 330, 70, 44], [470, 650, 74, 46], [650, 590, 70, 44],
      [520, 1150, 70, 42], [655, 1060, 64, 40], [610, 1450, 80, 44], [520, 1660, 90, 50], [205, 1560, 80, 50], [400, 1650, 100, 64], [230, 1880, 70, 40],
      [960, 600, 60, 36], [1220, 230, 90, 56], [1330, 560, 70, 44], [1110, 1290, 70, 40], [1300, 1220, 80, 46]]
      .filter(([x, y, w]) => free(x, y, w / 3));
    const hill = ([x, y, w, h, snow]) => {
      const sandy = y > 1350 || x > 1040 && y > 1000 || (x > 800 && x < 1000);
      const lit = sandy ? "#e9c27f" : "#8fcf6a", dark = sandy ? "#c4914c" : "#5f9f45", base = sandy ? "#d8a95f" : "#76b955";
      return `<g class="hill">
        <ellipse cx="${x + w * .12}" cy="${y + 4}" rx="${w * .62}" ry="${h * .2}" fill="rgba(0,0,0,.2)"/>
        <path d="M${x - w / 2} ${y} L${x} ${y - h} L${x + w / 2} ${y} Z" fill="${base}"/>
        <path d="M${x - w / 2} ${y} L${x} ${y - h} L${x - w * .06} ${y} Z" fill="${lit}"/>
        <path d="M${x} ${y - h} L${x + w / 2} ${y} L${x + w * .1} ${y} Z" fill="${dark}"/>
        ${snow ? `<path d="M${x - w * .16} ${y - h * .68} L${x} ${y - h} L${x + w * .16} ${y - h * .68} L${x + w * .06} ${y - h * .6} L${x} ${y - h * .7} L${x - w * .07} ${y - h * .6} Z" fill="#fff"/>` : ""}
      </g>`;
    };

    // עצים: צפוף בצפון, דקלים ושיחים בדרום
    const TREES = [];
    for (let i = 0; i < 900 && TREES.length < 130; i++) {
      const x = 120 + rnd() * (W - 160), y = 60 + rnd() * (H - 120);
      const shape = where(x, y);
      if (!shape || !free(x, y, 14) || TREES.some(t => Math.hypot(t.x - x, t.y - y) < 30)) continue;
      const south = y > 1320 || shape === SINAI || shape === MIZRACH || shape === BAVEL;
      if (south && rnd() < .55) continue; // במדבר פחות צמחייה
      TREES.push({ x, y, s: .8 + rnd() * .5, kind: south ? (rnd() < .5 ? "palm" : "bush") : shape === EUROPE ? "pine" : rnd() < .25 ? "pine" : "tree" });
    }
    TREES.sort((a, b) => a.y - b.y);
    const tree = ({ x, y, s, kind }) => {
      const sh = `<ellipse cx="${x + 7 * s}" cy="${y + 2}" rx="${15 * s}" ry="${5 * s}" fill="rgba(0,0,0,.2)"/>`;
      if (kind === "pine") return `${sh}<rect x="${x - 2 * s}" y="${y - 8 * s}" width="${4 * s}" height="${8 * s}" fill="#7a5230"/>
        <path d="M${x - 12 * s} ${y - 6 * s} L${x} ${y - 34 * s} L${x + 12 * s} ${y - 6 * s} Z" fill="#2f7d3a"/>
        <path d="M${x} ${y - 34 * s} L${x + 12 * s} ${y - 6 * s} L${x + 2 * s} ${y - 6 * s} Z" fill="#23642d"/>`;
      if (kind === "palm") return `${sh}<path d="M${x} ${y} q${3 * s} ${-14 * s} ${-1 * s} ${-26 * s}" stroke="#9a6b3a" stroke-width="${3.5 * s}" fill="none" stroke-linecap="round"/>
        <path d="M${x - 1 * s} ${y - 26 * s} q${-10 * s} ${-4 * s} ${-15 * s} ${4 * s} M${x - 1 * s} ${y - 26 * s} q${10 * s} ${-5 * s} ${15 * s} ${3 * s} M${x - 1 * s} ${y - 26 * s} q${-4 * s} ${-9 * s} ${-11 * s} ${-9 * s} M${x - 1 * s} ${y - 26 * s} q${5 * s} ${-9 * s} ${12 * s} ${-8 * s}" stroke="#3f9a3a" stroke-width="${3.5 * s}" fill="none" stroke-linecap="round"/>`;
      if (kind === "bush") return `${sh}<circle cx="${x}" cy="${y - 6 * s}" r="${8 * s}" fill="#8fae4a"/><circle cx="${x - 2.5 * s}" cy="${y - 8.5 * s}" r="${3.5 * s}" fill="#b4cc6a"/>`;
      return `${sh}<rect x="${x - 2 * s}" y="${y - 10 * s}" width="${4 * s}" height="${10 * s}" fill="#7a5230"/>
        <circle cx="${x}" cy="${y - 20 * s}" r="${12 * s}" fill="#3e9a3e"/>
        <circle cx="${x + 4 * s}" cy="${y - 17 * s}" r="${8 * s}" fill="#2f8133"/>
        <circle cx="${x - 4 * s}" cy="${y - 24 * s}" r="${5 * s}" fill="#6cc25a"/>`;
    };

    // ניצוצות על המים
    const SPARKS = [[120, 520], [230, 760], [90, 1120], [210, 1380], [960, 200], [980, 1260], [880, 1500], [140, 220], [1000, 420], [60, 1700]];
    // עננים: [x, y, גודל]. הצל שלהם על הקרקע זז יחד איתם
    const CLOUDS = [[300, 200, 1.1], [800, 520, .9], [380, 900, 1], [1100, 980, 1.2], [620, 1280, .95], [250, 1600, 1.1], [1000, 1700, .9], [1200, 400, 1]];
    const cloud = (cls, x, y, k, i) => `<div class="${cls}" style="left:${x}px;top:${y}px;--k:${k};animation-delay:${-i * 7}s"><i></i><i></i><i></i></div>`;

    return {
      back(pts) {
        return `
          <g class="shallow">${SHAPES.map(p => `<polygon points="${pts(p)}" fill="none" stroke="#7fd6f2" stroke-opacity=".45" stroke-width="120" stroke-linejoin="round"/>`).join("")}</g>
          <g opacity=".7">${SHAPES.map(p => `<polygon points="${pts(p)}" fill="none" stroke="#a9e6f7" stroke-opacity=".6" stroke-width="64" stroke-linejoin="round"/>`).join("")}</g>
          <g class="foam">${SHAPES.map(p => `<polygon points="${pts(p)}" fill="none" stroke="#fff" stroke-width="46" stroke-linejoin="round"/>`).join("")}</g>
          <g filter="url(#soft)" transform="translate(16 30)">${SHAPES.map(p => `<polygon points="${pts(p)}" fill="rgba(10,40,90,.45)" stroke="rgba(10,40,90,.45)" stroke-width="34" stroke-linejoin="round"/>`).join("")}</g>
          <g transform="translate(0 16)">${SHAPES.map(p => `<polygon points="${pts(p)}" fill="#b98546" stroke="#b98546" stroke-width="34" stroke-linejoin="round"/>`).join("")}</g>
          ${SPARKS.map(([x, y], i) => `<path class="spark" style="animation-delay:${i * .37}s" d="M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z" fill="#fff"/>`).join("")}`;
      },
      front() { return HILLS.map(hill).join("") + TREES.map(tree).join(""); },
      cloudShadows() { return `<div class="cloud-shadows">${CLOUDS.map(([x, y, k], i) => cloud("cloud-sh", x + 40, y + 160, k, i)).join("")}</div>`; },
      sky() { return `<div class="sky" id="sky" style="width:${W}px;height:${H}px">${CLOUDS.map(([x, y, k], i) => cloud("cloud", x, y, k, i)).join("")}<span class="bird" style="top:640px">🕊️</span><span class="bird b2" style="top:1420px">🕊️</span></div>`; },
    };
  })();

  function mapDecorations() {
    // קישוטים קבועים: הרים, עצים, דקלים וסירות
    const items = [
      // העצים וההרים מצוירים עכשיו בנוף (mapScenery), כאן נשארו החיות, הסירות והאוהל
      ["🐑", 520, 650], ["🍇", 380, 960], ["🐄", 470, 820], ["🌾", 650, 760], ["🐑", 500, 1250],
      ["🐪", 560, 1480], ["⛺", 520, 1560], ["🐪", 230, 1650], ["🐫", 950, 900],
      ["⛵", 210, 900], ["🐋", 120, 1250], ["🐟", 240, 450], ["⛵", 90, 330], ["🐠", 900, 1250],
    ];
    return items.map(([e, x, y]) => `<span class="deco" style="left:${x}px;top:${y}px">${e}</span>`).join("");
  }

  function toast(text) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  // ---------- שאלון כללי ----------
  // items: [{ question, answers, correct, source, prompt, reward, explain }]
  function runQuiz(guide, items, onDone, exitHref) {
    let idx = 0, score = 0, coins = 0;
    const cheers = ["כל הכבוד!", "יישר כח!", "מצוין!", "אשריך!", "נפלא!"];
    function show() {
      const q = items[idx];
      const order = db.shuffle([0, 1, 2, 3]);
      app.innerHTML = `
        ${exitHref ? `<a class="quit-link" href="${exitHref}">✕ יציאה</a>` : ""}
        <div class="dots">${items.map((_, i) => `<span class="${i < idx ? "done" : i === idx ? "now" : ""}"></span>`).join("")}</div>
        ${guideBubble(guide, q.prompt || `שאלה ${idx + 1} מתוך ${items.length}`)}
        <div class="card">
          ${q.verse ? `<div class="verse"><div class="verse-text">${esc(q.verse)}</div><div class="verse-ref">${esc(q.ref || "")}</div></div>` : ""}
          <div class="qtext">${esc(q.question)}</div>
          <div class="answers">
            ${order.map((orig, i) => `<button class="answer" data-orig="${orig}"><span class="letter">${LETTERS[i]}</span>${esc(q.answers[orig])}</button>`).join("")}
          </div>
          <div id="fb"></div>
        </div>`;
      app.querySelectorAll(".answer").forEach(btn => btn.onclick = () => {
        const ok = Number(btn.dataset.orig) === q.correct;
        const reward = q.reward || 10;
        if (ok) { score++; coins += reward; }
        // שאלת המשך: מופיעה רק למי שענה נכון
        if (ok && q.followup) items.splice(idx + 1, 0, { ...q.followup, reward, prompt: "🔗 שאלת המשך!" });
        app.querySelectorAll(".answer").forEach(b => {
          b.disabled = true;
          if (Number(b.dataset.orig) === q.correct) b.classList.add("correct");
        });
        if (!ok) btn.classList.add("wrong");
        const g = app.querySelector(".guide");
        g.classList.add(ok ? "happy" : "sad");
        g.querySelector(".speech").innerHTML = `<b>${esc(guide.name)}:</b> ${ok ? (q.cheer || cheers[idx % cheers.length]) + " +🪙" + reward : "לא נורא! התשובה הנכונה מסומנת בירוק."}`;
        const last = idx === items.length - 1;
        document.getElementById("fb").innerHTML = `
          ${q.note ? `<div class="note-box"><b>💡 למה?</b> ${esc(q.note)}</div>` : ""}
          ${q.explain ? `<div class="explain">${q.explain}</div>` : ""}
          ${q.quote ? `<div class="quote">«${esc(q.quote)}»</div>` : ""}
          ${q.source ? `<div class="small muted" style="margin-top:10px">מקור: ${esc(q.source)}</div>` : ""}
          <button class="btn big-btn" id="next">${last ? "לסיום" : "לשאלה הבאה"}</button>
          <div class="report-row"><button class="report-link" id="rep">🚩 לדווח שהתשובה לא נכונה</button></div>
          <div id="repbox"></div>`;
        document.getElementById("next").onclick = () => { if (last) onDone(score, items.length, coins); else { idx++; show(); } };
        document.getElementById("rep").onclick = () => {
          document.getElementById("repbox").innerHTML = `
            <div class="report-box">
              <textarea id="repwhy" rows="2" maxlength="400" placeholder="מה לא נכון? (לא חובה)"></textarea>
              <button class="btn ghost small" id="repsend">שליחה</button>
            </div>`;
          document.getElementById("repsend").onclick = async () => {
            const btn = document.getElementById("repsend");
            btn.disabled = true;
            const reason = document.getElementById("repwhy").value.trim() || null;
            try {
              await db.report({ place: q.place || "", question: q.question, qkey: (q.place || "") + "|" + q.question, reason });
              document.getElementById("repbox").innerHTML = `<div class="notice ok small">תודה! נבדוק את השאלה.</div>`;
            } catch (e) {
              btn.disabled = false;
              toast("לא הצלחנו לשלוח את הדיווח, נסו שוב");
            }
          };
        };
      });
    }
    show();
  }

  function guideBubble(guide, text, mood) {
    return `<div class="guide ${mood || ""}">
      <div class="guide-face ${guide.svg ? "svg" : ""}" style="background:${guide.color}">${guide.face}</div>
      <div class="speech"><b>${esc(guide.name)}:</b> ${text}</div>
    </div>`;
  }
  const placeGuide = place => ({ name: place.guide.name, face: place.guide.emoji, color: place.color });
  const sageGuide = sage => ({ name: sage.name, face: Sages.sageSVG(sage, 56), color: sage.look.robe, svg: true });

  function starsFor(score, n) {
    const r = score / n;
    return r === 1 ? 3 : r >= .75 ? 2 : r >= .5 ? 1 : 0;
  }

  // ---------- תחנה בשכונת החומש ----------
  async function viewPlace(placeId) {
    const place = placeById(placeId);
    if (!place || !player.name) return viewCity();
    setTab("map");
    if (!isOpen(PLACES.indexOf(place))) return viewCity();

    app.innerHTML = `<p class="muted center">טוען...</p>`;
    if (isParashaPlace(placeId)) await Parasha.ready; // קודם יודעים איזו פרשה עכשיו
    let dbPool = [];
    try { dbPool = await db.approved(placeId); } catch (e) { app.innerHTML = errorBox(e); return; }
    // בהיכל פרשת השבוע רק שאלות של הפרשה (או השתיים) של השבוע. השאר נשמרות לשנה הבאה.
    if (isParashaPlace(placeId)) dbPool = dbPool.filter(q => Parasha.current.ids.includes(q.parasha));
    // שאלות ממסד הנתונים לפי השלב שלהן (בלי שלב = שלב 1), ועוד השאלות המובנות של אותו שלב
    const pools = [null, ...Array.from({ length: LEVEL_MAX }, (_, i) => i + 1).map(l => dbPool.filter(q => (q.level || 1) === l).concat(bankFor(placeId, l)))];
    const levels = Array.from({ length: LEVEL_MAX }, (_, i) => i + 1).filter(l => pools[l].length);
    // השלב הקודם שיש בו שאלות (שלבים ריקים לא נועלים את מה שאחריהם)
    const prevLevel = l => { for (let k = l - 1; k >= 1; k--) if (pools[k].length) return k; return 0; };
    const st = player.stars[placeId] || 0;
    app.innerHTML = `
      <div class="place-hero" style="--c:${place.color}">
        <div class="place-icon">${place.icon}</div>
        <h1>${place.name}</h1>
        <p>${place.desc}</p>
        <div class="station-stars big-stars">${"★".repeat(st)}<span class="dim">${"★".repeat(3 - st)}</span></div>
      </div>
      ${guideBubble(placeGuide(place), esc(place.guide.hello))}
      ${levels.length ? levels.map(l => {
        const ls = levelStars(placeId, l), prev = prevLevel(l), open = prev === 0 || levelStars(placeId, prev) >= 1;
        return `<div class="card level-card ${open ? "" : "locked"}">
          <div style="flex:1">
            <h3>${LEVEL_NAMES[l]}</h3>
            <div class="small muted">${Math.min(pools[l].length, cfg.QUESTIONS_PER_MISSION)} שאלות · כל תשובה נכונה = 🪙 ${LEVEL_REWARD[l]}</div>
            <div class="station-stars">${"★".repeat(ls)}<span class="dim">${"★".repeat(3 - ls)}</span></div>
          </div>
          ${open ? `<button class="btn ${l > 1 ? "gold" : ""}" data-level="${l}">מתחילים!</button>`
            : `<div class="small">🔒 נפתח אחרי ${LEVEL_NAMES[prev].split(":")[0]}</div>`}
        </div>`;
      }).join("") : `<div class="card center"><p>אין עדיין שאלות במקום הזה.</p></div>`}
      <div class="row center-row"><a class="btn ghost" href="${place.home || backOf(locOfTorah(place.id) && locOfTorah(place.id).id)}">חזרה</a><a class="btn ghost" href="#/suggest/${place.id}">הציעו שאלה למשימה הזאת</a></div>`;
    app.querySelectorAll("[data-level]").forEach(btn => btn.onclick = () => {
      const l = Number(btn.dataset.level);
      runMission(place, pools[l], l);
    });
  }

  // החזרה למקום שממנו נכנסו למשימה (עיירה או בניין), ולא רק למפה הראשית
  function placeBack(place) {
    const href = place.home || backOf(locOfTorah(place.id) && locOfTorah(place.id).id);
    const T = href.startsWith("#/town/") ? Towns.byId(href.split("/")[2]) : null;
    const B = !T && href.startsWith("#/b/") ? City.byId(href.split("/")[2]) : null;
    return { href, name: (T || B || { name: "" }).name };
  }

  function runMission(place, pool, level, backHref) {
    level = level || 1;
    const items = db.shuffle(pool).slice(0, cfg.QUESTIONS_PER_MISSION).map(q => ({ ...q, place: place.id, reward: LEVEL_REWARD[level] }));
    runQuiz(placeGuide(place), items, (score, n, coins) => {
      const stars = starsFor(score, n);
      if (stars === 3) coins += 20 * level;
      const key = starKey(place.id, level);
      const before = player.stars[key] || 0;
      player.coins += coins;
      if (stars > before) player.stars[key] = stars;
      savePlayer();
      const i = PLACES.indexOf(place);
      const next = PLACES[i + 1];
      const unlocked = level === 1 && before === 0 && stars >= 1 && next && !next.free && next;
      const nextLevel = before === 0 && stars >= 1 && bankFor(place.id, level + 1).length && level + 1;
      if (stars >= 2) confetti();
      app.innerHTML = `
        ${guideBubble(placeGuide(place), stars === 3 ? "מושלם! אתם אלופים!" : stars >= 1 ? "יפה מאוד! עברתם את השלב." : "כמעט! צריך חצי מהתשובות נכונות כדי לעבור. נסו שוב!", stars ? "happy" : "")}
        <div class="card center result">
          <div class="small muted">${place.name} · ${LEVEL_NAMES[level]}</div>
          ${resultStars(stars)}
          <div class="big">${score}/${n}</div>
          <p>הרווחתם <b>🪙 ${coins}</b>${stars === 3 ? ` (כולל בונוס ${20 * level} על משימה מושלמת)` : ""}</p>
          ${nextLevel ? `<div class="notice ok">נפתח ${LEVEL_NAMES[nextLevel]}!</div>` : ""}
          ${unlocked ? `<div class="notice ok">נפתחה משימה חדשה במפה: ${unlocked.icon} ${unlocked.name} ב${locOfTorah(unlocked.id).name}!</div>` : ""}
          ${journeyAfter(s => s.kind === "place" && s.place === place.id && s.level === level, stars >= 1)}
          <div class="row center-row">
            <button class="btn gold" id="again">שוב</button>
            <a class="btn" href="#/place/${place.id}">לשלבים</a>
            ${placeBack(place).href !== "#/" && placeBack(place).name ? `<a class="btn ghost" href="${placeBack(place).href}">חזרה ל${placeBack(place).name}</a>` : ""}
            <a class="btn ghost" href="#/">למפה</a>
          </div>
        </div>`;
      document.getElementById("again").onclick = () => runMission(place, pool, level, backHref);
    }, backHref || placeBack(place).href);
  }
  const resultStars = stars => `<div class="result-stars">${[0, 1, 2].map(k => `<span class="${k < stars ? "on" : ""}" style="animation-delay:${k * .25}s">★</span>`).join("")}</div>`;

  // ---------- בית של חכמים ----------
  function viewBuilding(bid) {
    const b = City.byId(bid);
    if (!b || b.href || !player.name) return viewCity();
    setTab("map");
    const sages = Sages.SAGES.filter(s => s.building === bid);
    const machlokot = Sages.MACHLOKOT.filter(m => m.building === bid);
    const soul = player.activeSoul && Sages.byId(player.activeSoul);
    const mine = soul && machlokot.some(m => soul.id in m.opinions);
    app.innerHTML = `
      <div class="place-hero" style="--c:${b.color}">
        <div class="place-icon">${b.icon}</div>
        <h1>${b.name}</h1>
        <p>${b.desc}</p>
      </div>
      ${sages.map(s => {
        const got = player.souls.includes(s.id);
        return `<div class="card sage-card">
          <div class="sage-pic" style="background:${s.look.robe}22">${Sages.sageSVG(s, 84)}</div>
          <div class="sage-info">
            <h3>${s.name}</h3>
            <div class="small muted">${s.era === "tanna" ? "תנא" : "אמורא"}</div>
            <p class="sage-hello">"${esc(s.hello)}"</p>
            ${got
              ? `<div class="row" style="margin-top:6px"><span class="chip">✓ הנשמה אצלכם</span>${player.activeSoul === s.id ? `<span class="chip gold-chip">🕯️ פעילה עכשיו</span>` : `<button class="btn small-btn" data-activate="${s.id}">הפעלת הנשמה</button>`}</div>`
              : `<button class="btn gold small-btn" data-quest="${s.id}">🕯️ עיבור נשמה</button>`}
          </div>
        </div>`;
      }).join("")}
      ${machlokot.length ? `
        <div class="card center">
          <h3>📜 לימוד הסוגיא</h3>
          <p class="small">${machlokot.length} מחלוקות. ${mine ? `<b>נשמת ${esc(soul.name)} בכם</b>, אז תענו לפי השיטה שלכם ותקבלו 🪙20 על כל תשובה!` : "הפעילו נשמה של אחד החכמים כאן כדי לענות לפי השיטה שלו ולקבל פי 2 מטבעות."}</p>
          <button class="btn big-btn" id="sugya">${mine ? "מה אני סובר? מתחילים!" : "מתחילים ללמוד"}</button>
        </div>` : ""}
      ${torahCard(b)}
      ${b.duel ? `
        <div class="card center duel-card">
          <h3>⚔️ זירת דו-קרב</h3>
          <p class="small">מחכים לשחקן נוסף שמגיע לזירה, ועונים על אותן 5 שאלות בזמן אמת. מי שעונה נכון ומהר יותר מנצח! מנצח מקבל 🪙50.</p>
          <a class="btn gold big-btn" href="#/duel/${b.id}">מחפשים יריב!</a>
        </div>` : ""}
      <div class="row center-row"><a class="btn ghost" href="${Towns.byId(bid) ? "#/town/" + bid : "#/"}">${Towns.byId(bid) ? "חזרה ל" + b.name : "חזרה למפה"}</a></div>`;

    app.querySelectorAll("[data-quest]").forEach(btn => btn.onclick = () => runSoulQuest(Sages.byId(btn.dataset.quest), b));
    app.querySelectorAll("[data-activate]").forEach(btn => btn.onclick = () => { player.activeSoul = btn.dataset.activate; savePlayer(); viewBuilding(bid); });
    const sg = document.getElementById("sugya");
    if (sg) sg.onclick = () => runSugya(b, machlokot);
  }

  function torahCard(L) {
    if (!L.torah) return "";
    const p = placeById(L.torah), open = isOpen(PLACES.indexOf(p)), st = player.stars[p.id] || 0;
    const prev = PLACES[PLACES.indexOf(p) - 1];
    return `<div class="card torah-card">
      <div class="guide-face" style="background:${p.color}">${p.guide.emoji}</div>
      <div style="flex:1">
        <h3>משימה: ${p.name}</h3>
        <div class="small muted">${p.desc} · עם ${p.guide.name}</div>
        <div class="station-stars">${"★".repeat(st)}<span class="dim">${"★".repeat(3 - st)}</span></div>
        ${open ? `<a class="btn small-btn" href="#/place/${p.id}">למשימה</a>`
          : `<div class="small">🔒 נפתח אחרי המשימה "${prev.name}" ב${locOfTorah(prev.id).name}</div>`}
      </div>
    </div>`;
  }

  // ---------- דו-קרב ----------
  let duelSession = null;
  function stopDuel() { if (duelSession) { duelSession.close(); duelSession = null; } }

  async function viewDuel(locId) {
    const L = City.byId(locId);
    if (!L || !L.duel || !player.name) return viewCity();
    setTab("map");
    if (!player.id) { player.id = Math.random().toString(36).slice(2, 10); savePlayer(); }
    let pool = [];
    try { pool = await db.approved(); } catch (e) { /* נשתמש בשאלות של החכמים */ }
    pool = pool.concat(...Sages.SAGES.map(s => s.quest));
    const makeQuestions = () => db.shuffle(pool).slice(0, 5).map(q => ({ question: q.question, answers: q.answers, correct: q.correct, source: q.source || "" }));
    const soul = player.activeSoul && Sages.byId(player.activeSoul);
    // מזהה לכל לשונית, כדי ששתי לשוניות באותו דפדפן ייחשבו שני שחקנים
    let tab = null;
    try { tab = sessionStorage.getItem("teire.tab") || Math.random().toString(36).slice(2, 7); sessionStorage.setItem("teire.tab", tab); } catch (e) { tab = Math.random().toString(36).slice(2, 7); }
    const me = { id: player.id + "-" + tab, name: player.name, look: player.look, soul: soul ? soul.name : "" };

    app.innerHTML = `
      <div class="place-hero" style="--c:${L.color}">
        <div class="place-icon">⚔️</div>
        <h1>זירת הדו-קרב ב${L.name}</h1>
      </div>
      <div class="card center">
        <div class="searching">${avatarSVG(player.look, 80)}<span class="vs">VS</span><span class="who">❔</span></div>
        <h3 id="wtitle">מחפשים יריב...</h3>
        <p class="small muted" id="wcount"></p>
        ${db.realtime ? "" : `<p class="notice small">כרגע האתר במצב מקומי, ולכן אפשר להיפגש רק עם לשונית אחרת באותו דפדפן. אחרי חיבור מסד הנתונים תפגשו שחקנים מכל מקום.</p>`}
        <div class="row center-row">
          <button class="btn ghost" id="botbtn">לשחק נגד ינשופי (המחשב)</button>
          <a class="btn ghost" href="#/b/${L.id}">ביטול</a>
        </div>
      </div>`;

    let game = null;
    const lob = TeireDuel.lobby(locId, me, {
      makeQuestions,
      onWaiting(n) { const el = document.getElementById("wcount"); if (el) el.textContent = n ? `עוד ${n} שחקנים מחכים בזירה` : "אין עדיין עוד שחקנים בזירה. נחכה כאן..."; },
      onStart({ opponent, questions, send }) { game = playDuel(L, opponent, questions, send, null); },
      onMsg(m) { if (game) game.onMsg(m); },
      onOpponentLeft() { if (game) game.opponentLeft(); },
    });
    duelSession = { close() { lob.close(); if (game) game.close(); } };
    document.getElementById("botbtn").onclick = () => {
      lob.close();
      const questions = makeQuestions();
      let g = null;
      const b = TeireDuel.bot(questions, m => g && g.onMsg(m));
      g = game = playDuel(L, b.opponent, questions, () => {}, b);
      duelSession = { close() { b.close(); g.close(); } };
    };
  }

  function playDuel(L, opp, questions, send, bot) {
    const TIME = 15000;
    let qi = 0, myScore = 0, oppScore = 0, done = false;
    let mine = null, theirs = {}, qStart = 0, timer = null, oppTimer = null;
    const oppAvatar = opp.bot ? `<span class="bot-face">🦉</span>` : avatarSVG(opp.look, 44);
    const points = (ok, ms) => ok ? 10 + Math.max(0, Math.round(5 * (1 - ms / TIME))) : 0;

    function header() {
      return `<div class="duel-head">
        <div class="duel-p"><span class="duel-av">${avatarSVG(player.look, 44)}</span><b>${esc(player.name)}</b><span class="duel-score" id="ms">${myScore}</span></div>
        <div class="duel-vs">⚔️<div class="small">${qi + 1}/${questions.length}</div></div>
        <div class="duel-p"><span class="duel-av">${oppAvatar}</span><b>${esc(opp.name)}</b><span class="duel-score" id="os">${oppScore}</span></div>
      </div>`;
    }

    function show() {
      const q = questions[qi];
      mine = null; qStart = Date.now();
      const order = db.shuffle([0, 1, 2, 3]);
      app.innerHTML = `${header()}
        <div class="timer"><span id="tbar"></span></div>
        <div class="card">
          ${q.verse ? `<div class="verse"><div class="verse-text">${esc(q.verse)}</div><div class="verse-ref">${esc(q.ref || "")}</div></div>` : ""}
          <div class="qtext">${esc(q.question)}</div>
          <div class="answers">${order.map((orig, i) => `<button class="answer" data-orig="${orig}"><span class="letter">${LETTERS[i]}</span>${esc(q.answers[orig])}</button>`).join("")}</div>
          <div id="fb" class="small muted center" style="margin-top:12px"></div>
        </div>`;
      requestAnimationFrame(() => { const b = document.getElementById("tbar"); if (b) { b.style.transition = `width ${TIME}ms linear`; b.style.width = "0%"; } });
      app.querySelectorAll(".answer").forEach(btn => btn.onclick = () => answer(Number(btn.dataset.orig)));
      timer = setTimeout(() => { if (mine === null) answer(-1); }, TIME);
      if (bot) bot.ask(qi);
      if (theirs[qi]) markOpp();
    }

    function answer(choice) {
      if (mine !== null || done) return;
      mine = { choice, ms: Date.now() - qStart };
      clearTimeout(timer);
      send({ t: "ans", q: qi, choice: mine.choice, ms: mine.ms });
      app.querySelectorAll(".answer").forEach(b => { b.disabled = true; if (Number(b.dataset.orig) === choice) b.classList.add("picked"); });
      if (theirs[qi]) reveal();
      else {
        document.getElementById("fb").textContent = `מחכים ל${opp.name}...`;
        oppTimer = setTimeout(() => { if (!theirs[qi]) { theirs[qi] = { choice: -1, ms: TIME }; reveal(); } }, Math.max(1000, TIME - mine.ms + 3000));
      }
    }

    function markOpp() {
      const el = document.getElementById("fb");
      if (el && mine === null) el.textContent = `${opp.name} כבר ענה!`;
    }

    function reveal() {
      clearTimeout(oppTimer);
      const q = questions[qi], t = theirs[qi];
      const myOk = mine.choice === q.correct, oppOk = t.choice === q.correct;
      myScore += points(myOk, mine.ms); oppScore += points(oppOk, t.ms);
      app.querySelectorAll(".answer").forEach(b => {
        const o = Number(b.dataset.orig);
        if (o === q.correct) b.classList.add("correct");
        else if (o === mine.choice) b.classList.add("wrong");
        if (o === t.choice) b.insertAdjacentHTML("beforeend", `<span class="opp-pick">${opp.bot ? "🦉" : "👤"} ${esc(opp.name)}</span>`);
      });
      document.getElementById("ms").textContent = myScore;
      document.getElementById("os").textContent = oppScore;
      document.getElementById("fb").innerHTML = `${myOk ? "✓ צדקת!" : "✗ לא נכון"} · ${esc(opp.name)}: ${oppOk ? "צדק" : "טעה"}`;
      setTimeout(() => { if (done) return; qi++; if (qi < questions.length) show(); else finish(); }, 2600);
    }

    function finish(left) {
      if (done) return;
      done = true; clearTimeout(timer); clearTimeout(oppTimer);
      const win = left || myScore > oppScore, draw = !left && myScore === oppScore;
      const coins = win ? 50 : draw ? 25 : 10;
      player.coins += coins; player.duels = player.duels || { win: 0, lose: 0 };
      if (win) player.duels.win++; else if (!draw) player.duels.lose++;
      savePlayer();
      if (win) confetti();
      app.innerHTML = `
        <div class="card center result">
          <div class="place-icon">${win ? "🏆" : draw ? "🤝" : "💪"}</div>
          <h2>${left ? `${esc(opp.name)} יצא מהזירה, ניצחת!` : win ? "ניצחת בדו-קרב!" : draw ? "תיקו!" : `${esc(opp.name)} ניצח הפעם`}</h2>
          <div class="duel-final"><span>${esc(player.name)}: <b>${myScore}</b></span><span>${esc(opp.name)}: <b>${oppScore}</b></span></div>
          <p>הרווחתם <b>🪙 ${coins}</b></p>
          <div class="row center-row">
            <a class="btn gold" href="#/duel/${L.id}">עוד דו-קרב</a>
            <a class="btn ghost" href="#/b/${L.id}">חזרה ל${L.name}</a>
          </div>
        </div>`;
      stopDuel();
    }

    show();
    return {
      onMsg(m) {
        if (m.t !== "ans" || done) return;
        theirs[m.q] = { choice: m.choice, ms: m.ms };
        if (m.q === qi) { if (mine !== null) reveal(); else markOpp(); }
      },
      opponentLeft() { finish(true); },
      close() { done = true; clearTimeout(timer); clearTimeout(oppTimer); },
    };
  }

  // שאלות על החכם + "מה הוא סובר" במחלוקות שלו
  function runSoulQuest(sage, b) {
    const views = Sages.MACHLOKOT
      .filter((m, i, all) => sage.id in m.opinions && all.findIndex(x => x.question === m.question) === i)
      .slice(0, 2)
      .map(m => ({ ...m, correct: m.opinions[sage.id], prompt: `מה סובר ${esc(sage.school)}?` }));
    const items = [...db.shuffle(sage.quest), ...views];
    const need = Math.ceil(items.length * .75);
    runQuiz(sageGuide(sage), items, (score, n, coins) => {
      const passed = score >= need;
      if (passed) {
        coins += 100;
        if (!player.souls.includes(sage.id)) player.souls.push(sage.id);
        player.activeSoul = sage.id;
        confetti();
      }
      player.coins += coins;
      savePlayer();
      app.innerHTML = `
        ${guideBubble(sageGuide(sage), passed ? "מעכשיו הנשמה שלי מלווה אותך. כשתלמד את הסוגיות שלי, תענה לפי השיטה שלי!" : `כמעט! צריך ${need} תשובות נכונות כדי לקבל את הנשמה. נסה שוב!`, passed ? "happy" : "")}
        <div class="card center result">
          ${passed ? `<div class="soul-get">${Sages.sageSVG(sage, 110)}<div class="soul-glow"></div></div>
            <h2>עיבור נשמה!</h2><p>נשמת <b>${esc(sage.name)}</b> נכנסה בכם.</p>` : ""}
          <div class="big">${score}/${n}</div>
          <p>הרווחתם <b>🪙 ${coins}</b>${passed ? " (כולל 100 בונוס על עיבור הנשמה)" : ""}</p>
          <div class="row center-row">
            ${passed ? "" : `<button class="btn gold" id="again">שוב</button>`}
            <a class="btn" href="#/b/${b.id}">חזרה ל${b.name}</a>
            <a class="btn ghost" href="#/">למפה</a>
          </div>
        </div>`;
      const again = document.getElementById("again");
      if (again) again.onclick = () => runSoulQuest(sage, b);
    }, sage.building ? "#/b/" + sage.building : "#/");
  }

  // מחלוקות: אם נשמת אחד מבעלי המחלוקת פעילה, התשובה הנכונה היא השיטה שלו
  function runSugya(b, machlokot) {
    const soul = player.activeSoul && Sages.byId(player.activeSoul);
    const local = Sages.SAGES.filter(s => s.building === b.id).map(s => s.id);
    const items = db.shuffle(machlokot).map(m => {
      const explain = Object.entries(m.opinions).map(([id, a]) => `<div><b>${esc(Sages.byId(id).school)}:</b> ${esc(m.answers[a])}</div>`).join("");
      if (soul && soul.id in m.opinions) {
        return { ...m, correct: m.opinions[soul.id], reward: 20, cheer: "כשיטתך!", explain,
          prompt: `🕯️ נשמת ${esc(soul.name)} בך. מה אתה סובר?` };
      }
      const who = Object.keys(m.opinions).find(id => local.includes(id)) || Object.keys(m.opinions)[0];
      return { ...m, correct: m.opinions[who], reward: 10, explain, prompt: `מה סובר ${esc(Sages.byId(who).school)}?` };
    });
    const host = Sages.SAGES.find(s => s.building === b.id);
    runQuiz(sageGuide(host), items, (score, n, coins) => {
      player.coins += coins; savePlayer();
      const stars = starsFor(score, n);
      if (stars >= 2) confetti();
      app.innerHTML = `
        <div class="card center result">
          ${resultStars(stars)}
          <div class="big">${score}/${n}</div>
          <p>הרווחתם <b>🪙 ${coins}</b></p>
          <div class="row center-row">
            <a class="btn" href="#/b/${b.id}">חזרה ל${b.name}</a>
            <a class="btn ghost" href="#/">למפה</a>
          </div>
        </div>`;
    }, host.building ? "#/b/" + host.building : "#/");
  }

  // ---------- היכל הנשמות ----------
  function viewSouls() {
    if (!player.name) return viewOnboarding();
    setTab("souls");
    app.innerHTML = `
      <div class="card center">
        <h2>🕯️ היכל הנשמות</h2>
        <p class="small muted">בכל בית בעיר יושבים תנאים ואמוראים. ענו על השאלות שלהם וקבלו "עיבור נשמה". כשהנשמה פעילה, בלימוד הסוגיא תענו לפי השיטה של אותו חכם.</p>
        <a class="btn gold small-btn" href="#/leaders">🏆 טבלת האלופים</a>
      </div>
      <div class="souls">
        ${Sages.SAGES.map(s => {
          const got = player.souls.includes(s.id), on = player.activeSoul === s.id;
          const b = City.byId(s.building);
          return `<button class="soul ${got ? "got" : ""} ${on ? "on" : ""}" data-s="${s.id}">
            <span class="soul-pic">${Sages.sageSVG(s, 64)}</span>
            <b>${s.name}</b>
            <span class="small">${s.era === "tanna" ? "תנא" : "אמורא"} · ${b.name}</span>
            <span class="soul-state">${on ? "🕯️ פעילה" : got ? "הפעלה" : "🔒 לא נאספה"}</span>
          </button>`;
        }).join("")}
      </div>`;
    app.querySelectorAll(".soul").forEach(btn => btn.onclick = () => {
      const s = Sages.byId(btn.dataset.s);
      if (player.souls.includes(s.id)) { player.activeSoul = s.id; savePlayer(); viewSouls(); toast("🕯️ נשמת " + s.name + " פעילה"); }
      else { location.hash = "#/b/" + s.building; }
    });
  }

  // ---------- משחקים בקריית התורה ----------
  let game = null; // המשחק שרץ עכשיו (נעצר במעבר עמוד)
  function stopGame() { if (game) { game.stop(); game = null; } }
  const X = window.TeireExtras;
  // חוזרים למקום שממנו נכנסו למשחק (חברון, קריית התורה וכו'). אם אין, חוזרים לקריית התורה.
  const gameExitHash = () => { try { return sessionStorage.getItem("teire.returnTo") || "#/town/torah"; } catch (e) { return "#/town/torah"; } };
  const backToTorah = {
    toString() {
      const h = gameExitHash();
      const label = h.startsWith("#/town/") ? (Towns.byId(h.split("/")[2]) || { name: "הקודם" }).name : "הקודם";
      return `<div class="row center-row"><a class="btn ghost" href="${h}">חזרה ל${label}</a></div>`;
    },
  };
  function bestOf(key, score) {
    player.best = player.best || {};
    const was = player.best[key] || 0;
    if (score > was) player.best[key] = score;
    return score > was && score > 0;
  }
  // החלקה ימינה/שמאלה, חיצים או הקשה על צד. cb("left" | "right")
  function sideInput(el, cb) {
    let sx = null;
    el.addEventListener("pointerdown", e => { sx = e.clientX; });
    el.addEventListener("pointerup", e => {
      if (sx == null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) cb(dx > 0 ? "right" : "left");
      else { const side = e.target.closest("[data-side]"); if (side) cb(side.dataset.side); }
    });
    const onKey = e => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); cb(e.key === "ArrowLeft" ? "left" : "right"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }
  // מקור נכון בצד אקראי
  const sidesFor = item => Math.random() < .5 ? { left: item.right, right: item.wrong, correct: "left" } : { left: item.wrong, right: item.right, correct: "right" };

  function gameIntro(key, title, icon, rules, start, extra = "") {
    setTab("map");
    const best = (player.best || {})[key] || 0;
    app.innerHTML = `
      <div class="place-hero" style="--c:${key === "race" ? "#dc2626" : "#db2777"}">
        <div class="place-icon">${icon}</div><h1>${title}</h1>
        <p>השיא שלכם: ${best}</p>
      </div>
      <div class="card center">
        <p>${rules}</p>
        ${extra}
        <button class="btn gold big-btn" id="go">מתחילים!</button>
      </div>${backToTorah}`;
    document.getElementById("go").onclick = start;
  }

  function gameOver(key, score, perPoint) {
    const coins = score * perPoint, record = bestOf(key, score);
    player.coins += coins; savePlayer();
    if (record) confetti();
    // אחרי שהדף מוצג: שומרים את הציון ומציגים את הטופ 10 של המשחק
    setTimeout(() => loadTop10(key, score), 0);
    return `<div class="card center result">
      <h2>${record ? "🏆 שיא חדש!" : "המשחק נגמר"}</h2>
      <div class="big">${score}</div>
      <p>הרווחתם <b>🪙 ${coins}</b></p>
      ${key === "race" ? journeyAfter(s => s.kind === "race", score >= JOURNEY[1].need) : ""}
      <div id="top10"><p class="muted small">טוענים את הטופ 10...</p></div>
      <div class="row center-row"><button class="btn gold" id="again">שוב</button><a class="btn ghost" href="${gameExitHash()}">חזרה</a></div>
    </div>`;
  }
  const GAME_TITLES = { swipe: "אתגר המקורות", race: "מרוץ המקורות", duel: "דו-קרב" };
  async function loadTop10(key, score) {
    const box = document.getElementById("top10");
    if (!box) return;
    try {
      if (score > 0 && player.name) await db.addGameScore(key, player.name, score);
      const rows = await db.topGameScores(key);
      const el = document.getElementById("top10");
      if (!el) return;
      el.innerHTML = `
        <h3 style="margin:10px 0 6px">🏅 טופ 10 · ${GAME_TITLES[key] || key}</h3>
        ${rows.length ? `<ol class="leaders">${rows.map((r, i) => `
          <li class="${r.name === player.name && r.score === score ? "me-row" : ""}"><span>${i + 1}. ${esc(r.name)}</span><b>${r.score}</b></li>`).join("")}</ol>`
          : `<p class="muted small">עוד אין ציונים במשחק הזה.</p>`}`;
    } catch (e) {
      const el = document.getElementById("top10");
      if (el) el.innerHTML = `<p class="muted small">הטופ 10 לא זמין כרגע.</p>`;
    }
  }

  // ---- אתגר המקורות: משפט רץ אליכם, 5 שניות להחליק לצד של המקור הנכון ----
  function viewSwipe() {
    if (!player.name) return viewOnboarding();
    gameIntro("swipe", "אתגר המקורות", "⚡", "משפט רץ אליכם! יש לכם <b>5 שניות</b> להחליק ימינה או שמאלה (או ללחוץ על החיצים במקלדת) אל הצד של המקור הנכון. שלוש טעויות והמשחק נגמר.", playSwipe);
  }
  function playSwipe() {
    stopGame();
    const deck = db.shuffle(X.SOURCES);
    let i = 0, score = 0, lives = 3, timer = 0, locked = false, offKeys = null;
    app.innerHTML = `
      <div class="swipe-arena" id="arena">
        <div class="arena-top"><span id="lives"></span><span class="pill dark" id="score">⭐ 0</span></div>
        <button class="side-pad left" data-side="left"><span>⬅</span><b id="sl"></b></button>
        <button class="side-pad right" data-side="right"><b id="sr"></b><span>➡</span></button>
        <div class="runner" id="card"></div>
        <div class="timebar"><span id="tb"></span></div>
        <div class="swipe-hint">החליקו או הקישו על הצד הנכון</div>
      </div>${backToTorah}`;
    const card = document.getElementById("card"), tb = document.getElementById("tb"), arena = document.getElementById("arena");
    let sides;
    function round() {
      if (lives <= 0) return end();
      const item = deck[i++ % deck.length];
      sides = sidesFor(item); sides.item = item;
      document.getElementById("lives").textContent = "❤️".repeat(lives) + "🤍".repeat(3 - lives);
      document.getElementById("score").textContent = "⭐ " + score;
      document.getElementById("sl").textContent = sides.left;
      document.getElementById("sr").textContent = sides.right;
      arena.querySelectorAll(".side-pad").forEach(p => p.classList.remove("good", "bad"));
      card.className = "runner"; card.textContent = item.text;
      tb.style.transition = "none"; tb.style.width = "100%";
      void card.offsetWidth;
      card.classList.add("run"); tb.style.transition = "width 5s linear"; tb.style.width = "0%";
      locked = false;
      timer = setTimeout(() => answer(null), 5000);
    }
    function answer(side) {
      if (locked) return; locked = true; clearTimeout(timer);
      const ok = side === sides.correct;
      if (ok) score++; else lives--;
      card.className = "runner " + (side ? "fly-" + side : "fly-timeout");
      arena.querySelector(`.side-pad.${sides.correct}`).classList.add("good");
      if (side && !ok) arena.querySelector(`.side-pad.${side}`).classList.add("bad");
      tb.style.transition = "none";
      document.getElementById("score").textContent = "⭐ " + score;
      if (!ok) toast((side ? "❌ " : "⏰ ") + "המקור: " + sides.item.right);
      timer = setTimeout(round, ok ? 600 : 1300);
    }
    function end() {
      stopGame();
      app.innerHTML = gameOver("swipe", score, 3) + backToTorah;
      document.getElementById("again").onclick = playSwipe;
    }
    offKeys = sideInput(arena, s => answer(s));
    game = { stop() { clearTimeout(timer); if (offKeys) offKeys(); } };
    round();
  }

  // ---- מרוץ המקורות: מכשול עם משפט מתקרב, נוסעים לנתיב של המקור הנכון ----
  // מכוניות המוסך: בונוס מהירות, ומגן שסופג פגיעה אחת. look = איך המכונית מצוירת (js/race.js)
  const CARS = [
    { id: "basic", icon: "🏎️", name: "מירוץ אדומה", price: 0, boost: 1, shield: 0, note: "מכונית מירוץ אדומה, בלי בונוסים.", look: { color: "#d61f26", stripe: "#15171b", plate: "תורה" } },
    { id: "sport", icon: "🚗", name: "ספורט טורבו", price: 40, boost: 1.2, shield: 0, note: "20% מהירות יותר מהרגיל.", look: { color: "#f5c518", stripe: "#111827", wing: "#111827", plate: "טורבו" } },
    { id: "jeep", icon: "🚙", name: "ג׳יפ משוריין", price: 90, boost: 1.2, shield: 1, note: "20% מהירות יותר, ומגן אחד שסופג פגיעה אחת.", look: { color: "#5b6b3a", shape: "jeep", plate: "מגן" } }
  ];
  const raceCar = () => CARS.find(c => c.id === player.car) || CARS[0];
  function garageHTML() {
    const cur = raceCar();
    return `<div class="garage">
        <h3>🛠️ המוסך</h3>
        <div class="row center-row">${CARS.map(c => {
          const have = c.price === 0 || player.owned.includes("car:" + c.id);
          const on = cur.id === c.id;
          return `<button class="btn ghost small-btn garage-car ${on ? "on" : ""}" data-car="${c.id}"><canvas class="car-prev" data-prev="${c.id}"></canvas>${c.name}<br><span class="small">${on ? "בשימוש ✓" : have ? "לבחור" : "🪙 " + c.price}</span></button>`;
        }).join("")}</div>
        <p class="small muted">${cur.note}</p>
        <p class="small" id="garmsg"></p>
      </div>`;
  }
  // מרוץ המקורות: כל מרוץ נעשה קשה יותר (שערים 1-5 ספרים, 6-10 פרקים, ומשם פסוקים), וברמפות שאלה קשה יותר.
  // המסלולים שונים בנוף ובמהירות, וכל מסלול נפתח אחרי RACE_UNLOCK שערים במסלול שלפניו
  const RACE_UNLOCK = 10;
  const RACE_TRACKS = [
    { n: 1, theme: "forest", name: "יער הגליל", icon: "🌲", speed: 1, coins: 4 },
    { n: 2, theme: "desert", name: "מדבר יהודה", icon: "🏜️", speed: 1.08, coins: 5 },
    { n: 3, theme: "sea", name: "חוף הים", icon: "🌊", speed: 1.16, coins: 6 },
    { n: 4, theme: "jerusalem", name: "ירושלים", icon: "🏛️", speed: 1.24, coins: 7 },
  ];
  const raceStages = () => X.RACE_WORLDS.length ? X.RACE_WORLDS : [{ n: 3, name: "פסוקים", icon: "💎", items: X.RACE }];
  const raceBest = n => ((player.raceBest || {})["t" + n]) || 0;
  // מי שכבר הגיע ל-10 במרוץ מקבל את המסלול השני פתוח
  const raceUnlocked = () => {
    if (!player.raceTracks) player.raceTracks = ((player.best || {}).race || 0) >= RACE_UNLOCK ? 2 : 1;
    return player.raceTracks;
  };
  const raceOpen = n => n <= raceUnlocked();
  const raceTrack = () => RACE_TRACKS.find(w => w.n === player.raceTrack && raceOpen(w.n)) || RACE_TRACKS[0];
  function worldsHTML() {
    const cur = raceTrack();
    return `<div class="race-worlds">
      <h3>🗺️ בחרו מסלול</h3>
      <p class="small muted">כל מרוץ מתחיל בקל (באיזה ספר?), עובר לפרקים ומשער 11 לפסוקים. בשערים 5, 10 ו-15 יש רמפה 🛫</p>
      <div class="rw-list">${RACE_TRACKS.map(w => {
        const open = raceOpen(w.n);
        return `<button class="rw ${w.n === cur.n ? "on" : ""} ${open ? "" : "locked"}" data-world="${w.n}" ${open ? "" : "aria-disabled=\"true\""}>
          <span class="rw-icon">${open ? w.icon : "🔒"}</span>
          <b>${w.name}</b>
          <span class="small">${open ? `🪙 ${w.coins} לנקודה` : `${RACE_UNLOCK} שערים ב${RACE_TRACKS[w.n - 2].name}`}</span>
          ${open && raceBest(w.n) ? `<span class="small">שיא: ${raceBest(w.n)} שערים</span>` : ""}
        </button>`;
      }).join("")}</div>
      <p class="small" id="rwmsg"></p>
    </div>`;
  }
  function viewRace() {
    if (!player.name) return viewOnboarding();
    gameIntro("race", "מרוץ המקורות", "🏎️", "שער עם שני שלטים מתקרב, ובכל שלט מקור אחר למשפט שלמעלה. עברו לנתיב של המקור הנכון לפני שמגיעים לשער: הזיזו את הג'ויסטיק, החליקו, הקישו על צד הכביש או השתמשו בחיצים. נתיב לא נכון, או להישאר באמצע מול המחסום, ואתם בחוץ! כל 4 תשובות ברצף: טורבו ונקודת בונוס. ברמפה המכונית עפה, נכנסים לתא הנהג ומטים את הגוף לצד המקור הנכון: נחיתה נכונה שווה 3 נקודות.", playRace, worldsHTML() + garageHTML());
    app.querySelectorAll("[data-world]").forEach(b => b.onclick = () => {
      const n = Number(b.dataset.world);
      if (!raceOpen(n)) {
        const prev = RACE_TRACKS[n - 2];
        document.getElementById("rwmsg").innerHTML = `<span class="notice err">🔒 עברו ${RACE_UNLOCK} שערים ב${prev.name} כדי לפתוח את המסלול הזה (השיא שלכם שם: ${raceBest(prev.n)}).</span>`;
        return;
      }
      player.raceTrack = n; savePlayer(); viewRace();
    });
    app.querySelectorAll("[data-prev]").forEach(cv => TeireRace.preview(cv, CARS.find(c => c.id === cv.dataset.prev).look));
    app.querySelectorAll(".garage-car").forEach(b => b.onclick = () => {
      const c = CARS.find(x => x.id === b.dataset.car);
      const have = c.price === 0 || player.owned.includes("car:" + c.id);
      if (!have) {
        if (player.coins < c.price) { document.getElementById("garmsg").innerHTML = `<span class="notice err">חסרים לכם ${c.price - player.coins} מטבעות.</span>`; return; }
        player.coins -= c.price; player.owned.push("car:" + c.id); confetti();
      }
      player.car = c.id; savePlayer(); viewRace();
    });
  }
  // ג'ויסטיק: גוררים את הידית שמאלה או ימינה (או לוחצים על החצים), והידית נוטה לפי הנתיב של המכונית
  function joystick(pad, r) {
    const base = pad.querySelector(".joy-base"), knob = pad.querySelector(".joy-knob");
    let drag = null;
    const show = (dx, lane) => {
      knob.style.transform = `translateX(${dx}px) rotate(${dx / 2}deg)`;
      pad.dataset.lane = lane;
    };
    const reach = () => base.clientWidth * 0.32;
    const laneFor = dx => dx < -reach() * .45 ? "left" : dx > reach() * .45 ? "right" : "mid";
    base.addEventListener("pointerdown", e => {
      e.preventDefault(); e.stopPropagation();
      drag = { x: e.clientX, id: e.pointerId };
      try { base.setPointerCapture(e.pointerId); } catch (err) { /* דפדפן ישן */ }
      knob.classList.add("held");
    });
    base.addEventListener("pointermove", e => {
      if (!drag || e.pointerId !== drag.id) return;
      const R = reach(), dx = Math.max(-R, Math.min(R, e.clientX - drag.x)), lane = laneFor(dx);
      show(dx, lane);
      if (lane !== r.lane) r.setLane(lane);
    });
    const up = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const moved = Math.abs(e.clientX - drag.x) > 8;
      drag = null; knob.classList.remove("held");
      // הקשה בלי גרירה על צד הבסיס: זזים לצד הזה
      if (!moved) {
        const b = base.getBoundingClientRect(), x = e.clientX - b.left;
        if (x < b.width * .38) r.setLane("left"); else if (x > b.width * .62) r.setLane("right"); else r.setLane("mid");
      }
      sync(r.lane, true);
    };
    base.addEventListener("pointerup", up);
    base.addEventListener("pointercancel", up);
    pad.querySelectorAll("[data-joy]").forEach(b => b.addEventListener("pointerdown", e => {
      e.preventDefault(); e.stopPropagation();
      b.classList.add("hit"); setTimeout(() => b.classList.remove("hit"), 150);
      r.steer(b.dataset.joy);
      sync(r.lane, true);
    }));
    let last = "";
    function sync(lane, force) {
      if (drag || (!force && lane === last)) return;
      last = lane;
      show(lane === "left" ? -reach() : lane === "right" ? reach() : 0, lane);
    }
    return sync;
  }
  // המשחק עצמו מצויר ב-js/race.js; כאן רק בונים את הדף ומעדכנים את הטקסטים
  function playRace() {
    stopGame();
    const car0 = raceCar(), world = raceTrack(), stages = raceStages();
    app.innerHTML = `
      <div class="race" id="race">
        <div class="race-q" id="rq">מתכוננים לזינוק...</div>
        <div class="track" id="track">
          <canvas id="rc" aria-label="כביש המרוץ"></canvas>
          <div class="tap-zone left" data-side="left"></div><div class="tap-zone right" data-side="right"></div>
          <div class="hud-l"><div><span>מקום</span><b id="hpos">5/5</b></div><div><span>הקפה</span><b id="hdist">0%</b></div></div>
          <div class="hud-r"><div class="hud-spd"><b id="hspd">0</b><span>קמ״ש</span></div><div class="hud-time" id="htime">⏱ 00:00.00</div></div>
          <button class="hud-snd" id="hsnd" aria-label="קולות המרוץ"></button>
          <div class="race-banner" id="hban"></div>
          <div class="lane-label left" data-side="left" id="ll"></div>
          <div class="lane-label right" data-side="right" id="lr"></div>
          <div class="race-tag">${world.icon} ${world.name}</div>
        </div>
        <div class="joy-pad" id="joy" data-lane="mid">
          <span class="joy-info"><span class="pill dark" id="rs">🏁 0</span><span class="pill dark" id="rsh" ${car0.shield ? "" : "hidden"}>🛡️ ${car0.shield}</span></span>
          <button class="joy-btn" data-joy="left" aria-label="שמאלה">◀</button>
          <div class="joy-base" role="slider" aria-label="ג'ויסטיק: שמאל, אמצע, ימין"><span class="joy-groove"></span><span class="joy-knob"></span></div>
          <button class="joy-btn" data-joy="right" aria-label="ימינה">▶</button>
          <span class="joy-world" id="jstage">${stages[0].icon} ${stages[0].name}</span>
        </div>
      </div>${backToTorah}`;
    const $ = id => document.getElementById(id), track = $("track"), ban = $("hban");
    let joySync = null;
    // מגללים כך שהשאלה בראש המסך (אחרי לחיצה על "מתחילים" הדף נשאר גלול למטה)
    $("race").scrollIntoView({ block: "start" });
    let banT = 0, lastHud = "";
    if (window.Music && Music.duck) Music.duck(true);
    const r = TeireRace.start({
      root: track, look: car0.look, boost: car0.boost, shield: car0.shield, decks: stages.map(st => db.shuffle(st.items)), theme: world.theme, speed: world.speed, driver: { name: player.name }, sidesFor,
      ui: {
        question(item, sides) {
          $("rq").textContent = item ? "\"" + item.text + "\"" : "🔥 טורבו!";
          $("ll").textContent = sides ? sides.left : ""; $("lr").textContent = sides ? sides.right : "";
          // מקור ארוך: אות קטנה יותר, כדי שכל המקור ייראה
          $("ll").classList.toggle("long", !!sides && sides.left.length > 18);
          $("lr").classList.toggle("long", !!sides && sides.right.length > 18);
          track.classList.toggle("no-labels", !sides);
        },
        score(s) { $("rs").textContent = "🏁 " + s; },
        banner(text, kind) {
          ban.textContent = text; ban.className = "race-banner show " + kind;
          if (kind === "crash") track.classList.add("crash");
          clearTimeout(banT); banT = setTimeout(() => { ban.className = "race-banner"; }, kind === "count" || kind === "go" ? 800 : 1500);
        },
        toast,
        stage(i) {
          const st = stages[i];
          $("jstage").textContent = `${st.icon} ${st.name}`;
          ban.textContent = `${st.icon} עולים ל${st.name}!`; ban.className = "race-banner show lap";
          clearTimeout(banT); banT = setTimeout(() => { ban.className = "race-banner"; }, 1600);
        },
        // רמפה: בתא הנהג המקורות גדולים יותר
        ramp(st) { track.classList.toggle("cockpit", st === "cockpit"); track.classList.toggle("ramp-near", st === "near"); },
        hud(h) {
          if (joySync) joySync(h.lane);
          const t = h.time, mm = String(Math.floor(t / 60)).padStart(2, "0"), ss = (t % 60).toFixed(2).padStart(5, "0");
          const key = [h.kmh, h.place, h.lapPct, mm, ss, h.shield].join("|");
          if (key === lastHud) return;
          lastHud = key;
          $("hspd").textContent = h.kmh; $("hpos").innerHTML = `<i>${h.place}</i>/${h.of}`; $("hdist").textContent = h.lapPct + "%";
          $("htime").textContent = `⏱ ${mm}:${ss}`;
          $("rsh").textContent = "🛡️ " + h.shield;
        },
        end(score, gates) {
          stopGame();
          // שיא שערים לכל מסלול, ופתיחת המסלול הבא
          player.raceBest = player.raceBest || {};
          const passed = Math.max(0, (gates || 1) - 1), next = RACE_TRACKS.find(w => w.n === world.n + 1);
          const nextWasOpen = next && raceOpen(next.n);
          if (passed > raceBest(world.n)) player.raceBest["t" + world.n] = passed;
          if (next && passed >= RACE_UNLOCK && !nextWasOpen) player.raceTracks = next.n;
          savePlayer();
          app.innerHTML = gameOver("race", score, world.coins) + backToTorah;
          if (next && !nextWasOpen && raceOpen(next.n)) {
            document.querySelector(".result h2").insertAdjacentHTML("afterend", `<p class="notice ok">🔓 נפתח מסלול חדש: ${next.icon} ${next.name}! <a href="#/race" id="gonext">לעבור אליו</a></p>`);
            document.getElementById("gonext").onclick = () => { player.raceTrack = next.n; savePlayer(); };
          }
          document.getElementById("again").onclick = playRace;
        },
      },
    });
    const snd = $("hsnd"), renderSnd = () => { snd.textContent = r.soundOn ? "🔊" : "🔇"; };
    renderSnd();
    snd.addEventListener("pointerup", e => { e.stopPropagation(); r.toggleSound(); renderSnd(); });
    const offKeys = sideInput(track, s => r.steer(s));
    joySync = joystick($("joy"), r);
    game = { stop() { r.stop(); offKeys(); clearTimeout(banT); if (window.Music && Music.duck) Music.duck(false); } };
  }

  // ---- היכל הפלפולים: חדר חשוך, המצלמה "חותכת" לדובר כמו בקומיקס יפני, רווח או הקשה להמשך ----
  function viewDebate(id) {
    if (!player.name) return viewOnboarding();
    setTab("map");
    const d = X.DEBATES.find(x => x.id === id);
    if (!d) {
      app.innerHTML = `
        <div class="place-hero" style="--c:#111827"><div class="place-icon">🎭</div><h1>היכל הפלפולים</h1><p>שני חכמים, סוגיא אחת. מי צודק?</p></div>
        ${X.DEBATES.map(x => `<a class="card debate-pick" href="#/debate/${x.id}">
          <span class="dp-faces">${x.pair.map(w => Sages.sageSVG(X.SPEAKERS[w], 40)).join("")}</span>
          <span><b>${x.title}</b><br><span class="small muted">${x.pair.map(w => X.SPEAKERS[w].name).join(" נגד ")}<br>📖 ${esc(x.source)}</span></span>
          ${(player.debates || []).includes(x.id) ? "✓" : ""}</a>`).join("")}
        ${backToTorah}`;
      return;
    }
    Music.mood("dark");
    const [A, B] = d.pair;
    app.innerHTML = `
      <div class="dark-room" id="room">
        <div class="speedlines"></div>
        <div class="room-title">${d.title}<span>📖 מקור: ${esc(d.source)}</span></div>
        <div class="speaker left" data-w="${A}">${Sages.sageSVG(X.SPEAKERS[A], 110)}<b>${X.SPEAKERS[A].name}</b></div>
        <div class="speaker right" data-w="${B}">${Sages.sageSVG(X.SPEAKERS[B], 110)}<b>${X.SPEAKERS[B].name}</b></div>
        <div class="debate-bubble" id="bub"></div>
        <div class="room-hint">רווח או הקשה להמשך ▸</div>
      </div>
      <div class="row center-row"><a class="btn ghost" href="#/debate">לפלפולים אחרים</a></div>`;
    const room = document.getElementById("room"), bub = document.getElementById("bub");
    let k = -1, typing = 0, full = "", lastWho;
    function show() {
      k++;
      if (k >= d.lines.length) return finish();
      const [who, text] = d.lines[k];
      room.querySelectorAll(".speaker").forEach(s => s.classList.toggle("on", s.dataset.w === who));
      room.classList.toggle("narrator", !who);
      // כשהדובר מתחלף: חיתוך לדמות שלו, קווי מהירות מאחוריה והבזק קצר
      room.classList.toggle("focus-a", who === A);
      room.classList.toggle("focus-b", who === B);
      if (who && who !== lastWho) { room.classList.remove("cut"); void room.offsetWidth; room.classList.add("cut"); }
      lastWho = who;
      bub.className = "debate-bubble " + (who === A ? "from-left" : who === B ? "from-right" : "from-mid");
      full = (who ? X.SPEAKERS[who].name + ": " : "") + text;
      let n = 0;
      clearInterval(typing);
      typing = setInterval(() => { n += 2; bub.textContent = full.slice(0, n); if (n >= full.length) clearInterval(typing); }, 30);
    }
    function step() {
      if (bub.textContent.length < full.length) { clearInterval(typing); bub.textContent = full; return; } // קודם משלימים את המשפט
      show();
    }
    function finish() {
      stopGame();
      player.debates = player.debates || [];
      const first = !player.debates.includes(d.id);
      if (first) { player.debates.push(d.id); player.coins += 15; savePlayer(); }
      room.querySelectorAll(".speaker").forEach(s => s.classList.add("on"));
      room.classList.remove("focus-a", "focus-b", "narrator", "cut");
      bub.className = "debate-bubble from-mid";
      bub.innerHTML = `<b>סוף הפלפול</b><br>מקור: ${esc(d.source)}${first ? "<br>🪙 +15" : ""}`;
      room.querySelector(".room-hint").textContent = "";
    }
    const onKey = e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); step(); } };
    window.addEventListener("keydown", onKey);
    room.addEventListener("click", step);
    game = { stop() { clearInterval(typing); window.removeEventListener("keydown", onKey); } };
    show();
  }

  // ---------- ספריית הלימוד: משנה, גמרא ושולחן ערוך מספריא ----------
  // רק תגיות עיצוב פשוטות נשארות מהטקסט שמגיע מבחוץ
  function cleanHTML(str) {
    const dec = document.createElement("textarea");
    return String(str).split(/(<[^>]*>)/).map(tok => {
      const m = tok.match(/^<(\/?)(b|strong|i|em|br)\b[^>]*>$/i);
      if (m) return `<${m[1]}${m[2].toLowerCase()}>`;
      if (tok.startsWith("<")) return "";
      dec.innerHTML = tok; return esc(dec.value);
    }).join("");
  }
  const flat = a => Array.isArray(a) ? a.flatMap(flat) : [a];
  async function sefaria(ref) {
    const r = await fetch("https://www.sefaria.org/api/texts/" + encodeURIComponent(ref) + "?context=0&commentary=0");
    const j = await r.json();
    if (j.error) throw new Error(j.error);
    return j;
  }
  function viewLearn(arg) {
    if (!player.name) return viewOnboarding();
    setTab("map");
    const L = X.LIBRARY, kind = L[arg] ? arg : "mishna", K = L[kind];
    const st = Object.assign({ book: 0, n: 1, amud: "a" }, (player.learn || {})[kind]);
    app.innerHTML = `
      <div class="place-hero" style="--c:#7c2d12"><div class="place-icon">📚</div><h1>ספריית הלימוד</h1><p>לומדים משנה, גמרא ושולחן ערוך</p></div>
      <div class="tabs">${Object.entries(L).map(([k, v]) => `<a class="tab ${k === kind ? "on" : ""}" href="#/learn/${k}">${v.name}</a>`).join("")}</div>
      <div class="card learn-pick">
        <select id="lbook">${K.books.map((b, i) => `<option value="${i}" ${i === st.book ? "selected" : ""}>${b.he}</option>`).join("")}</select>
        <label class="small">${K.unit} <input id="ln" type="number" min="${kind === "gemara" ? 2 : 1}" value="${st.n}"></label>
        ${kind === "gemara" ? `<select id="lamud"><option value="a" ${st.amud === "a" ? "selected" : ""}>עמוד א</option><option value="b" ${st.amud === "b" ? "selected" : ""}>עמוד ב</option></select>` : ""}
        <button class="btn small-btn" id="lgo">ללמוד</button>
        ${kind === "gemara" ? `<button class="btn gold small-btn" id="daf">📅 הדף היומי</button>` : ""}
      </div>
      <div class="card learn-text" id="ltext"><p class="muted center">בחרו ${K.unit} ולחצו "ללמוד".</p></div>
      <div class="row center-row"><button class="btn ghost" id="lprev" hidden>⬅ הקודם</button><button class="btn ghost" id="lnext" hidden>הבא ➡</button></div>
      <p class="small muted center">הטקסטים מגיעים מספריא (sefaria.org).</p>
      ${backToTorah}`;
    const box = document.getElementById("ltext");
    let nav = {};
    async function load(ref) {
      box.innerHTML = `<p class="muted center">טוען...</p>`;
      try {
        const j = await sefaria(ref);
        const parts = flat(j.he).filter(Boolean);
        if (!parts.length) throw new Error("empty");
        box.innerHTML = `<h3>${esc(j.heRef || ref)}</h3>` + parts.map((t, i) => `<p><span class="seg">${i + 1}</span> ${cleanHTML(t)}</p>`).join("");
        nav = { next: j.next, prev: j.prev };
        document.getElementById("lnext").hidden = !j.next; document.getElementById("lprev").hidden = !j.prev;
      } catch (e) {
        box.innerHTML = `<p class="notice err">לא הצלחנו לטעון את הטקסט. בדקו את המספר ונסו שוב, או פתחו <a href="https://www.sefaria.org/${encodeURIComponent(ref.replace(/ /g, "_"))}" target="_blank" rel="noopener">בספריא</a>.</p>`;
        document.getElementById("lnext").hidden = document.getElementById("lprev").hidden = true;
      }
    }
    document.getElementById("lgo").onclick = () => {
      const book = Number(document.getElementById("lbook").value), n = Math.max(1, Number(document.getElementById("ln").value) || 1);
      const amud = kind === "gemara" ? document.getElementById("lamud").value : "";
      player.learn = Object.assign(player.learn || {}, { [kind]: { book, n, amud } }); savePlayer();
      load(K.ref(K.books[book].en, n + amud));
    };
    document.getElementById("lnext").onclick = () => nav.next && load(nav.next);
    document.getElementById("lprev").onclick = () => nav.prev && load(nav.prev);
    const daf = document.getElementById("daf");
    if (daf) daf.onclick = async () => {
      box.innerHTML = `<p class="muted center">מחפש את הדף היומי...</p>`;
      try {
        const r = await fetch("https://www.sefaria.org/api/calendars");
        const it = (await r.json()).calendar_items.find(c => c.title && c.title.en === "Daf Yomi");
        load(it.ref);
      } catch (e) { box.innerHTML = `<p class="notice err">לא הצלחנו למצוא את הדף היומי כרגע.</p>`; }
    };
  }

  // ---------- טבלת האלופים ----------
  async function viewLeaders() {
    if (!player.name) return viewOnboarding();
    setTab("souls");
    app.innerHTML = `
      <div class="card center">
        <h2>🏆 טבלת האלופים</h2>
        <p class="small muted">מי אסף הכי הרבה כוכבים ונשמות. בטבלה מופיעים רק מי שבחרו להצטרף, ורק עם השם שלהם.</p>
      </div>
      <div class="card" id="board"><p class="muted center">טוען...</p></div>
      <div id="joinbox"></div>`;
    const list = await db.leaderboard();
    const board = document.getElementById("board"), join = document.getElementById("joinbox");
    if (!board) return; // עברו לעמוד אחר בזמן הטעינה
    if (list === null) {
      board.innerHTML = `<p class="muted center">${db.mode === "local" ? "טבלת האלופים עובדת רק כשהאתר מחובר לשרת." : "טבלת האלופים תיפתח אחרי שהמנהל יריץ את עדכון 2 ב-Supabase."}</p>`;
      return;
    }
    const medal = i => ["🥇", "🥈", "🥉"][i] || `<span class="rank">${i + 1}</span>`;
    board.innerHTML = list.length ? `<ol class="leaders">${list.map((r, i) => `
      <li class="${player.board && r.name === player.name ? "me-row" : ""}">
        <span class="medal">${medal(i)}</span><b>${esc(r.name)}</b>
        <span class="pill dark">⭐ ${r.stars}</span><span class="pill dark">🕯️ ${r.souls}</span>
      </li>`).join("")}</ol>` : `<p class="muted center">עוד אין אף אחד בטבלה. תהיו הראשונים!</p>`;
    join.innerHTML = player.board
      ? `<div class="row center-row"><button class="btn ghost" id="leave">יציאה מהטבלה</button></div>`
      : `<div class="card center"><p class="small">השם <b>${esc(player.name)}</b> יופיע לכל מי שנכנס לאתר, עם הכוכבים והנשמות שלכם. אפשר לצאת מהטבלה בכל רגע.</p>
         <button class="btn gold big-btn" id="joinb">🏆 הצטרפו לטבלה</button></div>`;
    const jb = document.getElementById("joinb");
    if (jb) jb.onclick = async () => {
      if (!player.secret) {
        const a = new Uint8Array(16); crypto.getRandomValues(a);
        player.secret = Array.from(a, x => x.toString(16).padStart(2, "0")).join("");
      }
      player.board = true; savePlayer();
      clearTimeout(scoreTimer);
      await db.submitScore(player.secret, player.name, totalStars(), player.souls.length);
      confetti(); viewLeaders();
    };
    const lb = document.getElementById("leave");
    if (lb) lb.onclick = async () => {
      try { await db.leaveBoard(player.secret); } catch (e) { toast("לא הצלחנו לצאת מהטבלה, נסו שוב"); return; }
      player.board = false; savePlayer(); viewLeaders();
    };
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
        ${db.accounts && accountState.user ? `<p class="muted small">שם משתמש: ${esc(accountState.user.username)} </p>` : ""}
        ${!db.accounts || accountState.user ? `<button class="btn ghost small-btn" id="logout">🚪 התנתקות / החלפת שחקן</button>` : ""}
        <div class="row center-row"><span class="pill dark">⭐ ${totalStars()} כוכבים</span><span class="pill dark">🪙 ${player.coins} מטבעות</span></div>
        <div class="row center-row">
          <a class="btn ghost small-btn" href="#/device">📱 הטלפון שלי: ${esc(deviceName(player.device))}${player.tester ? " · 🛠️ בודק" : ""}</a>
          <a class="btn ghost small-btn" href="#/journey">🧭 ${journeyOn() ? "להמשיך את מסע הפתיחה" : "מסע הפתיחה"}</a>
          <a class="btn ghost small-btn" href="#/leaders">🏆 טבלת האלופים</a>
        </div>
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
      <div class="card">
        <h3>🕯️ מיקום לזמני שבת וחג</h3>
        <p class="small muted">האתר נסגר בשבת ובחג לפי זמני השקיעה וצאת הכוכבים במקום שלכם.</p>
        <select id="loccity">
          ${TeireShabbat.CITIES.map(c => `<option value="${c.name}" ${TeireShabbat.getLocation().name === c.name ? "selected" : ""}>${c.name}</option>`).join("")}
          ${TeireShabbat.CITIES.some(c => c.name === TeireShabbat.getLocation().name) ? "" : `<option selected>${esc(TeireShabbat.getLocation().name)}</option>`}
        </select>
        <div class="row"><button class="btn ghost small-btn" id="mypos">📍 לפי המיקום שלי</button></div>
        <p class="small muted" id="nextsh"></p>
      </div>
      <div class="row center-row"><button class="btn ghost" id="redo">שינוי שם ומראה</button><a class="btn ghost" href="#/review">📋 כל השאלות והמקורות</a></div>
      <p class="small muted center">🎵 צלילי הכלים במוזיקה: FluidR3 GM מאת Frank Wen, ברישיון <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a></p>
      <p class="small muted center"><a href="privacy.html">מדיניות פרטיות</a></p>`;

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
    const lo = document.getElementById("logout");
    if (lo) lo.onclick = () => db.accounts ? logoutPlayer() : signOutLocal();
    const showNext = () => {
      const st = TeireShabbat.status(), el = document.getElementById("nextsh");
      if (el && st.next) el.textContent = `האתר ייסגר ל${st.next.name} ב${dayName(st.next.start)} בשעה ${hm(st.next.start)}`;
    };
    showNext();
    document.getElementById("loccity").onchange = ev => {
      const c = TeireShabbat.CITIES.find(x => x.name === ev.target.value);
      if (c) { TeireShabbat.setLocation({ name: c.name, lat: c.lat, lon: c.lon }); showNext(); toast("📍 " + c.name); }
    };
    document.getElementById("mypos").onclick = () => useMyLocation(() => viewMe());
  }

  // ---------- טופס הצעת שאלה ----------
  // קבוצות הנושאים בטופס הצעת שאלה
  const TOPIC_GROUPS = [
    { name: "📜 תורה ומקרא", test: p => !p.free },
    { name: "📖 משנה וגמרא", test: p => p.id === "mishna" || p.id === "gemara" },
    { name: "🏛️ ירושלים", test: p => p.home === "#/town/jerusalem" },
    { name: "📘 כוללי הרבנים", test: p => p.id.startsWith("kollel-") },
    { name: "🌍 גדולי ישראל בגולה", test: p => p.gola },
    { name: "📜 היכל פרשת השבוע", test: p => isParashaPlace(p.id) },
    { name: "🔤 השלמת הפסוק", test: p => p.id === "verse-hall" },
    { name: "🗝️ היכל הארמית", test: p => p.id === "aramaic-hall" },
  ];
  const isParashaPlace = id => !!id && id.startsWith("parasha-");
  // אפשרויות הפרשה בתוך חומש אחד
  const parashaOptions = (book, selected) => Parashot.PARASHOT.filter(p => p.book === book)
    .map(p => `<option value="${p.id}" ${p.id === selected ? "selected" : ""}>${p.name}</option>`).join("");
  function questionForm(q) {
    q = q || { place: PLACES[0].id, question: "", answers: ["", "", "", ""], correct: 0, source: "" };
    // בטופס של פרשה: מתחילים מהפרשה של הנושא השמור, ואחרת מהפרשה של השבוע
    const cur = (q.parasha && Parashot.byId(q.parasha)) || Parashot.byId(Parasha.current.ids[0]) || Parashot.PARASHOT[0];
    return `
      <label>על איזה נושא השאלה?</label>
      <div class="topic-pick">
        ${TOPIC_GROUPS.map(g => {
          const list = PLACES.filter(g.test);
          return list.length ? `
          <div class="topic-group">${g.name}</div>
          <div class="topic-grid">
            ${list.map(p => `
              <label class="topic" style="--c:${p.color}">
                <input type="radio" name="place" value="${p.id}" ${q.place === p.id ? "checked" : ""} required>
                <span class="topic-icon">${p.icon}</span>
                <span class="topic-text"><b>${esc(p.name.replace("הכולל של ", ""))}</b><small>${esc(p.desc)}</small></span>
              </label>`).join("")}
          </div>` : "";
        }).join("")}
      </div>
      <div class="parasha-box" id="pbox" hidden>
        <div class="pb-parasha">
          <label>איזה חומש?</label>
          <select name="book">${Parashot.BOOKS.map(b => `<option value="${b.id}" ${b.id === cur.book ? "selected" : ""}>${b.he}</option>`).join("")}</select>
          <label>איזו פרשה?</label>
          <select name="parasha">${parashaOptions(cur.book, cur.id)}</select>
          <label>הפסוק כמו שהוא בחומש <span class="hint">(בלי הפירוש)</span></label>
          <textarea name="verse" rows="2" maxlength="400" placeholder="וַיֵּרָא ה' אֶל אַבְרָם...">${esc(q.verse || "")}</textarea>
          <label>מקום הפסוק <span class="hint">(למשל: בראשית יב, ז)</span></label>
          <input name="ref" maxlength="60" value="${esc(q.ref || "")}">
          <label>מה הפרשן כותב <span class="hint">(לא חובה: מוצג אחרי התשובה)</span></label>
          <textarea name="quote" rows="2" maxlength="400">${esc(q.quote || "")}</textarea>
        </div>
        <div class="pb-verse small muted">בשאלת השלמת הפסוק כותבים את הפסוק כמו שהוא, ומשאירים ____ במקום המילה החסרה. התשובה הנכונה היא המילה שחסרה.</div>
      </div>
      <label>רמת קושי</label>
      <div class="lvl-pick">
        ${Array.from({ length: LEVEL_MAX }, (_, i) => i + 1).map(l => `
          <label><input type="radio" name="level" value="${l}" ${(q.level || 1) === l ? "checked" : ""}><span>${"⭐".repeat(Math.min(l, 3))}<br>${LEVEL_NAMES[l].split(": ")[1]}</span></label>`).join("")}
      </div>
      <label>השאלה</label>
      <textarea name="question" rows="2" required maxlength="300">${esc(q.question)}</textarea>
      <label>ארבע תשובות <span class="hint">(סמנו את העיגול ליד התשובה הנכונה)</span></label>
      ${[0, 1, 2, 3].map(i => `
        <div class="opt">
          <input type="radio" name="correct" value="${i}" ${q.correct === i ? "checked" : ""} aria-label="תשובה נכונה">
          <input name="a${i}" required maxlength="150" placeholder="תשובה ${LETTERS[i]}" value="${esc(q.answers[i])}">
        </div>`).join("")}
      <label>מקור <span class="hint">(לא חובה, למשל: בראשית א, א או ברכות ב, א)</span></label>
      <input name="source" maxlength="100" value="${esc(q.source || "")}">
      <label>הסבר לתשובה הנכונה <span class="hint">(לא חובה, מוצג אחרי שעונים)</span></label>
      <textarea name="note" rows="2" maxlength="300">${esc(q.note || "")}</textarea>`;
  }
  // מגלגל את רשימת הנושאים אל הנושא שנבחר
  function showPicked(form) {
    const box = form.querySelector(".topic-pick"), t = form.querySelector(".topic input:checked");
    if (box && t) box.scrollTop = t.closest(".topic").offsetTop - box.offsetTop - 40;
  }
  // מחברים את הטופס: בחירת חומש מעדכנת את רשימת הפרשות, ובחירת נושא מראה את השדות הנכונים
  function wireForm(form) {
    const book = form.querySelector("select[name=book]"), par = form.querySelector("select[name=parasha]");
    book.onchange = () => { par.innerHTML = parashaOptions(book.value, null); };
    const pbox = form.querySelector("#pbox");
    const sync = () => {
      const pl = (form.querySelector("input[name=place]:checked") || {}).value || "";
      pbox.hidden = !(isParashaPlace(pl) || pl === "verse-hall");
      pbox.querySelector(".pb-parasha").hidden = !isParashaPlace(pl);
      pbox.querySelector(".pb-verse").hidden = pl !== "verse-hall";
    };
    form.querySelectorAll("input[name=place]").forEach(r => r.addEventListener("change", sync));
    sync();
  }
  // מה חסר בשדות של פרשת השבוע (או null אם הכול תקין)
  const formProblem = q => {
    if (!isParashaPlace(q.place)) return null;
    if (!q.parasha) return "בחרו חומש ופרשה.";
    if (!q.verse) return "כתבו את הפסוק כמו שהוא בחומש.";
    if (!q.ref) return "כתבו את מקום הפסוק, למשל: בראשית יב, ז.";
    return null;
  };
  function readForm(form) {
    const f = new FormData(form);
    const q = {
      place: f.get("place"),
      level: Number(f.get("level")) || 1,
      question: f.get("question").trim(),
      answers: [0, 1, 2, 3].map(i => f.get("a" + i).trim()),
      correct: Number(f.get("correct")),
      source: (f.get("source") || "").trim(),
      note: (f.get("note") || "").trim() || null,
    };
    if (isParashaPlace(q.place)) Object.assign(q, {
      parasha: f.get("parasha"),
      verse: (f.get("verse") || "").trim(),
      ref: (f.get("ref") || "").trim(),
      quote: (f.get("quote") || "").trim() || null,
    });
    return q;
  }

  async function viewSuggest(placeId) {
    setTab("suggest");
    if (isParashaPlace(placeId)) await Parasha.ready; // ברירת המחדל היא פרשת השבוע
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
    showPicked(form);
    wireForm(form);
    form.onsubmit = async ev => {
      ev.preventDefault();
      const q = readForm(form);
      const msg = document.getElementById("smsg");
      if (new Set(q.answers).size < 4) { msg.innerHTML = `<div class="notice err">כל ארבע התשובות צריכות להיות שונות זו מזו.</div>`; return; }
      const problem = formProblem(q);
      if (problem) { msg.innerHTML = `<div class="notice err">${problem}</div>`; return; }
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
  // דיווחים: מי שעונה על שאלה ורואה שהתשובה לא נכונה, שולח דיווח. המנהל בודק ומוחק.
  async function loadReports() {
    const box = document.getElementById("rlist");
    if (!box) return;
    let rows;
    try { rows = await db.reports(); } catch (e) { box.innerHTML = errorBox(e); return; }
    if (!rows.length) { box.innerHTML = `<div class="card muted center">אין דיווחים 👍</div>`; return; }
    // מקבצים לפי שאלה, כדי לראות כמה דיווחו על אותה שאלה
    const groups = new Map();
    rows.forEach(r => { const g = groups.get(r.qkey) || { q: r, items: [] }; g.items.push(r); groups.set(r.qkey, g); });
    box.innerHTML = [...groups.values()].map(g => `
      <div class="card" data-qkey="${esc(g.q.qkey)}">
        <div class="small muted">${g.items.length} דיווחים${g.q.place ? " · " + esc((placeById(g.q.place) || { name: g.q.place }).name) : ""}</div>
        <h3 style="margin:6px 0">${esc(g.q.question)}</h3>
        ${g.items.filter(r => r.reason).map(r => `<div class="small">• ${esc(r.reason)}</div>`).join("")}
        <div class="row" style="margin-top:8px"><button class="btn ghost small" data-dismiss="${esc(g.q.id)}" data-qkey="${esc(g.q.qkey)}">סגרתי את הדיווחים</button></div>
      </div>`).join("");
    box.querySelectorAll("[data-dismiss]").forEach(b => b.onclick = async () => {
      try {
        const ids = rows.filter(r => r.qkey === b.dataset.qkey).map(r => r.id);
        for (const id of ids) await db.dismissReport(id);
        loadReports();
      } catch (e) { toast("לא הצלחנו לסגור את הדיווחים, נסו שוב"); }
    });
  }
  // מי משחק מאנדרואיד ומי מאייפון, כדי לבחור חברים שיעזרו לבדוק את אפליקציית האנדרואיד
  async function loadDevices() {
    const box = document.getElementById("dlist");
    if (!box) return;
    let rows;
    try { rows = await db.devices(); } catch (e) {
      box.innerHTML = `<div class="card small">כדי לראות כאן את השחקנים, מריצים פעם אחת את <b>supabase/update-9.sql</b> ב-Supabase (SQL Editor). עד אז סוג הטלפון נשמר רק אצל כל שחקן בדפדפן.</div>`;
      return;
    }
    if (!rows.length) { box.innerHTML = `<div class="card muted center">עוד אין שחקנים שבחרו טלפון.</div>`; return; }
    const count = id => rows.filter(r => r.device === id).length;
    let only = "all";
    const draw = () => {
      const list = rows.filter(r => only === "all" || (only === "testers" ? r.tester : r.device === only));
      box.innerHTML = `<div class="card">
        <div class="row">${[["all", "כולם", rows.length], ...DEVICES.map(d => [d.id, d.icon + " " + d.name, count(d.id)]), ["testers", "🛠️ מוכנים לבדוק", rows.filter(r => r.tester).length]]
          .map(([id, name, n]) => `<button class="btn ${only === id ? "" : "ghost"} small-btn" data-only="${id}">${name} (${n})</button>`).join("")}</div>
        <ol class="leaders">${list.map(r => `<li><span>${esc(r.name)}</span><b>${(DEVICES.find(d => d.id === r.device) || {}).icon || ""} ${esc(deviceName(r.device))}${r.tester ? " · 🛠️" : ""}</b></li>`).join("") || `<li class="muted">אין</li>`}</ol>
      </div>`;
      box.querySelectorAll("[data-only]").forEach(b => b.onclick = () => { only = b.dataset.only; draw(); });
    };
    draw();
  }
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
      <div id="plist"><p class="muted">טוען...</p></div>
      <h2 style="margin:18px 0 8px">📱 שחקנים לפי טלפון</h2>
      <div id="dlist"><p class="muted">טוען...</p></div>
      <h2 style="margin:18px 0 8px">🚩 דיווחים על תשובות</h2>
      <div id="rlist"><p class="muted">טוען...</p></div>
      <div class="row center-row"><button class="btn ghost" id="showapproved">📋 השאלות שכבר אושרו</button><a class="btn ghost" href="#/review">📖 כל השאלות והמקורות באתר</a></div>
      <div id="alist"></div>`;
    document.getElementById("logout").onclick = async () => { await db.logout(); viewAdmin(); };
    document.getElementById("showapproved").onclick = showApproved;

    loadReports();
    loadDevices();
    let list;
    try { list = await db.pending(); } catch (e) { document.getElementById("plist").innerHTML = errorBox(e); return; }
    const box = document.getElementById("plist");
    if (!list.length) { box.innerHTML = `<div class="card muted center">אין שאלות חדשות לאישור 🎉</div>`; return; }

    box.innerHTML = list.map(q => {
      const p = placeById(q.place) || { icon: "", name: q.place };
      return `
      <div class="card pending" data-id="${q.id}">
        <div><span class="chip">${p.icon} ${esc(p.name)}</span><span class="chip">${LEVEL_NAMES[q.level || 1].split(":")[0]}</span><span class="small muted">${q.author_name ? "מאת " + esc(q.author_name) : "אנונימי"}</span></div>
        ${q.parasha && Parashot.byId(q.parasha) ? `<span class="chip">📜 ${esc(Parashot.byId(q.parasha).name)}</span>` : ""}
        ${q.verse ? `<div class="verse"><div class="verse-text">${esc(q.verse)}</div><div class="verse-ref">${esc(q.ref || "")}</div></div>` : ""}
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

  // רשימת השאלות המאושרות, עם מחיקה (לחיצה שנייה מאשרת)
  async function showApproved() {
    const box = document.getElementById("alist");
    box.innerHTML = `<p class="muted center">טוען...</p>`;
    let list;
    try { list = await db.allApproved(); } catch (e) { box.innerHTML = errorBox(e); return; }
    box.innerHTML = `<h3>${list.length} שאלות מאושרות</h3>` + list.map(q => {
      const p = placeById(q.place) || { icon: "", name: q.place };
      return `<div class="card approved-row" data-id="${q.id}">
        <span class="chip">${p.icon} ${esc(p.name)} · ${LEVEL_NAMES[q.level || 1].split(":")[0]}</span>
        <div><b>${esc(q.question)}</b> <span class="small muted">(${esc(q.answers[q.correct])})</span></div>
        <button class="btn ghost small-btn" data-del>מחיקה</button>
      </div>`;
    }).join("");
    box.querySelectorAll("[data-del]").forEach(btn => btn.onclick = async () => {
      if (!btn.dataset.sure) { btn.dataset.sure = "1"; btn.textContent = "בטוח? לחצו שוב"; btn.classList.add("bad"); return; }
      const row = btn.closest(".approved-row");
      try { await db.remove(Number(row.dataset.id)); row.remove(); toast("השאלה נמחקה"); }
      catch (e) { row.insertAdjacentHTML("beforeend", errorBox(e)); }
    });
  }

  function editCard(card, q) {
    card.innerHTML = `<form>${questionForm(q)}
      <div class="row"><button class="btn good" type="submit">שמירה ואישור</button><button class="btn ghost" type="button" id="cancel">ביטול</button></div></form>`;
    const form = card.querySelector("form");
    showPicked(form);
    wireForm(form);
    card.querySelector("#cancel").onclick = () => viewAdmin();
    form.onsubmit = async ev => {
      ev.preventDefault();
      const data = readForm(form), problem = formProblem(data);
      if (problem) { card.insertAdjacentHTML("beforeend", `<div class="notice err">${problem}</div>`); return; }
      try {
        await db.update(q.id, { ...data, status: "approved" });
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
  // ---------- שבת וחג ----------
  let shabbatShown = false;
  const hm = d => d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  const dayName = d => d.toLocaleDateString("he-IL", { weekday: "long" });

  function checkShabbat() {
    const st = TeireShabbat.status();
    if (st.closed) {
      if (!shabbatShown) { stopCity(); stopDuel(); showShabbat(st); }
      return true;
    }
    if (shabbatShown) { shabbatShown = false; document.body.classList.remove("shabbat"); route(); }
    const banner = document.getElementById("pre-shabbat");
    const mins = st.next ? Math.round((st.next.start - Date.now()) / 60000) : Infinity;
    if (mins <= 60) {
      banner.textContent = `🕯️ ${st.next.name.startsWith("שבת") ? "השבת נכנסת" : "החג נכנס"} בעוד ${mins} דקות (${hm(st.next.start)}). האתר ייסגר אז.`;
      banner.hidden = false;
    } else banner.hidden = true;
    const c = document.getElementById("city");
    if (c) c.style.top = (banner.hidden ? document.querySelector(".topbar") : banner).getBoundingClientRect().bottom + "px";
    return false;
  }

  function showShabbat(st) {
    shabbatShown = true;
    document.body.classList.add("shabbat");
    Music.stop();
    document.body.classList.remove("in-city");
    document.getElementById("pre-shabbat").hidden = true;
    app.innerHTML = `
      <div class="shabbat-screen">
        <div class="candles">🕯️🕯️</div>
        <h1>${st.name.startsWith("שבת") ? "שבת שלום!" : "חג שמח!"}</h1>
        <p>האתר סגור ב${esc(st.name)}.</p>
        <p class="big-time">נפתח ${st.end.getDay() === 6 ? "במוצאי שבת" : "במוצאי החג"} בשעה <b>${hm(st.end)}</b></p>
        <p class="small muted">לפי הזמנים של ${esc(st.loc.name)}. <a href="#" id="fixloc">המיקום לא נכון?</a></p>
      </div>`;
    document.getElementById("fixloc").onclick = ev => { ev.preventDefault(); useMyLocation(() => { shabbatShown = false; if (!checkShabbat()) route(); }); };
  }

  function useMyLocation(done) {
    if (!navigator.geolocation) { toast("הדפדפן לא תומך באיתור מיקום"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { TeireShabbat.setLocation({ name: "המיקום שלי", lat: pos.coords.latitude, lon: pos.coords.longitude }); toast("📍 המיקום עודכן"); if (done) done(); },
      () => toast("לא הצלחנו לקבל את המיקום. אפשר לבחור עיר מהרשימה בעמוד \"הדמות שלי\"."),
      { timeout: 10000, maximumAge: 86400000 }
    );
  }

  // ---------- כל התוכן במקום אחד: כל השאלות, המשפטים והוויכוחים עם המקורות, לבדיקה ולתיקון ----------
  // כל פריט מקבל קוד קבוע (למשל ת-12). כדי לתקן, מוסרים את הקוד, והתיקון נעשה בקובץ שרשום ליד הפריט.
  function allContent() {
    const items = [];
    const pname = id => { const p = placeById(id); return p ? `${p.icon} ${p.name.replace("הכולל של ", "כולל ")}` : id; };
    const add = (prefix, group, file, where, it) => items.push({ code: `${prefix}-${items.filter(x => x.prefix === prefix).length + 1}`, prefix, group, file, where, ...it });
    const quiz = (prefix, group, file, where, q, depth) => {
      add(prefix, group, file, where + (depth ? " · שאלת המשך" : ""), { text: q.question, answer: q.answers[q.correct], others: q.answers.filter((_, i) => i !== q.correct), source: q.source });
      if (q.followup) quiz(prefix, group, file, where, q.followup, (depth || 0) + 1);
    };
    (window.TEIRE_SEED || []).forEach(q => quiz("ת", "שאלות התחנות", "content/torah.js", `${pname(q.place)} · ${LEVEL_NAMES[1]}`, q));
    Object.entries(window.TEIRE_LEVELS || {}).filter(([place]) => !place.startsWith("parasha-")).forEach(([place, lv]) => Object.entries(lv).forEach(([l, list]) => list.forEach(q => {
      const kollel = place.startsWith("kollel-");
      const verse = place === "verse-hall", aram = place === "aramaic-hall";
      if (aram) return quiz("ר", "היכל הארמית", "content/aramaic.js", `${pname(place)} · ${LEVEL_NAMES[l]}`, q);
      quiz(kollel ? "כ" : verse ? "ה" : "ש", kollel ? "כוללי הרבנים" : verse ? "השלמת הפסוק" : "שאלות התחנות", verse ? "content/verses.js" : kollel ? "content/kollels.js" : "content/levels.js", `${pname(place)} · ${LEVEL_NAMES[l]}`, q);
    })));
    const PAR = window.TEIRE_PARASHA;
    if (PAR) PAR.WEEKS.forEach(w => PAR.COMMENTATORS.forEach(c => (w.q[c.id] || []).forEach(q =>
      add("פ", "פרשת השבוע", "content/parasha.js", `פרשת ${w.name} · היכל ${c.name} · ${LEVEL_NAMES[q.level || 1]}`,
        { text: q.question, verse: q.verse && `${q.verse} (${q.ref})`, answer: q.answers[q.correct], others: q.answers.filter((_, i) => i !== q.correct), source: q.source, quote: q.quote }))));
    Sages.SAGES.forEach(sg => sg.quest.forEach(q => quiz("נ", "עיבור נשמה", "content/sages.js", `${sg.name}`, q)));
    Sages.MACHLOKOT.forEach(m => add("מ", "מחלוקות", "content/sages.js", Object.keys(m.opinions).map(id => Sages.byId(id) ? Sages.byId(id).school : id).join(" · "), {
      text: m.question, answer: Object.entries(m.opinions).map(([id, i]) => `${Sages.byId(id) ? Sages.byId(id).school : id}: ${m.answers[i]}`).join(" | "), others: [], source: m.source }));
    (window.TEIRE_CHALLENGES || []).forEach(c => add("א", "משפטי האתגרים", "content/challenges.js", "אתגר ההחלקה", { text: c.text, answer: c.right, others: [`מקור מטעה: ${c.wrong}`], source: c.right }));
    (window.TEIRE_RACE_WORLDS || []).forEach(w => w.items.forEach(c => add("ק", "מרוץ המקורות", "content/challenges.js", `${w.name} (${w.tag})`, { text: c.text, answer: c.right, others: [`מקור מטעה: ${c.wrong}`], source: c.note })));
    const D = window.TEIRE_DEBATES || { DEBATES: [], SPEAKERS: {} };
    D.DEBATES.forEach(d => add("ו", "פלפולים", "content/debates.js", d.pair.map(w => D.SPEAKERS[w].name).join(" נגד "), {
      text: d.title, answer: "", others: [], source: d.source,
      lines: d.lines.map(([w, t]) => `${w ? D.SPEAKERS[w].name : "המספר"}: ${t}`) }));
    return items;
  }

  async function viewReview() {
    setTab("me");
    const items = allContent();
    const groups = [...new Set(items.map(i => i.group))];
    let group = "", query = "", noSource = false;
    app.innerHTML = `
      <div class="card">
        <h2>📋 כל השאלות והמקורות</h2>
        <p class="muted small">כל התוכן באתר במקום אחד. מצאתם טעות? לחצו על הקוד של הפריט כדי להעתיק אותו, ושלחו אותו עם התיקון.</p>
        <input id="rq" type="search" placeholder="🔍 חיפוש לפי מילה או מקור">
        <div class="chips" id="rg">
          <button class="chip on" data-g="">הכול (${items.length})</button>
          ${groups.map(g => `<button class="chip" data-g="${g}">${g} (${items.filter(i => i.group === g).length})</button>`).join("")}
          <button class="chip warn" data-ns="1">⚠️ בלי מקור (${items.filter(i => !i.source).length})</button>
          <button class="chip" data-g="db">שאלות שגולשים הציעו</button>
        </div>
      </div>
      <div id="rlist"></div>`;
    const list = document.getElementById("rlist");
    let dbItems = null;
    const card = i => `
      <div class="review-item">
        <div class="review-top"><button class="code" data-code="${i.code}" title="העתקת הקוד">${i.code}</button><span class="small muted">${esc(i.where)}</span></div>
        ${i.verse ? `<div class="review-verse">📜 ${esc(i.verse)}</div>` : ""}
        <div class="review-q">${esc(i.text)}</div>
        ${i.answer ? `<div class="review-a">✓ ${esc(i.answer)}</div>` : ""}
        ${i.others.length ? `<div class="small muted">${i.others.map(esc).join(" · ")}</div>` : ""}
        ${i.quote ? `<div class="small">«${esc(i.quote)}»</div>` : ""}
        ${i.lines ? `<details><summary class="small">מה כל אחד אומר</summary>${i.lines.map(l => `<p class="small">${esc(l)}</p>`).join("")}</details>` : ""}
        <div class="review-src ${i.source ? "" : "missing"}">${i.source ? `📖 ${esc(i.source)}` : "⚠️ אין מקור"}</div>
        <div class="tiny muted">${i.file}</div>
      </div>`;
    async function draw() {
      let shown;
      if (group === "db") {
        list.innerHTML = `<p class="muted center">טוען...</p>`;
        if (!dbItems) {
          try {
            dbItems = (await db.allApproved()).map((q, n) => ({ code: `ג-${q.id}`, where: `${(placeById(q.place) || { name: q.place }).name} · ${LEVEL_NAMES[q.level || 1]}${q.author_name ? " · " + q.author_name : ""}`,
              text: q.question, answer: q.answers[q.correct], others: q.answers.filter((_, i) => i !== q.correct), source: q.source, quote: q.quote,
              verse: q.verse && `${q.verse}${q.ref ? " (" + q.ref + ")" : ""}`, file: "מסד הנתונים (עריכה בלשונית ניהול)" }));
          } catch (e) { list.innerHTML = errorBox(e); return; }
        }
        shown = dbItems;
      } else shown = items.filter(i => !group || i.group === group);
      if (noSource) shown = shown.filter(i => !i.source);
      if (query) shown = shown.filter(i => [i.code, i.text, i.verse, i.answer, i.source, i.where, ...(i.others || []), ...(i.lines || [])].join(" ").includes(query));
      list.innerHTML = shown.length ? `<p class="small muted">${shown.length} פריטים</p>` + shown.map(card).join("") : `<div class="card muted center">לא נמצא כלום</div>`;
    }
    document.getElementById("rq").oninput = ev => { query = ev.target.value.trim(); draw(); };
    document.getElementById("rg").onclick = ev => {
      const b = ev.target.closest(".chip");
      if (!b) return;
      if (b.dataset.ns) { noSource = !noSource; b.classList.toggle("on", noSource); }
      else {
        group = b.dataset.g;
        document.querySelectorAll("#rg .chip[data-g]").forEach(c => c.classList.toggle("on", c === b));
      }
      draw();
    };
    list.onclick = ev => {
      const b = ev.target.closest(".code");
      if (!b) return;
      const item = (dbItems || []).concat(items).find(i => i.code === b.dataset.code);
      const text = `${item.code}: ${item.text} (${item.source || "בלי מקור"})`;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast("הקוד הועתק 📋"), () => toast(item.code));
    };
    draw();
  }

  // איזו מוזיקה מתנגנת בכל מקום באתר
  function moodFor(page, arg) {
    if (page === "debate") return arg ? "dark" : "study";
    if (page === "swipe" || page === "race" || page === "duel" || page === "olama") return "upbeat";
    if ((page === "town" || page === "b") && (arg === "tzfat" || arg === "meron")) return "mystic";
    if (page === "town" && arg === "jerusalem") return "jerusalem";
    if (page === "town" && arg === "parasha") return "study";
    if (page === "b" || page === "place" || page === "learn" || page === "souls") return "study";
    return "calm";
  }
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [page, arg] = h.split("/");
    // משחקים (מירוץ, החלפה, ויכוח): שומרים את המקום שממנו נכנסו, כדי לחזור אליו
    if (!["swipe", "race", "debate"].includes(page)) { try { sessionStorage.setItem("teire.returnTo", location.hash || "#/"); } catch (e) { /* ignore */ } }
    stopCity();
    stopDuel();
    stopGame();
    window.TeireOlama.stop();
    document.querySelectorAll(".weekly-pop, .tour").forEach(e => e.remove()); // ההצעה וההדרכה נסגרות כשעוברים לעמוד אחר
    closeMenu();
    document.body.classList.remove("no-player");
    Music.mood(moodFor(page, arg));
    if (checkShabbat()) return;
    if (db.accounts && !accountState.user && page !== "admin") return viewAccount();
    window.scrollTo(0, 0);
    if (page === "players" && !db.accounts) return viewPlayers();
    // אין שחקן פעיל אבל יש שחקנים שמורים במכשיר: בוחרים מי משחק
    if (!db.accounts && !player.name && !creatingNew && hasProfiles() && page !== "admin") return viewPlayers();
    if (page === "place" && arg) return viewPlace(arg);
    if (page === "b" && arg) return viewBuilding(arg);
    if (page === "town" && arg) return viewTown(arg);
    if (page === "kotel") return viewKotel();
    if (page === "sail") return viewSail(arg);
    if (page === "journey") return viewJourney(arg);
    if (page === "device") return viewDevice(arg);
    if (page === "duel" && arg) return viewDuel(arg);
    if (page === "olama") { setTab("map"); return window.TeireOlama.view(arg, { esc, toast, confetti, avatarSVG, get player() { return player; } }); }
    if (page === "souls") return viewSouls();
    if (page === "leaders") return viewLeaders();
    if (page === "swipe") return viewSwipe();
    if (page === "race") return viewRace();
    if (page === "debate") return viewDebate(arg);
    if (page === "learn") return viewLearn(arg);
    if (page === "review") return viewReview();
    if (page === "me") return viewMe();
    if (page === "suggest") return viewSuggest(arg);
    if (page === "admin") return viewAdmin();
    return viewCity();
  }
  window.addEventListener("hashchange", route);
  setInterval(checkShabbat, 30000);
  // קישור לאותו עמוד שכבר פתוח (למשל "חזרה" אחרי שאלון) לא מפעיל hashchange, אז מרעננים ידנית
  document.addEventListener("click", ev => {
    const a = ev.target.closest("a[href^='#']");
    if (a && a.getAttribute("href") === (location.hash || "#/")) { ev.preventDefault(); route(); }
  });
  renderHud();
  startAccount().then(route);
})();
