(function () {
  const db = window.TeireDB;
  const cfg = window.TEIRE_CONFIG;
  const { PLACES, ITEMS, SKINS, HAIR, avatarSVG } = window.TeireWorld;
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
        player.name = name; player.look = look; savePlayer(); location.hash = "#/"; viewCity();
      };
    }
    let typed = player.name;
    function keepName() { const el = document.getElementById("pname"); if (el) typed = el.value; }
    draw();
  }

  // ---------- העיר ----------
  let cityLoop = null;
  function stopCity() {
    if (cityLoop) { cancelAnimationFrame(cityLoop.raf); window.removeEventListener("keydown", cityLoop.onKey); window.removeEventListener("keyup", cityLoop.onKey); cityLoop = null; }
    document.body.classList.remove("in-city");
  }

  function buildingInfo(b) {
    if (b.kind === "torah") {
      const p = placeById(b.id), i = PLACES.indexOf(p);
      return { name: p.name, icon: p.icon, color: p.color, open: isOpen(i), stars: player.stars[p.id] || 0, href: "#/place/" + p.id };
    }
    return { name: b.name, icon: b.icon, color: b.color, open: true, href: b.kind === "sage" ? "#/b/" + b.id : b.href };
  }

  function viewCity() {
    if (!player.name) return viewOnboarding();
    setTab("map");
    document.body.classList.add("in-city");
    const { W, H, REGIONS, BUILDINGS, START } = City;
    const soul = player.activeSoul && Sages.byId(player.activeSoul);
    const pos = Object.assign({}, player.pos || START);

    app.innerHTML = `
      <div class="city" id="city">
        <div class="world" id="world" style="width:${W}px;height:${H}px">
          ${REGIONS.map(r => `<div class="region ${r.river ? "river" : ""}" style="top:${r.y}px;height:${r.h}px;background:${r.bg}"><span class="region-sign">${r.name}</span></div>`).join("")}
          <div class="bridge" style="left:${W / 2 - 60}px;top:1050px"></div>
          <div class="road" style="left:${W / 2 - 22}px;top:0;height:${H}px"></div>
          ${decorations(W, H)}
          ${BUILDINGS.map(b => {
            const info = buildingInfo(b);
            const sages = b.kind === "sage" ? Sages.SAGES.filter(s => s.building === b.id) : [];
            return `<button class="bld ${b.big ? "big" : ""} ${info.open ? "" : "locked"}" data-b="${b.id}" style="left:${b.x}px;top:${b.y}px;--c:${info.color}">
              <span class="bld-roof"></span>
              <span class="bld-body"><span class="bld-icon">${info.open ? info.icon : "🔒"}</span></span>
              ${sages.length ? `<span class="bld-sages">${sages.map(s => `<span class="${player.souls.includes(s.id) ? "got" : ""}">${Sages.sageSVG(s, 30)}</span>`).join("")}</span>` : ""}
              <span class="bld-name">${info.name}${b.kind === "torah" ? ` <span class="bld-stars">${"★".repeat(info.stars)}</span>` : ""}</span>
            </button>`;
          }).join("")}
          <div class="me ${soul ? "has-soul" : ""}" id="me" style="left:${pos.x}px;top:${pos.y}px">
            ${soul ? `<span class="me-soul">🕯️ ${esc(soul.name)}</span>` : `<span class="me-name">${esc(player.name)}</span>`}
            <span class="me-body">${avatarSVG(player.look, 52)}</span>
            <span class="me-shadow"></span>
          </div>
          <div class="target" id="target"></div>
        </div>
        <div class="city-hint" id="hint">👆 הקישו על מקום כדי ללכת אליו</div>
        <a class="soul-chip" href="#/souls">${soul ? `🕯️ נשמת ${esc(soul.name)}` : "🕯️ עוד אין נשמה"} · ${player.souls.length}/${Sages.SAGES.length}</a>
      </div>`;

    const city = document.getElementById("city"), world = document.getElementById("world");
    const me = document.getElementById("me"), body = me.querySelector(".me-body"), tgt = document.getElementById("target");
    const SPEED = 260; // פיקסלים לשנייה
    // בטלפון מקטינים את העולם כדי לראות יותר מהעיר
    const S = Math.min(1, Math.max(.6, city.clientWidth / 640));
    city.style.top = document.querySelector(".topbar").getBoundingClientRect().bottom + "px";
    let target = null, onArrive = null, last = performance.now();
    const keys = {};
    const cam = { x: 0, y: 0 };

    function camera(snap) {
      const vw = city.clientWidth, vh = city.clientHeight, w = W * S, h = H * S;
      const wantX = w <= vw ? (w - vw) / 2 : Math.min(Math.max(pos.x * S - vw / 2, 0), w - vw);
      const wantY = h <= vh ? (h - vh) / 2 : Math.min(Math.max(pos.y * S - vh / 2, 0), h - vh);
      cam.x = snap ? wantX : cam.x + (wantX - cam.x) * .15;
      cam.y = snap ? wantY : cam.y + (wantY - cam.y) * .15;
      world.style.transform = `translate(${-cam.x}px, ${-cam.y}px) scale(${S})`;
    }

    function walkTo(x, y, cb) {
      target = { x: Math.min(Math.max(x, 20), W - 20), y: Math.min(Math.max(y, 40), H - 10) };
      onArrive = cb || null;
      tgt.style.left = target.x + "px"; tgt.style.top = target.y + "px"; tgt.classList.add("show");
      document.getElementById("hint").classList.add("hide");
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, .05); last = now;
      let dx = 0, dy = 0;
      if (keys.ArrowLeft) dx -= 1; if (keys.ArrowRight) dx += 1;
      if (keys.ArrowUp) dy -= 1; if (keys.ArrowDown) dy += 1;
      if (dx || dy) { target = null; onArrive = null; tgt.classList.remove("show"); }
      else if (target) { dx = target.x - pos.x; dy = target.y - pos.y; }
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        const step = Math.min(SPEED * dt, target && !(keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown) ? dist : SPEED * dt);
        pos.x = Math.min(Math.max(pos.x + dx / dist * step, 20), W - 20);
        pos.y = Math.min(Math.max(pos.y + dy / dist * step, 40), H - 10);
        me.style.left = pos.x + "px"; me.style.top = pos.y + "px";
        me.style.zIndex = Math.round(pos.y);
        if (Math.abs(dx) > 1) body.style.transform = dx < 0 ? "scaleX(-1)" : "";
        me.classList.add("walking");
      } else {
        me.classList.remove("walking");
      }
      if (target && Math.hypot(target.x - pos.x, target.y - pos.y) < 1) {
        target = null; tgt.classList.remove("show"); me.classList.remove("walking");
        player.pos = { x: Math.round(pos.x), y: Math.round(pos.y) }; savePlayer();
        if (onArrive) { const cb = onArrive; onArrive = null; cb(); return; }
      }
      camera(false);
      cityLoop.raf = requestAnimationFrame(frame);
    }

    city.addEventListener("click", ev => {
      const bEl = ev.target.closest(".bld");
      if (bEl) {
        const b = City.byId(bEl.dataset.b), info = buildingInfo(b);
        if (!info.open) { toast("🔒 המקום ייפתח אחרי שתעברו את התחנה הקודמת בשכונת החומש"); return; }
        walkTo(b.x, b.y + (b.big ? 100 : 82), () => {
          player.pos = { x: Math.round(pos.x), y: Math.round(pos.y) }; savePlayer();
          location.hash = info.href;
        });
        return;
      }
      if (ev.target.closest(".soul-chip")) return;
      const r = city.getBoundingClientRect();
      walkTo((ev.clientX - r.left + cam.x) / S, (ev.clientY - r.top + cam.y) / S);
    });

    const onKey = ev => {
      if (!ev.key.startsWith("Arrow")) return;
      keys[ev.key] = ev.type === "keydown"; ev.preventDefault();
      if (ev.type === "keyup") { player.pos = { x: Math.round(pos.x), y: Math.round(pos.y) }; savePlayer(); }
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);
    cityLoop = { raf: 0, onKey };
    me.style.zIndex = Math.round(pos.y);
    camera(true);
    cityLoop.raf = requestAnimationFrame(frame);
  }

  function decorations(W, H) {
    // קישוטים קבועים (אותו מיקום בכל פעם)
    const out = [];
    const sets = [[0, 640, ["🌳", "🌲", "🌿", "🪨", "🐑", "🌸"]], [640, 1060, ["🌾", "🌻", "🐄", "🌳"]], [1150, 1720, ["🌴", "🐪", "🌵", "🏺", "🌴"]]];
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    sets.forEach(([y0, y1, emojis]) => {
      for (let i = 0; i < 14; i++) {
        const x = 20 + rnd() * (W - 40), y = y0 + 30 + rnd() * (y1 - y0 - 60);
        if (Math.abs(x - W / 2) < 60) continue;
        if (City.BUILDINGS.some(b => Math.abs(b.x - x) < 95 && Math.abs(b.y - y) < 95)) continue;
        out.push(`<span class="deco" style="left:${x}px;top:${y}px">${emojis[i % emojis.length]}</span>`);
      }
    });
    out.push(`<span class="deco boat" style="left:200px;top:1080px">⛵</span><span class="deco" style="left:820px;top:1090px">🐟</span>`);
    return out.join("");
  }

  function toast(text) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  // ---------- שאלון כללי ----------
  // items: [{ question, answers, correct, source, prompt, reward, explain }]
  function runQuiz(guide, items, onDone) {
    let idx = 0, score = 0, coins = 0;
    const cheers = ["כל הכבוד!", "יישר כח!", "מצוין!", "אשריך!", "נפלא!"];
    function show() {
      const q = items[idx];
      const order = db.shuffle([0, 1, 2, 3]);
      app.innerHTML = `
        <div class="dots">${items.map((_, i) => `<span class="${i < idx ? "done" : i === idx ? "now" : ""}"></span>`).join("")}</div>
        ${guideBubble(guide, q.prompt || `שאלה ${idx + 1} מתוך ${items.length}`)}
        <div class="card">
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
          ${q.explain ? `<div class="explain">${q.explain}</div>` : ""}
          ${q.source ? `<div class="small muted" style="margin-top:10px">מקור: ${esc(q.source)}</div>` : ""}
          <button class="btn big-btn" id="next">${last ? "לסיום" : "לשאלה הבאה"}</button>`;
        document.getElementById("next").onclick = () => { if (last) onDone(score, items.length, coins); else { idx++; show(); } };
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
      ${guideBubble(placeGuide(place), esc(place.guide.hello))}
      <div class="card center">
        ${pool.length
          ? `<p>${Math.min(pool.length, cfg.QUESTIONS_PER_MISSION)} שאלות מחכות לכם. כל תשובה נכונה = 🪙 10</p>
             <button class="btn big-btn" id="start">מתחילים את המשימה!</button>`
          : `<p>אין עדיין שאלות במקום הזה.</p>`}
        <div class="row center-row"><a class="btn ghost" href="#/">חזרה לעיר</a><a class="btn ghost" href="#/suggest/${place.id}">הציעו שאלה למקום הזה</a></div>
      </div>`;
    const start = document.getElementById("start");
    if (start) start.onclick = () => runMission(place, pool);
  }

  function runMission(place, pool) {
    const items = db.shuffle(pool).slice(0, cfg.QUESTIONS_PER_MISSION);
    runQuiz(placeGuide(place), items, (score, n, coins) => {
      const stars = starsFor(score, n);
      if (stars === 3) coins += 20;
      const before = player.stars[place.id] || 0;
      player.coins += coins;
      if (stars > before) player.stars[place.id] = stars;
      savePlayer();
      const i = PLACES.indexOf(place);
      const unlocked = before === 0 && stars >= 1 && PLACES[i + 1];
      if (stars >= 2) confetti();
      app.innerHTML = `
        ${guideBubble(placeGuide(place), stars === 3 ? "מושלם! אתם אלופים!" : stars >= 1 ? "יפה מאוד! עברתם את התחנה." : "כמעט! צריך חצי מהתשובות נכונות כדי לעבור. נסו שוב!", stars ? "happy" : "")}
        <div class="card center result">
          ${resultStars(stars)}
          <div class="big">${score}/${n}</div>
          <p>הרווחתם <b>🪙 ${coins}</b>${stars === 3 ? " (כולל בונוס 20 על משימה מושלמת)" : ""}</p>
          ${unlocked ? `<div class="notice ok">נפתח מקום חדש בעיר: ${unlocked.icon} ${unlocked.name}!</div>` : ""}
          <div class="row center-row">
            <button class="btn gold" id="again">שוב</button>
            <a class="btn" href="#/">לעיר</a>
          </div>
        </div>`;
      document.getElementById("again").onclick = () => runMission(place, pool);
    });
  }
  const resultStars = stars => `<div class="result-stars">${[0, 1, 2].map(k => `<span class="${k < stars ? "on" : ""}" style="animation-delay:${k * .25}s">★</span>`).join("")}</div>`;

  // ---------- בית של חכמים ----------
  function viewBuilding(bid) {
    const b = City.byId(bid);
    if (!b || b.kind !== "sage" || !player.name) return viewCity();
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
      <div class="row center-row"><a class="btn ghost" href="#/">חזרה לעיר</a></div>`;

    app.querySelectorAll("[data-quest]").forEach(btn => btn.onclick = () => runSoulQuest(Sages.byId(btn.dataset.quest), b));
    app.querySelectorAll("[data-activate]").forEach(btn => btn.onclick = () => { player.activeSoul = btn.dataset.activate; savePlayer(); viewBuilding(bid); });
    const sg = document.getElementById("sugya");
    if (sg) sg.onclick = () => runSugya(b, machlokot);
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
            <a class="btn ghost" href="#/">לעיר</a>
          </div>
        </div>`;
      const again = document.getElementById("again");
      if (again) again.onclick = () => runSoulQuest(sage, b);
    });
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
            <a class="btn ghost" href="#/">לעיר</a>
          </div>
        </div>`;
    });
  }

  // ---------- היכל הנשמות ----------
  function viewSouls() {
    if (!player.name) return viewOnboarding();
    setTab("souls");
    app.innerHTML = `
      <div class="card center">
        <h2>🕯️ היכל הנשמות</h2>
        <p class="small muted">בכל בית בעיר יושבים תנאים ואמוראים. ענו על השאלות שלהם וקבלו "עיבור נשמה". כשהנשמה פעילה, בלימוד הסוגיא תענו לפי השיטה של אותו חכם.</p>
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
    stopCity();
    window.scrollTo(0, 0);
    if (page === "place" && arg) return viewPlace(arg);
    if (page === "b" && arg) return viewBuilding(arg);
    if (page === "souls") return viewSouls();
    if (page === "me") return viewMe();
    if (page === "suggest") return viewSuggest(arg);
    if (page === "admin") return viewAdmin();
    return viewCity();
  }
  window.addEventListener("hashchange", route);
  // קישור לאותו עמוד שכבר פתוח (למשל "חזרה" אחרי שאלון) לא מפעיל hashchange, אז מרעננים ידנית
  document.addEventListener("click", ev => {
    const a = ev.target.closest("a[href^='#']");
    if (a && a.getAttribute("href") === (location.hash || "#/")) { ev.preventDefault(); route(); }
  });
  renderHud();
  route();
})();
