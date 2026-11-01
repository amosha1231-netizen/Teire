// ---------- שלט (ג'ויסטיק) ----------
// מאפשר לשחק עם שלט של Xbox או של פלייסטיישן: בדפדפן של ה-Xbox, או במחשב ובטלפון עם שלט מחובר.
// החיצים והסטיק השמאלי שולחים לחיצות חצים, כמו מקלדת. כך ההליכה במפה, המירוץ ומשחקי ההחלקה עובדים כמו שהם.
// אם אף משחק לא השתמש בחץ, הוא מזיז את הבחירה לכפתור הקרוב בכיוון הזה.
//   A (או ✕)  = לחיצה על מה שבחור
//   B (או ○)  = חזרה / סגירה
//   LB / RB   = לכפתור הקודם / הבא
//   Menu / Options = התפריט
// הלולאה רצה רק כשיש שלט מחובר, כדי לא להכביד על האתר.
(function () {
  if (!navigator.getGamepads) return;
  // בדפדפן הישן של ה-Xbox: השלט נשאר שלט ולא הופך לסמן עכבר
  try { if ("gamepadInputEmulation" in navigator) navigator.gamepadInputEmulation = "gamepad"; } catch (e) { /* לא נתמך */ }

  const BTN = { A: 0, B: 1, LB: 4, RB: 5, MENU: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
  const DIRS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  const FIRST_REPEAT = 420, REPEAT = 170, DEAD = 0.5;
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let raf = 0, prev = {}, held = {};
  const readPads = () => { try { return [...navigator.getGamepads()].filter(Boolean); } catch (e) { return []; } };

  // ---- איפה מחפשים כפתורים: בחלון שפתוח למעלה (הדרכה, תפריט, הודעה), אחרת בכל הדף ----
  function scope() {
    const layers = [".tour", ".menu-wrap", ".weekly-pop"];
    for (const sel of layers) { const el = document.querySelector(sel); if (el) return el; }
    return document.body;
  }
  function rectOf(el) {
    let r = el.getBoundingClientRect();
    // כפתור בחירה מוסתר בתוך תווית (נושאים, רמות): מודדים את התווית
    if ((r.width < 2 || r.height < 2) && el.closest("label")) r = el.closest("label").getBoundingClientRect();
    return r;
  }
  function visible(el) {
    if (el.closest("[hidden]")) return false;
    const r = rectOf(el);
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.pointerEvents !== "none";
  }
  const candidates = () => [...scope().querySelectorAll(FOCUSABLE)].filter(visible);
  const center = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  const current = () => {
    const a = document.activeElement;
    return a && a !== document.body && scope().contains(a) && visible(a) ? a : null;
  };

  function focusEl(el) {
    if (!el) return;
    document.body.classList.add("using-pad");
    el.focus({ preventScroll: true });
    // במפה העולם זז עם המצלמה, ולכן לא גוללים את הדף
    if (!document.body.classList.contains("in-city")) el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }
  function firstEl(list) {
    // הכפתור הראשון שנראה על המסך, מלמעלה ומימין (האתר בעברית)
    const inView = list.filter(el => { const r = rectOf(el); return r.bottom > 0 && r.top < innerHeight; });
    const pool = inView.length ? inView : list;
    return pool.sort((a, b) => { const ra = rectOf(a), rb = rectOf(b); return (ra.top - rb.top) || (rb.right - ra.right); })[0];
  }

  // ---- מעבר לכפתור הקרוב בכיוון של החץ ----
  function move(key) {
    const list = candidates();
    if (!list.length) return;
    const cur = current();
    if (!cur) return focusEl(firstEl(list));
    const c = center(rectOf(cur));
    const v = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[key];
    // קודם מחפשים בתוכן של המסך, ורק אם אין שם כלום בכיוון הזה עוברים לסרגל העליון או התחתון
    const app = document.getElementById("app");
    const inApp = app && scope() === document.body ? list.filter(el => app.contains(el)) : [];
    const best = nearest(inApp, cur, c, v) || nearest(list, cur, c, v);
    if (best) focusEl(best);
  }
  function nearest(list, cur, c, v) {
    const cr = rectOf(cur);
    let best = null, bestScore = Infinity;
    for (const el of list) {
      if (el === cur) continue;
      const r = rectOf(el), p = center(r), dx = p.x - c.x, dy = p.y - c.y;
      const along = dx * v[0] + dy * v[1];
      if (along <= 4) continue;
      // כמה רחוק הכפתור הצידה. אם הוא באותה שורה (או עמודה) של הכפתור הנוכחי, זה לא נחשב רחוק
      const side = v[0] ? Math.max(0, r.top - cr.bottom, cr.top - r.bottom) : Math.max(0, r.left - cr.right, cr.left - r.right);
      const score = along + side * 2.5;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    return best;
  }
  function cycle(step) {
    const list = candidates();
    if (!list.length) return;
    const i = list.indexOf(current());
    focusEl(list[i < 0 ? (step > 0 ? 0 : list.length - 1) : (i + step + list.length) % list.length]);
  }

  // לחיצת מקלדת מדומה. מחזיר true אם משחק השתמש בה (preventDefault)
  function key(type, k, repeat) {
    const ev = new KeyboardEvent(type, { key: k, code: k, bubbles: true, cancelable: true, repeat: !!repeat });
    (document.activeElement || document.body).dispatchEvent(ev);
    return ev.defaultPrevented;
  }

  // ---- A: לוחצים על מה שבחור. במפה בלי בחירה: נכנסים לבניין הקרוב לדמות ----
  function pressA() {
    const cur = current();
    if (cur) {
      const was = { sig: sig(cur), at: center(rectOf(cur)) };
      cur.click();
      // הרבה מסכים נבנים מחדש אחרי לחיצה: מחזירים את הבחירה לאותו כפתור או לקרוב אליו
      setTimeout(() => refocus(was), 60);
      return;
    }
    if (key("keydown", "Enter")) { key("keyup", "Enter"); return; }
    key("keyup", "Enter");
    const me = document.getElementById("me"), blds = [...document.querySelectorAll("#city .bld")];
    if (me && blds.length) {
      const m = center(me.getBoundingClientRect());
      let best = null, bd = Infinity;
      blds.forEach(b => { const p = center(b.getBoundingClientRect()), d = Math.hypot(p.x - m.x, p.y - m.y); if (d < bd) { bd = d; best = b; } });
      if (best && bd < 160) { best.click(); return; }
    }
    focusEl(firstEl(candidates()));
  }
  const sig = el => el.id ? "#" + el.id : el.tagName + "|" + [...el.attributes].filter(a => a.name.startsWith("data-") || a.name === "href").map(a => a.name + "=" + a.value).join("|") + "|" + el.textContent.trim().slice(0, 40);
  function refocus(was) {
    if (current()) return;
    const list = candidates();
    if (!list.length) return;
    const same = list.find(el => sig(el) === was.sig);
    if (same) return focusEl(same);
    // מסך חדש לגמרי (עברו לעמוד אחר): מתחילים מהכפתור הראשון
    if (!document.contains(document.activeElement) || document.activeElement === document.body) {
      let best = null, bd = Infinity;
      list.forEach(el => { const p = center(rectOf(el)), d = Math.hypot(p.x - was.at.x, p.y - was.at.y); if (d < bd) { bd = d; best = el; } });
      focusEl(bd < 120 ? best : firstEl(list));
    }
  }

  // ---- B: סוגרים חלון פתוח, אחרת חוזרים אחורה (לא יוצאים מהאתר מהמסך הראשי) ----
  function pressB() {
    if (key("keydown", "Escape")) return;
    const top = scope(), x = top === document.body ? null : top.querySelector(".menu-x, #tour-skip, #wk-later");
    if (x) { x.click(); return; }
    const h = location.hash || "#/";
    if (h !== "#/" && h !== "#") history.back();
  }

  function dirsOf(gp) {
    const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    return {
      ArrowUp: b(BTN.UP) || ay < -DEAD, ArrowDown: b(BTN.DOWN) || ay > DEAD,
      ArrowLeft: b(BTN.LEFT) || ax < -DEAD, ArrowRight: b(BTN.RIGHT) || ax > DEAD,
    };
  }

  function poll(now) {
    raf = 0;
    const pads = readPads();
    if (!pads.length) { release(); return; }
    const state = {};
    pads.forEach(gp => {
      const d = dirsOf(gp);
      DIRS.forEach(k => { state[k] = state[k] || d[k]; });
      [BTN.A, BTN.B, BTN.LB, BTN.RB, BTN.MENU].forEach(i => { state["b" + i] = state["b" + i] || !!(gp.buttons[i] && gp.buttons[i].pressed); });
    });

    // חיצים: לוחצים, מחזיקים ומשחררים כמו במקלדת
    DIRS.forEach(k => {
      if (state[k] && !held[k]) {
        // כשחלון פתוח (תפריט, הדרכה) החיצים זזים בין הכפתורים שלו ולא מזיזים את הדמות
        const used = scope() === document.body ? key("keydown", k) : false;
        held[k] = { used, next: now + FIRST_REPEAT };
        if (!used) move(k);
      } else if (state[k] && held[k] && !held[k].used && now >= held[k].next) {
        // חוזרים על התזוזה בין כפתורים כשמחזיקים (במשחקים לא, כדי לא לענות פעמיים)
        held[k].next = now + REPEAT;
        if (scope() !== document.body || !key("keydown", k, true)) move(k);
      } else if (!state[k] && held[k]) {
        key("keyup", k); held[k] = null;
      }
    });

    const down = i => state["b" + i] && !prev["b" + i];
    if (down(BTN.A)) pressA();
    if (down(BTN.B)) pressB();
    if (down(BTN.LB)) cycle(-1);
    if (down(BTN.RB)) cycle(1);
    if (down(BTN.MENU) && !document.querySelector(".tour, .weekly-pop")) { const m = document.getElementById("menuBtn"); if (m) { m.click(); setTimeout(() => { if (!current()) focusEl(firstEl(candidates())); }, 60); } }
    prev = state;
    raf = requestAnimationFrame(poll);
  }
  function release() {
    DIRS.forEach(k => { if (held[k]) { key("keyup", k); held[k] = null; } });
    prev = {};
  }
  function start() { if (!raf) raf = requestAnimationFrame(poll); }

  function note(text) {
    const n = document.createElement("div");
    n.className = "pad-note"; n.textContent = text;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2600);
  }
  window.addEventListener("gamepadconnected", () => {
    note("🎮 השלט מחובר! A לבחירה, B לחזרה, החיצים לתזוזה");
    start();
  });
  // בדפדפנים מסוימים השלט כבר מחובר כשהדף נטען
  if (readPads().length) start();
  // נגיעה או עכבר: מסתירים את מסגרת הבחירה של השלט
  document.addEventListener("pointerdown", () => document.body.classList.remove("using-pad"), true);
})();
