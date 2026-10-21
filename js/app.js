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
  const isOpen = i => i === 0 || (PLACES[i] && PLACES[i].free) || (player.stars[PLACES[i - 1].id] || 0) >= 1;
  // שלבים: שלב 1 שומר כוכבים תחת שם המקום, שלבים גבוהים תחת "מקום@שלב"
  const LEVEL_NAMES = ["", "שלב 1: קל", "שלב 2: בינוני", "שלב 3: קשה"];
  const LEVEL_REWARD = [0, 10, 15, 25];
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

  // מידע על מקום במפה: האם פתוח, כמה כוכבים ולאן נכנסים
  function locInfo(L) {
    const t = L.torah && placeById(L.torah);
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
    const { W, H, LAND, SINAI, BAVEL, LOCATIONS, LABELS, START } = City;
    const soul = player.activeSoul && Sages.byId(player.activeSoul);
    const pos = Object.assign({}, player.pos || START);
    const pts = arr => arr.map(p => p.join(",")).join(" ");

    app.innerHTML = `
      <div class="city" id="city">
        <div class="world" id="world" style="width:${W}px;height:${H}px">
          <svg class="map-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
            <defs>
              <linearGradient id="landg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#7dc95e"/><stop offset=".45" stop-color="#a4d36b"/>
                <stop offset=".62" stop-color="#e3cf7a"/><stop offset="1" stop-color="#e7a85a"/>
              </linearGradient>
              <pattern id="waves" width="80" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 20 q10 -8 20 0 t20 0" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3" stroke-linecap="round"/>
              </pattern>
            </defs>
            <rect width="${W}" height="${H}" fill="#3fa0e0"/>
            <rect width="${W}" height="${H}" fill="url(#waves)" class="waves"/>
            ${[LAND, SINAI, BAVEL].map(shape => `<polygon points="${pts(shape)}" fill="#f5dc8c" stroke="#f5dc8c" stroke-width="34" stroke-linejoin="round"/>`).join("")}
            <polygon points="${pts(LAND)}" fill="url(#landg)" stroke="#8fbf5a" stroke-width="4" stroke-linejoin="round"/>
            <polygon points="${pts(SINAI)}" fill="#e9b468" stroke="#d39a4a" stroke-width="4" stroke-linejoin="round"/>
            <polygon points="${pts(BAVEL)}" fill="#e8c27a" stroke="#c99a50" stroke-width="4" stroke-linejoin="round"/>
            <path d="M712 432 C 725 600, 705 800, 722 1000 S 712 1080, 706 1110" fill="none" stroke="#3fa0e0" stroke-width="9" stroke-linecap="round"/>
            <ellipse cx="712" cy="395" rx="28" ry="42" fill="#3fa0e0" stroke="#f5dc8c" stroke-width="6"/>
            <ellipse cx="706" cy="1215" rx="24" ry="100" fill="#4fb3d9" stroke="#f5dc8c" stroke-width="6"/>
            <path d="M840 600 C 860 760, 850 900, 870 1060" fill="none" stroke="#3fa0e0" stroke-width="7" stroke-linecap="round" opacity=".8"/>
            <path d="M560 1060 L 520 1060" stroke="#c9a46a" stroke-width="0"/>
          </svg>
          ${LABELS.map(l => `<span class="map-label ${l.cls}" style="left:${l.x}px;top:${l.y}px">${l.text}</span>`).join("")}
          ${mapDecorations()}
          ${LOCATIONS.map(L => {
            const info = locInfo(L);
            const sages = Sages.SAGES.filter(s => s.building === L.id);
            return `<button class="bld ${info.open ? "" : "locked"} ${L.duel ? "arena" : ""}" data-b="${L.id}" style="left:${L.x}px;top:${L.y}px;--c:${info.color}">
              <span class="bld-roof"></span>
              <span class="bld-body"><span class="bld-icon">${info.open ? info.icon : "🔒"}</span></span>
              ${sages.length ? `<span class="bld-sages">${sages.map(s => `<span class="${player.souls.includes(s.id) ? "got" : ""}">${Sages.sageSVG(s, 30)}</span>`).join("")}</span>` : ""}
              <span class="bld-name">${info.name}${info.stars ? ` <span class="bld-stars">${"★".repeat(info.stars)}</span>` : ""}${L.duel ? " ⚔️" : ""}</span>
            </button>`;
          }).join("")}
          ${meHtml(soul, pos)}
        </div>
        <div class="city-hint" id="hint">👆 הקישו על מקום כדי ללכת אליו</div>
        <a class="soul-chip lead-chip" href="#/leaders">🏆 טבלת האלופים</a>
        <a class="soul-chip" href="#/souls">${soul ? `🕯️ נשמת ${esc(soul.name)}` : "🕯️ עוד אין נשמה"} · ${player.souls.length}/${Sages.SAGES.length}</a>
      </div>`;

    startWalker({
      W, H, pos,
      savePos: p => { player.pos = p; savePlayer(); },
      onBuilding(bEl, walkTo) {
        const b = City.byId(bEl.dataset.b), info = locInfo(b);
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
  function startWalker({ W, H, pos, savePos, onBuilding, onGround, blocked = [] }) {
    const city = document.getElementById("city"), world = document.getElementById("world");
    const me = document.getElementById("me"), body = me.querySelector(".me-body"), tgt = document.getElementById("target");
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
    }

    function walkTo(x, y, cb) {
      const t = outside({ x: Math.min(Math.max(x, 20), W - 20), y: Math.min(Math.max(y, 40), H - 10) });
      path = plan({ x: pos.x, y: pos.y }, t);
      onArrive = cb || null;
      tgt.style.left = t.x + "px"; tgt.style.top = t.y + "px"; tgt.classList.add("show");
      document.getElementById("hint").classList.add("hide");
    }

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
      } else {
        me.classList.remove("walking");
      }
      if (path.length && Math.hypot(path[0].x - pos.x, path[0].y - pos.y) < 1) {
        path.shift();
        if (!path.length) {
          tgt.classList.remove("show"); me.classList.remove("walking");
          store();
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
      if (ev.type === "keyup") store();
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);
    cityLoop = { raf: 0, onKey };
    me.style.zIndex = Math.round(pos.y);
    camera(true);
    cityLoop.raf = requestAnimationFrame(frame);
  }

  // ---------- עולם בתוך עיר (ירושלים) ----------
  function viewTown(id) {
    const T = Towns.byId(id);
    if (!T || !player.name) return viewCity();
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
      </div>`;
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

  function mapDecorations() {
    // קישוטים קבועים: הרים, עצים, דקלים וסירות
    const items = [
      ["⛰️", 700, 110], ["🌲", 520, 170], ["🌳", 610, 560], ["🌿", 430, 470], ["🌳", 680, 640], ["🐑", 520, 650],
      ["🌳", 680, 900], ["🍇", 380, 960], ["🐄", 470, 820], ["🌾", 650, 760], ["🌳", 660, 1060], ["🐑", 500, 1250],
      ["🌵", 600, 1330], ["🐪", 560, 1480], ["🌴", 600, 1640], ["⛺", 520, 1560], ["🌵", 590, 1800],
      ["🐪", 230, 1650], ["🌵", 380, 1820], ["🌴", 940, 700], ["🌴", 840, 980], ["🐫", 950, 900],
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
    let dbPool = [];
    try { dbPool = await db.approved(placeId); } catch (e) { app.innerHTML = errorBox(e); return; }
    // שאלות ממסד הנתונים לפי השלב שלהן (בלי שלב = שלב 1), ועוד השאלות המובנות של אותו שלב
    const pools = [null, 1, 2, 3].map(l => l && dbPool.filter(q => (q.level || 1) === l).concat(bankFor(placeId, l)));
    const levels = [1, 2, 3].filter(l => pools[l].length);
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
        const ls = levelStars(placeId, l), open = l === 1 || levelStars(placeId, l - 1) >= 1;
        return `<div class="card level-card ${open ? "" : "locked"}">
          <div style="flex:1">
            <h3>${LEVEL_NAMES[l]}</h3>
            <div class="small muted">${Math.min(pools[l].length, cfg.QUESTIONS_PER_MISSION)} שאלות · כל תשובה נכונה = 🪙 ${LEVEL_REWARD[l]}</div>
            <div class="station-stars">${"★".repeat(ls)}<span class="dim">${"★".repeat(3 - ls)}</span></div>
          </div>
          ${open ? `<button class="btn ${l > 1 ? "gold" : ""}" data-level="${l}">מתחילים!</button>`
            : `<div class="small">🔒 נפתח אחרי ${LEVEL_NAMES[l - 1].split(":")[0]}</div>`}
        </div>`;
      }).join("") : `<div class="card center"><p>אין עדיין שאלות במקום הזה.</p></div>`}
      <div class="row center-row"><a class="btn ghost" href="${place.home || backOf(locOfTorah(place.id) && locOfTorah(place.id).id)}">חזרה</a><a class="btn ghost" href="#/suggest/${place.id}">הציעו שאלה למשימה הזאת</a></div>`;
    app.querySelectorAll("[data-level]").forEach(btn => btn.onclick = () => {
      const l = Number(btn.dataset.level);
      runMission(place, pools[l], l);
    });
  }

  function runMission(place, pool, level) {
    level = level || 1;
    const items = db.shuffle(pool).slice(0, cfg.QUESTIONS_PER_MISSION).map(q => ({ ...q, reward: LEVEL_REWARD[level] }));
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
          <div class="row center-row">
            <button class="btn gold" id="again">שוב</button>
            <a class="btn" href="#/place/${place.id}">לשלבים</a>
            <a class="btn ghost" href="#/">למפה</a>
          </div>
        </div>`;
      document.getElementById("again").onclick = () => runMission(place, pool, level);
    });
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
            <a class="btn ghost" href="#/">למפה</a>
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
  const backToTorah = `<div class="row center-row"><a class="btn ghost" href="#/town/torah">חזרה לקריית התורה</a></div>`;
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

  function gameIntro(key, title, icon, rules, start) {
    setTab("map");
    const best = (player.best || {})[key] || 0;
    app.innerHTML = `
      <div class="place-hero" style="--c:${key === "race" ? "#dc2626" : "#db2777"}">
        <div class="place-icon">${icon}</div><h1>${title}</h1>
        <p>השיא שלכם: ${best}</p>
      </div>
      <div class="card center">
        <p>${rules}</p>
        <button class="btn gold big-btn" id="go">מתחילים!</button>
      </div>${backToTorah}`;
    document.getElementById("go").onclick = start;
  }

  function gameOver(key, score, perPoint) {
    const coins = score * perPoint, record = bestOf(key, score);
    player.coins += coins; savePlayer();
    if (record) confetti();
    return `<div class="card center result">
      <h2>${record ? "🏆 שיא חדש!" : "המשחק נגמר"}</h2>
      <div class="big">${score}</div>
      <p>הרווחתם <b>🪙 ${coins}</b></p>
      <div class="row center-row"><button class="btn gold" id="again">שוב</button><a class="btn ghost" href="#/town/torah">לקריית התורה</a></div>
    </div>`;
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
  function viewRace() {
    if (!player.name) return viewOnboarding();
    gameIntro("race", "מרוץ המקורות", "🏎️", "מכשול עם משפט נוסע אליכם! בכל נתיב כתוב מקור אחר. עברו לנתיב של המקור הנכון (החלקה, הקשה על הנתיב או חיצים) ועקפו את המכשול. נתיב לא נכון, או להישאר באמצע, ואתם בחוץ!", playRace);
  }
  function playRace() {
    stopGame();
    const deck = db.shuffle(X.SOURCES);
    let i = 0, score = 0, lane = "mid", raf = 0, offKeys = null, item, sides, t0 = 0, dur = 4600, done = false;
    app.innerHTML = `
      <div class="race" id="race">
        <div class="race-q" id="rq"></div>
        <div class="road" id="road">
          <div class="lane-label left" data-side="left" id="ll"></div>
          <div class="lane-label right" data-side="right" id="lr"></div>
          <div class="obstacle" id="ob">🚧</div>
          <div class="car mid" id="car">🏎️</div>
        </div>
        <div class="arena-top"><span class="pill dark" id="rs">🏁 0</span><span class="small muted">החליקו או הקישו על הנתיב</span></div>
      </div>${backToTorah}`;
    const ob = document.getElementById("ob"), car = document.getElementById("car"), road = document.getElementById("road");
    function next() {
      item = deck[i++ % deck.length]; sides = sidesFor(item);
      document.getElementById("rq").textContent = "\"" + item.text + "\"";
      document.getElementById("ll").textContent = sides.left;
      document.getElementById("lr").textContent = sides.right;
      road.classList.remove("crash");
      lane = "mid"; car.className = "car mid";
      dur = Math.max(2300, 4600 - score * 180);
      t0 = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      ob.style.top = (p * 78) + "%";
      ob.style.transform = `translateX(-50%) scale(${.5 + p * .7})`;
      if (p < 1) { raf = requestAnimationFrame(tick); return; }
      if (lane === sides.correct) { score++; document.getElementById("rs").textContent = "🏁 " + score; next(); }
      else crash();
    }
    function crash() {
      done = true; road.classList.add("crash"); car.textContent = "💥";
      toast("המקור הנכון: " + item.right);
      setTimeout(() => {
        stopGame();
        app.innerHTML = gameOver("race", score, 4) + backToTorah;
        document.getElementById("again").onclick = playRace;
      }, 1400);
    }
    offKeys = sideInput(road, s => {
      if (done) return;
      lane = lane === "mid" ? s : (lane === s ? s : "mid"); // מהצד השני חוזרים קודם לאמצע
      car.className = "car " + lane;
    });
    game = { stop() { cancelAnimationFrame(raf); if (offKeys) offKeys(); } };
    next();
  }

  // ---- חדר הוויכוח: חדר חשוך, זרקור על מי שמדבר, רווח או הקשה להמשך ----
  function viewDebate(id) {
    if (!player.name) return viewOnboarding();
    setTab("map");
    const d = X.DEBATES.find(x => x.id === id);
    if (!d) {
      app.innerHTML = `
        <div class="place-hero" style="--c:#111827"><div class="place-icon">🎭</div><h1>חדר הוויכוח</h1><p>שני חכמים, סוגיא אחת. מי צודק?</p></div>
        ${X.DEBATES.map(x => `<a class="card debate-pick" href="#/debate/${x.id}">
          <span class="dp-faces">${x.pair.map(w => Sages.sageSVG(X.SPEAKERS[w], 40)).join("")}</span>
          <span><b>${x.title}</b><br><span class="small muted">${x.pair.map(w => X.SPEAKERS[w].name).join(" נגד ")} · ${x.source}</span></span>
          ${(player.debates || []).includes(x.id) ? "✓" : ""}</a>`).join("")}
        ${backToTorah}`;
      return;
    }
    Music.mood("dark");
    const [A, B] = d.pair;
    app.innerHTML = `
      <div class="dark-room" id="room">
        <div class="room-title">${d.title} <span>· ${d.source}</span></div>
        <div class="speaker left" data-w="${A}">${Sages.sageSVG(X.SPEAKERS[A], 110)}<b>${X.SPEAKERS[A].name}</b></div>
        <div class="speaker right" data-w="${B}">${Sages.sageSVG(X.SPEAKERS[B], 110)}<b>${X.SPEAKERS[B].name}</b></div>
        <div class="debate-bubble" id="bub"></div>
        <div class="room-hint">רווח או הקשה להמשך ▸</div>
      </div>
      <div class="row center-row"><a class="btn ghost" href="#/debate">לוויכוחים אחרים</a></div>`;
    const room = document.getElementById("room"), bub = document.getElementById("bub");
    let k = -1, typing = 0, full = "";
    function show() {
      k++;
      if (k >= d.lines.length) return finish();
      const [who, text] = d.lines[k];
      room.querySelectorAll(".speaker").forEach(s => s.classList.toggle("on", s.dataset.w === who));
      room.classList.toggle("narrator", !who);
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
      bub.className = "debate-bubble from-mid";
      bub.innerHTML = `<b>סוף הוויכוח</b><br>מקור: ${esc(d.source)}${first ? "<br>🪙 +15" : ""}`;
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
      <div class="row center-row"><button class="btn ghost" id="redo">שינוי שם ומראה</button></div>
      <p class="small muted center">🎵 צלילי הכלים במוזיקה: FluidR3 GM מאת Frank Wen, ברישיון <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a></p>`;

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
  ];
  function questionForm(q) {
    q = q || { place: PLACES[0].id, question: "", answers: ["", "", "", ""], correct: 0, source: "" };
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
      <label>רמת קושי</label>
      <div class="lvl-pick">
        ${[1, 2, 3].map(l => `
          <label><input type="radio" name="level" value="${l}" ${(q.level || 1) === l ? "checked" : ""}><span>${"⭐".repeat(l)}<br>${LEVEL_NAMES[l].split(": ")[1]}</span></label>`).join("")}
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
      <input name="source" maxlength="100" value="${esc(q.source || "")}">`;
  }
  // מגלגל את רשימת הנושאים אל הנושא שנבחר
  function showPicked(form) {
    const box = form.querySelector(".topic-pick"), t = form.querySelector(".topic input:checked");
    if (box && t) box.scrollTop = t.closest(".topic").offsetTop - box.offsetTop - 40;
  }
  function readForm(form) {
    const f = new FormData(form);
    return {
      place: f.get("place"),
      level: Number(f.get("level")) || 1,
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
    showPicked(form);
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
      <div id="plist"><p class="muted">טוען...</p></div>
      <div class="row center-row"><button class="btn ghost" id="showapproved">📋 השאלות שכבר אושרו</button></div>
      <div id="alist"></div>`;
    document.getElementById("logout").onclick = async () => { await db.logout(); viewAdmin(); };
    document.getElementById("showapproved").onclick = showApproved;

    let list;
    try { list = await db.pending(); } catch (e) { document.getElementById("plist").innerHTML = errorBox(e); return; }
    const box = document.getElementById("plist");
    if (!list.length) { box.innerHTML = `<div class="card muted center">אין שאלות חדשות לאישור 🎉</div>`; return; }

    box.innerHTML = list.map(q => {
      const p = placeById(q.place) || { icon: "", name: q.place };
      return `
      <div class="card pending" data-id="${q.id}">
        <div><span class="chip">${p.icon} ${esc(p.name)}</span><span class="chip">${LEVEL_NAMES[q.level || 1].split(":")[0]}</span><span class="small muted">${q.author_name ? "מאת " + esc(q.author_name) : "אנונימי"}</span></div>
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

  // איזו מוזיקה מתנגנת בכל מקום באתר
  function moodFor(page, arg) {
    if (page === "debate") return arg ? "dark" : "study";
    if (page === "swipe" || page === "race" || page === "duel") return "upbeat";
    if ((page === "town" || page === "b") && (arg === "tzfat" || arg === "meron")) return "mystic";
    if (page === "town" && arg === "jerusalem") return "jerusalem";
    if (page === "b" || page === "place" || page === "learn" || page === "souls") return "study";
    return "calm";
  }
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [page, arg] = h.split("/");
    stopCity();
    stopDuel();
    stopGame();
    Music.mood(moodFor(page, arg));
    if (checkShabbat()) return;
    window.scrollTo(0, 0);
    if (page === "place" && arg) return viewPlace(arg);
    if (page === "b" && arg) return viewBuilding(arg);
    if (page === "town" && arg) return viewTown(arg);
    if (page === "kotel") return viewKotel();
    if (page === "duel" && arg) return viewDuel(arg);
    if (page === "souls") return viewSouls();
    if (page === "leaders") return viewLeaders();
    if (page === "swipe") return viewSwipe();
    if (page === "race") return viewRace();
    if (page === "debate") return viewDebate(arg);
    if (page === "learn") return viewLearn(arg);
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
  route();
})();
