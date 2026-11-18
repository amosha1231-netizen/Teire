// מאכלים בדרכים, אנרגיה ועייפות.
// הליכה במפה מורידה אנרגיה. כשהאנרגיה נמוכה הדמות עייפה והולכת לאט.
// על המפה מפוזרים מאכלים (content/brachot.js). מי שעונה נכון מה מברכים על המאכל, "מתקן ניצוץ קדושה":
// הדמות אוכלת, מקבלת אנרגיה ו"כוח" לזמן קצר (הליכה מהירה וזוהרת).
// הנתונים נשמרים בשחקן: energy, energyAt, boost, sparks, food = { win, done: [...] }.
(function () {
  const MAX = 100;            // אנרגיה מלאה
  const TIRED = 20;           // מתחת לזה הדמות עייפה
  const REGEN_MS = 2 * 60000; // נקודת אנרגיה אחת חוזרת לבד כל 2 דקות (גם כשלא משחקים)
  const STEP_PX = 70;         // כל 70 פיקסלים של הליכה עולים נקודת אנרגיה
  const MEAL = 25;            // אנרגיה מאכילה
  const BOOST_MS = 90 * 1000; // כוח אחרי אכילה: דקה וחצי
  const TIRED_SPEED = .6, BOOST_SPEED = 1.5;
  const WINDOW_MS = 4 * 60 * 60 * 1000; // מאכלים חדשים כל 4 שעות
  const PER_WINDOW = 8;       // כמה מאכלים על המפה בכל פעם

  // האנרגיה עכשיו, כולל מה שחזר לבד מאז הפעם האחרונה
  function energy(p, now = Date.now()) {
    if (typeof p.energy !== "number") return MAX;
    const back = p.energyAt ? Math.floor((now - p.energyAt) / REGEN_MS) : 0;
    return Math.min(MAX, p.energy + Math.max(0, back));
  }
  function setEnergy(p, v, now = Date.now()) {
    p.energy = Math.max(0, Math.min(MAX, v));
    p.energyAt = now;
  }
  // הליכה: מצטברים פיקסלים, וכל STEP_PX מורידים נקודה. מחזיר true אם האנרגיה השתנתה.
  let walked = 0;
  function walk(p, px, now = Date.now()) {
    walked += px;
    if (walked < STEP_PX) return false;
    const n = Math.floor(walked / STEP_PX);
    walked -= n * STEP_PX;
    setEnergy(p, energy(p, now) - n, now);
    return true;
  }
  const boosted = (p, now = Date.now()) => p.boost > now;
  const tired = (p, now = Date.now()) => energy(p, now) < TIRED && !boosted(p, now);
  const speed = (p, now = Date.now()) => boosted(p, now) ? BOOST_SPEED : tired(p, now) ? TIRED_SPEED : 1;
  function eat(p, now = Date.now()) {
    setEnergy(p, energy(p, now) + MEAL, now);
    p.boost = now + BOOST_MS;
    p.sparks = (p.sparks || 0) + 1;
  }

  // ---- איפה המאכלים ----
  // בכל חלון של 4 שעות נבחרים מאכלים ומקומות בהגרלה קבועה (כל השחקנים רואים אותו דבר באותו זמן).
  const win = (now = Date.now()) => Math.floor(now / WINDOW_MS);
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // המאכלים עומדים בדרך, ליד המקומות שבמפה (מתחת לבניין, לצד השם שלו)
  // onLand(x, y) בודק שהנקודה ביבשה, כדי שמאכל לא יעמוד בתוך הים
  function spots(locations, foods, now = Date.now(), onLand = () => true) {
    const w = win(now), r = rng(w * 7919 + 13);
    const locs = locations.slice(), list = foods.slice();
    const pick = arr => arr.splice(Math.floor(r() * arr.length), 1)[0];
    const out = [];
    while (out.length < PER_WINDOW && locs.length && list.length) {
      const L = pick(locs), side = r() < .5 ? -1 : 1, dx = 62 + r() * 18, y = Math.round(L.y + 70 + r() * 22);
      const x = [L.x + side * dx, L.x - side * dx].map(Math.round).find(x => onLand(x, y) && onLand(x, y - 40));
      if (x === undefined) continue;
      out.push({ slot: w + ":" + L.id, x, y, food: pick(list) });
    }
    return out;
  }
  // נקודה בתוך מצולע (רשימת [x, y])
  function inPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function done(p, now = Date.now()) {
    const w = win(now);
    if (!p.food || p.food.win !== w) p.food = { win: w, done: [] };
    return p.food.done;
  }
  const minutesToNext = (now = Date.now()) => Math.ceil(((win(now) + 1) * WINDOW_MS - now) / 60000);

  // ---- השאלות ----
  function shuffle(a, r = Math.random) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // שאלה בארבע תשובות: התשובה הנכונה ועוד שלוש ברכות אחרות
  function choices(map, right) {
    const others = shuffle(Object.keys(map).filter(k => k !== right)).slice(0, 3);
    const keys = shuffle([right, ...others]);
    return { answers: keys.map(k => map[k]), correct: keys.indexOf(right) };
  }
  function firstQ(f, B = window.TEIRE_BRACHOT) {
    return { question: `מה מברכים על ${f.name}, לפי ${f.posek}?`, ...choices(B.FIRST, f.first), source: f.source, note: f.note };
  }
  function afterQ(f, B = window.TEIRE_BRACHOT) {
    return f.after ? { question: `ואחרי שאכלו כזית ${f.name}, איזו ברכה אחרונה מברכים?`, ...choices(B.AFTER, f.after), source: f.afterSource, note: f.afterNote } : null;
  }

  window.TeireFood = { MAX, TIRED, MEAL, BOOST_MS, energy, setEnergy, walk, boosted, tired, speed, eat, win, spots, inPoly, done, minutesToNext, firstQ, afterQ };
})();
