// Quiz Trail: a neutral demo for app testers.
// Self-contained: no file from the main site is loaded here, and it keeps its own storage key.
(function () {
  "use strict";
  const KEY = "quiztrail.v1";
  const app = document.getElementById("app");
  const hud = document.getElementById("hud");

  // ---------- strings (English and Hebrew) ----------
  const STR = {
    en: {
      brand: "Quiz Trail", tabMap: "Map", tabSpeed: "Speed", tabShop: "Shop", tabSettings: "Settings",
      welcome: "Welcome to Quiz Trail!", welcomeSub: "Answer questions, earn coins and stars, and unlock new stops on the trail.",
      yourName: "Your name", pickBuddy: "Pick your character", start: "Let's go!", namePh: "Type a name",
      mapTitle: "The trail", mapSub: "Each stop has 5 questions. Get at least one star to open the next stop.",
      locked: "Locked", play: "Play", question: "Question {a} of {b}", next: "Next", finish: "See results",
      correct: "Correct! +10 🪙", wrong: "Not quite. The answer: {x}", timeUp: "Time's up! The answer: {x}",
      result: "{a} of {b} correct", backMap: "Back to the map", again: "Play again",
      speedTitle: "Speed round", speedSub: "60 seconds. Questions from every stop. How many can you get?",
      speedGo: "Start", speedBest: "Best: {n}", speedScore: "Score: {n}", speedDone: "Time! You got {n}.",
      shopTitle: "Shop", shopSub: "Spend coins on looks for your character.", buy: "Buy", wear: "Wear", wearing: "Wearing", none: "Nothing",
      noCoins: "Not enough coins yet", settingsTitle: "Settings", language: "Language", sound: "Sound", on: "On", off: "Off",
      reset: "Start over", resetAsk: "Delete progress on this device?", about: "This is a test build of the game. Please report any bugs, layout problems or crashes you see, with your phone model and Android version.",
      newStop: "New stop unlocked: {x}!",
    },
    he: {
      brand: "מסלול החידות", tabMap: "מפה", tabSpeed: "מהירות", tabShop: "חנות", tabSettings: "הגדרות",
      welcome: "ברוכים הבאים למסלול החידות!", welcomeSub: "עונים על שאלות, אוספים מטבעות וכוכבים ופותחים תחנות חדשות במסלול.",
      yourName: "השם שלך", pickBuddy: "בחרו דמות", start: "יוצאים לדרך!", namePh: "הקלידו שם",
      mapTitle: "המסלול", mapSub: "בכל תחנה 5 שאלות. כוכב אחד לפחות פותח את התחנה הבאה.",
      locked: "נעול", play: "שחקו", question: "שאלה {a} מתוך {b}", next: "הבאה", finish: "לתוצאות",
      correct: "נכון! +10 🪙", wrong: "לא בדיוק. התשובה: {x}", timeUp: "נגמר הזמן! התשובה: {x}",
      result: "{a} מתוך {b} נכונות", backMap: "חזרה למפה", again: "עוד פעם",
      speedTitle: "סבב מהירות", speedSub: "60 שניות, שאלות מכל התחנות. כמה תספיקו?",
      speedGo: "התחלה", speedBest: "שיא: {n}", speedScore: "ניקוד: {n}", speedDone: "נגמר הזמן! צברתם {n}.",
      shopTitle: "חנות", shopSub: "קונים במטבעות פריטים לדמות.", buy: "קנייה", wear: "ללבוש", wearing: "לבוש", none: "בלי",
      noCoins: "עוד אין מספיק מטבעות", settingsTitle: "הגדרות", language: "שפה", sound: "צלילים", on: "פועל", off: "כבוי",
      reset: "להתחיל מחדש", resetAsk: "למחוק את ההתקדמות במכשיר הזה?", about: "זו גרסת בדיקה של המשחק. נשמח לשמוע על כל באג, בעיית תצוגה או קריסה, עם דגם הטלפון וגרסת האנדרואיד.",
      newStop: "נפתחה תחנה חדשה: {x}!",
    },
  };

  // ---------- stops and questions (general knowledge only) ----------
  const q = (en, he, answersEn, answersHe, c) => ({ en, he, a: answersEn.map((x, i) => ({ en: x, he: answersHe[i] })), c });
  const STOPS = [
    { id: "animals", icon: "🐾", color: "#16a34a", name: { en: "Animal Park", he: "פארק החיות" }, qs: [
      q("Which animal is the largest on Earth?", "איזו חיה היא הגדולה ביותר על פני כדור הארץ?", ["Blue whale", "Elephant", "Giraffe", "Hippo"], ["לווייתן כחול", "פיל", "ג׳ירפה", "היפופוטם"], 0),
      q("How many legs does a spider have?", "כמה רגליים יש לעכביש?", ["6", "8", "10", "12"], ["6", "8", "10", "12"], 1),
      q("Which bird cannot fly?", "איזו ציפור לא יכולה לעוף?", ["Eagle", "Penguin", "Parrot", "Owl"], ["נשר", "פינגווין", "תוכי", "ינשוף"], 1),
      q("What do bees make?", "מה הדבורים מייצרות?", ["Milk", "Silk", "Honey", "Wool"], ["חלב", "משי", "דבש", "צמר"], 2),
      q("Which animal is known for its black and white stripes?", "איזו חיה מפורסמת בפסים שחורים ולבנים?", ["Tiger", "Zebra", "Panda", "Skunk"], ["נמר", "זברה", "פנדה", "בואש"], 1),
      q("What is a baby frog called?", "איך קוראים לצפרדע תינוקת?", ["Cub", "Calf", "Tadpole", "Chick"], ["גור", "עגל", "ראשן", "אפרוח"], 2),
    ] },
    { id: "world", icon: "🌍", color: "#0284c7", name: { en: "World Harbor", he: "נמל העולם" }, qs: [
      q("Which is the largest ocean?", "מהו האוקיינוס הגדול ביותר?", ["Atlantic", "Indian", "Arctic", "Pacific"], ["האטלנטי", "ההודי", "הארקטי", "השקט"], 3),
      q("How many continents are there?", "כמה יבשות יש?", ["5", "6", "7", "8"], ["5", "6", "7", "8"], 2),
      q("What is the capital of Japan?", "מהי בירת יפן?", ["Seoul", "Tokyo", "Beijing", "Bangkok"], ["סיאול", "טוקיו", "בייג׳ינג", "בנגקוק"], 1),
      q("Which is the longest river in the world?", "מהו הנהר הארוך בעולם?", ["Nile", "Danube", "Thames", "Rhine"], ["הנילוס", "הדנובה", "התמזה", "הריין"], 0),
      q("Which country is shaped like a boot?", "איזו מדינה נראית כמו מגף?", ["Spain", "Greece", "Italy", "Portugal"], ["ספרד", "יוון", "איטליה", "פורטוגל"], 2),
      q("Which is the tallest mountain on Earth?", "מהו ההר הגבוה בעולם?", ["Kilimanjaro", "Everest", "Mont Blanc", "Fuji"], ["קילימנג׳רו", "אוורסט", "מון בלאן", "פוג׳י"], 1),
    ] },
    { id: "science", icon: "🔬", color: "#9333ea", name: { en: "Science Lab", he: "מעבדת המדע" }, qs: [
      q("What gas do plants take in from the air?", "איזה גז הצמחים קולטים מהאוויר?", ["Oxygen", "Carbon dioxide", "Helium", "Nitrogen"], ["חמצן", "פחמן דו-חמצני", "הליום", "חנקן"], 1),
      q("At what temperature does water boil at sea level?", "באיזו טמפרטורה מים רותחים בגובה פני הים?", ["50°C", "90°C", "100°C", "120°C"], ["50°C", "90°C", "100°C", "120°C"], 2),
      q("What pulls things down toward the ground?", "מה מושך דברים למטה אל האדמה?", ["Magnetism", "Gravity", "Wind", "Light"], ["מגנטיות", "כוח המשיכה", "רוח", "אור"], 1),
      q("Which part of the body pumps blood?", "איזה איבר בגוף מזרים את הדם?", ["Lungs", "Brain", "Heart", "Stomach"], ["ריאות", "מוח", "לב", "קיבה"], 2),
      q("What is frozen water called?", "איך קוראים למים קפואים?", ["Steam", "Ice", "Fog", "Dew"], ["אדים", "קרח", "ערפל", "טל"], 1),
      q("Which color do you get by mixing blue and yellow?", "איזה צבע מקבלים מערבוב כחול וצהוב?", ["Green", "Purple", "Orange", "Brown"], ["ירוק", "סגול", "כתום", "חום"], 0),
    ] },
    { id: "math", icon: "➗", color: "#ea580c", name: { en: "Number Bridge", he: "גשר המספרים" }, qs: [
      q("What is 7 × 8?", "כמה זה 7 × 8?", ["54", "56", "64", "48"], ["54", "56", "64", "48"], 1),
      q("How many sides does a hexagon have?", "כמה צלעות יש למשושה?", ["5", "6", "7", "8"], ["5", "6", "7", "8"], 1),
      q("What is half of 150?", "כמה זה חצי מ-150?", ["50", "70", "75", "80"], ["50", "70", "75", "80"], 2),
      q("How many minutes are in 2 hours?", "כמה דקות יש בשעתיים?", ["100", "120", "160", "200"], ["100", "120", "160", "200"], 1),
      q("What is 1000 − 1?", "כמה זה 1000 פחות 1?", ["99", "990", "999", "9999"], ["99", "990", "999", "9999"], 2),
      q("Which number is a prime number?", "איזה מספר הוא מספר ראשוני?", ["9", "15", "13", "21"], ["9", "15", "13", "21"], 2),
    ] },
    { id: "space", icon: "🚀", color: "#1e40af", name: { en: "Space Station", he: "תחנת החלל" }, qs: [
      q("Which planet is known as the Red Planet?", "איזה כוכב לכת נקרא ״הכוכב האדום״?", ["Venus", "Mars", "Jupiter", "Saturn"], ["נוגה", "מאדים", "צדק", "שבתאי"], 1),
      q("What is the closest star to Earth?", "מהו הכוכב הקרוב ביותר לכדור הארץ?", ["The Sun", "Polaris", "Sirius", "Vega"], ["השמש", "כוכב הצפון", "סיריוס", "וגה"], 0),
      q("Which planet has big bright rings?", "לאיזה כוכב לכת יש טבעות גדולות ובולטות?", ["Mercury", "Earth", "Saturn", "Mars"], ["כוכב חמה", "כדור הארץ", "שבתאי", "מאדים"], 2),
      q("How long does Earth take to go around the Sun?", "כמה זמן לוקח לכדור הארץ להקיף את השמש?", ["A day", "A month", "A year", "A week"], ["יום", "חודש", "שנה", "שבוע"], 2),
      q("Which is the largest planet?", "מהו כוכב הלכת הגדול ביותר?", ["Jupiter", "Neptune", "Earth", "Uranus"], ["צדק", "נפטון", "כדור הארץ", "אורנוס"], 0),
      q("What do astronauts wear outside the station?", "מה לובשים אסטרונאוטים מחוץ לתחנה?", ["A raincoat", "A spacesuit", "A wetsuit", "Pajamas"], ["מעיל גשם", "חליפת חלל", "חליפת צלילה", "פיג׳מה"], 1),
    ] },
    { id: "sports", icon: "⚽", color: "#dc2626", name: { en: "Sports Arena", he: "זירת הספורט" }, qs: [
      q("How many players does a soccer team have on the field?", "כמה שחקנים יש לקבוצת כדורגל על המגרש?", ["9", "10", "11", "12"], ["9", "10", "11", "12"], 2),
      q("In which sport do you use a racket and a shuttlecock?", "באיזה ספורט משתמשים במחבט ובכדור נוצה?", ["Tennis", "Badminton", "Squash", "Golf"], ["טניס", "בדמינטון", "סקווש", "גולף"], 1),
      q("How many rings are on the Olympic flag?", "כמה טבעות יש בדגל האולימפי?", ["4", "5", "6", "7"], ["4", "5", "6", "7"], 1),
      q("In basketball, how many points is a shot from far behind the line?", "בכדורסל, כמה נקודות שווה זריקה מרחוק מאחורי הקשת?", ["1", "2", "3", "4"], ["1", "2", "3", "4"], 2),
      q("Which sport is played on ice with a puck?", "איזה ספורט משחקים על קרח עם דסקית?", ["Curling", "Ice hockey", "Skiing", "Bobsled"], ["קרלינג", "הוקי קרח", "סקי", "מזחלות"], 1),
      q("How long is a marathon, roughly?", "מה האורך של מרתון, בערך?", ["10 km", "21 km", "42 km", "100 km"], ["10 ק״מ", "21 ק״מ", "42 ק״מ", "100 ק״מ"], 2),
    ] },
  ];

  const BUDDIES = ["🦊", "🐼", "🐯", "🦁", "🐸", "🐵", "🐨", "🐧"];
  const COLORS = ["#4f46e5", "#0ea5e9", "#16a34a", "#f59e0b", "#ef4444", "#db2777"];
  const ITEMS = [
    { id: "cap", icon: "🧢", price: 20, name: { en: "Cap", he: "כובע מצחייה" } },
    { id: "shades", icon: "🕶️", price: 30, name: { en: "Sunglasses", he: "משקפי שמש" } },
    { id: "phones", icon: "🎧", price: 40, name: { en: "Headphones", he: "אוזניות" } },
    { id: "top", icon: "🎩", price: 60, name: { en: "Top hat", he: "מגבעת" } },
    { id: "crown", icon: "👑", price: 120, name: { en: "Crown", he: "כתר" } },
    { id: "rocket", icon: "🚀", price: 150, name: { en: "Jetpack", he: "תרמיל סילון" } },
  ];

  // ---------- state ----------
  const fresh = () => ({ lang: (navigator.language || "").startsWith("he") ? "he" : "en", sound: true, name: "", buddy: BUDDIES[0], color: COLORS[0], coins: 0, stars: {}, owned: [], wear: null, best: 0 });
  let S = fresh();
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* private mode */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

  const L = () => STR[S.lang] || STR.en;
  const t = (k, vars) => (L()[k] || STR.en[k] || k).replace(/\{(\w)\}/g, (m, v) => vars && v in vars ? vars[v] : m);
  const tx = o => o[S.lang] || o.en;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

  function applyLang() {
    const he = S.lang === "he";
    document.documentElement.lang = S.lang;
    document.documentElement.dir = he ? "rtl" : "ltr";
    document.title = t("brand");
    document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.dataset.t); });
  }

  // ---------- sound ----------
  let actx = null;
  function beep(ok) {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = ok ? [660, 880] : [300, 220];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), at = actx.currentTime + i * 0.12;
        o.type = ok ? "triangle" : "sawtooth"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.18, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
        o.connect(g); g.connect(actx.destination); o.start(at); o.stop(at + 0.2);
      });
    } catch (e) { /* no audio */ }
  }

  // ---------- helpers ----------
  const totalStars = () => Object.values(S.stars).reduce((a, b) => a + b, 0);
  const unlocked = i => i === 0 || (S.stars[STOPS[i - 1].id] || 0) > 0;
  function buddyHTML(size, wear = S.wear) {
    const it = ITEMS.find(x => x.id === wear);
    return `<span class="buddy" style="--s:${size}px;--c:${S.color}"><span class="face">${S.buddy}</span>${it ? `<span class="wear w-${it.id}">${it.icon}</span>` : ""}</span>`;
  }
  function renderHud() {
    hud.innerHTML = S.name ? `<span class="pill">🪙 ${S.coins}</span><span class="pill">⭐ ${totalStars()}</span>${buddyHTML(34)}` : "";
  }
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("out"), 2200);
    setTimeout(() => el.remove(), 2700);
  }
  let timer = null;
  const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };

  function setTab(name) {
    document.querySelectorAll("#tabs [data-go]").forEach(b => b.classList.toggle("on", b.dataset.go === name));
    document.getElementById("tabs").hidden = !S.name;
  }

  // ---------- screens ----------
  function go(name, arg) {
    stopTimer();
    if (!S.name && name !== "settings") name = "welcome";
    window.scrollTo(0, 0);
    ({ welcome, map, quiz, speed, shop, settings })[name](arg);
    setTab(name === "quiz" ? "map" : name);
    renderHud();
  }

  function welcome() {
    let buddy = S.buddy, color = S.color;
    app.innerHTML = `
      <section class="card hero">
        <span class="seg lang-top"><button type="button" data-lang="en" class="${S.lang === "en" ? "on" : ""}">English</button><button type="button" data-lang="he" class="${S.lang === "he" ? "on" : ""}">עברית</button></span>
        <div class="big-buddy" id="pv"></div>
        <h1>${t("welcome")}</h1>
        <p class="muted">${t("welcomeSub")}</p>
        <label class="lbl" for="nm">${t("yourName")}</label>
        <input id="nm" maxlength="16" autocomplete="off" placeholder="${esc(t("namePh"))}" value="${esc(S.name)}">
        <div class="lbl">${t("pickBuddy")}</div>
        <div class="grid buddies">${BUDDIES.map(b => `<button type="button" class="opt" data-b="${b}">${b}</button>`).join("")}</div>
        <div class="grid colors">${COLORS.map(c => `<button type="button" class="dot" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join("")}</div>
        <button type="button" class="btn primary" id="go">${t("start")}</button>
      </section>`;
    const paint = () => {
      app.querySelector("#pv").innerHTML = `<span class="buddy" style="--s:96px;--c:${color}"><span class="face">${buddy}</span></span>`;
      app.querySelectorAll("[data-b]").forEach(b => b.classList.toggle("on", b.dataset.b === buddy));
      app.querySelectorAll("[data-c]").forEach(b => b.classList.toggle("on", b.dataset.c === color));
    };
    app.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { buddy = b.dataset.b; paint(); });
    app.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { color = b.dataset.c; paint(); });
    paint();
    app.querySelectorAll("[data-lang]").forEach(b => b.onclick = () => { S.lang = b.dataset.lang; save(); applyLang(); welcome(); });
    app.querySelector("#go").onclick = () => {
      const nm = app.querySelector("#nm").value.trim();
      if (!nm) { app.querySelector("#nm").focus(); app.querySelector("#nm").classList.add("shake"); return; }
      Object.assign(S, { name: nm, buddy, color }); save(); go("map");
    };
  }

  function map() {
    const pts = STOPS.map((s, i) => ({ x: i % 2 ? 72 : 28, y: 8 + i * 17 }));
    const path = pts.map((p, i) => (i ? "L" : "M") + p.x + " " + p.y).join(" ");
    app.innerHTML = `
      <section class="card"><h2>${t("mapTitle")}</h2><p class="muted">${t("mapSub")}</p></section>
      <section class="trail">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" /></svg>
        ${STOPS.map((s, i) => {
          const open = unlocked(i), st = S.stars[s.id] || 0;
          return `<button type="button" class="stop ${open ? "" : "lock"}" style="left:${pts[i].x}%;top:${pts[i].y}%;--c:${s.color}" ${open ? `data-stop="${s.id}"` : "disabled"}>
            <span class="ic">${open ? s.icon : "🔒"}</span>
            <span class="nm">${esc(tx(s.name))}</span>
            <span class="st">${open ? "★".repeat(st) + "☆".repeat(3 - st) : t("locked")}</span>
          </button>`;
        }).join("")}
      </section>`;
    app.querySelectorAll("[data-stop]").forEach(b => b.onclick = () => go("quiz", b.dataset.stop));
  }

  // one question on screen; calls done(correct) after the answer or the timer
  function askOne(box, item, secs, done, quick) {
    const order = shuffle(item.a.map((a, i) => i));
    box.innerHTML = `
      <div class="timer"><i id="bar"></i></div>
      <h3 class="qtext">${esc(tx(item))}</h3>
      <div class="answers">${order.map(i => `<button type="button" class="ans" data-i="${i}">${esc(tx(item.a[i]))}</button>`).join("")}</div>
      <div class="fb" id="fb" aria-live="polite"></div>`;
    const bar = box.querySelector("#bar"), fb = box.querySelector("#fb");
    let left = secs * 10, over = false;
    const finish = (pick) => {
      if (over) return; over = true; stopTimer();
      const ok = pick === item.c;
      box.querySelectorAll(".ans").forEach(b => {
        const i = +b.dataset.i; b.disabled = true;
        if (i === item.c) b.classList.add("right"); else if (i === pick) b.classList.add("bad");
      });
      if (!quick) {
        const right = tx(item.a[item.c]);
        fb.textContent = pick == null ? t("timeUp", { x: right }) : ok ? t("correct") : t("wrong", { x: right });
        fb.className = "fb " + (ok ? "ok" : "no");
      }
      beep(ok);
      done(ok);
    };
    box.querySelectorAll(".ans").forEach(b => b.onclick = () => finish(+b.dataset.i));
    if (secs) {
      stopTimer();
      timer = setInterval(() => { left--; bar.style.width = Math.max(0, left / (secs * 10)) * 100 + "%"; if (left <= 0) finish(null); }, 100);
    } else bar.parentNode.remove();
  }

  function quiz(id) {
    const stop = STOPS.find(s => s.id === id);
    const items = shuffle(stop.qs).slice(0, 5);
    let n = 0, right = 0;
    function step() {
      app.innerHTML = `
        <section class="card quiz" style="--c:${stop.color}">
          <div class="qhead"><span>${stop.icon} ${esc(tx(stop.name))}</span><span>${t("question", { a: n + 1, b: items.length })}</span></div>
          <div id="qbox"></div>
          <button type="button" class="btn primary" id="nx" hidden>${n + 1 < items.length ? t("next") : t("finish")}</button>
        </section>`;
      const nx = app.querySelector("#nx");
      askOne(app.querySelector("#qbox"), items[n], 20, ok => {
        if (ok) { right++; S.coins += 10; save(); renderHud(); }
        nx.hidden = false; nx.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
      nx.onclick = () => { n++; n < items.length ? step() : end(); };
    }
    function end() {
      const stars = right >= 5 ? 3 : right >= 4 ? 2 : right >= 2 ? 1 : 0;
      const idx = STOPS.indexOf(stop), wasOpen = idx + 1 < STOPS.length && unlocked(idx + 1);
      S.stars[id] = Math.max(S.stars[id] || 0, stars); save();
      if (!wasOpen && idx + 1 < STOPS.length && unlocked(idx + 1)) toast(t("newStop", { x: tx(STOPS[idx + 1].name) }));
      app.innerHTML = `
        <section class="card hero">
          <div class="big-buddy">${buddyHTML(96)}</div>
          <div class="stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div>
          <h2>${t("result", { a: right, b: items.length })}</h2>
          <p class="muted">+${right * 10} 🪙</p>
          <button type="button" class="btn primary" id="bk">${t("backMap")}</button>
          <button type="button" class="btn" id="ag">${t("again")}</button>
        </section>`;
      app.querySelector("#bk").onclick = () => go("map");
      app.querySelector("#ag").onclick = () => go("quiz", id);
      renderHud();
    }
    step();
  }

  function speed() {
    app.innerHTML = `
      <section class="card hero">
        <div class="big-icon">⚡</div>
        <h2>${t("speedTitle")}</h2>
        <p class="muted">${t("speedSub")}</p>
        <p><b>${t("speedBest", { n: S.best })}</b></p>
        <button type="button" class="btn primary" id="sg">${t("speedGo")}</button>
      </section>`;
    app.querySelector("#sg").onclick = run;
    function run() {
      const pool = shuffle(STOPS.flatMap(s => s.qs));
      let k = 0, score = 0, end = Date.now() + 60000, clock = null;
      app.innerHTML = `
        <section class="card quiz">
          <div class="qhead"><span id="sc">${t("speedScore", { n: 0 })}</span><span id="tm">60</span></div>
          <div class="timer"><i id="sbar"></i></div>
          <div id="qbox"></div>
        </section>`;
      const sbar = app.querySelector("#sbar"), tm = app.querySelector("#tm"), sc = app.querySelector("#sc");
      const next = () => askOne(app.querySelector("#qbox"), pool[k++ % pool.length], 0, ok => {
        if (ok) { score++; S.coins += 2; save(); renderHud(); }
        sc.textContent = t("speedScore", { n: score });
        setTimeout(() => { if (Date.now() < end && document.body.contains(sbar)) next(); }, ok ? 350 : 800);
      }, true);
      next();
      clock = setInterval(() => {
        if (!document.body.contains(sbar)) { clearInterval(clock); return; }
        const left = Math.max(0, end - Date.now());
        sbar.style.width = left / 600 + "%"; tm.textContent = Math.ceil(left / 1000);
        if (!left) {
          clearInterval(clock);
          if (score > S.best) { S.best = score; save(); }
          app.innerHTML = `
            <section class="card hero">
              <div class="big-buddy">${buddyHTML(96)}</div>
              <h2>${t("speedDone", { n: score })}</h2>
              <p class="muted">${t("speedBest", { n: S.best })} · +${score * 2} 🪙</p>
              <button type="button" class="btn primary" id="sg">${t("again")}</button>
            </section>`;
          app.querySelector("#sg").onclick = run;
        }
      }, 100);
    }
  }

  function shop() {
    app.innerHTML = `
      <section class="card hero">
        <div class="big-buddy">${buddyHTML(110)}</div>
        <h2>${t("shopTitle")}</h2><p class="muted">${t("shopSub")}</p>
      </section>
      <section class="items">
        <button type="button" class="item ${S.wear ? "" : "on"}" data-wear=""><span class="ic">✖️</span><b>${t("none")}</b><small>${S.wear ? t("wear") : t("wearing")}</small></button>
        ${ITEMS.map(it => {
          const own = S.owned.includes(it.id), on = S.wear === it.id;
          return `<button type="button" class="item ${on ? "on" : ""}" ${own ? `data-wear="${it.id}"` : `data-buy="${it.id}"`}>
            <span class="ic">${it.icon}</span><b>${esc(tx(it.name))}</b>
            <small>${on ? t("wearing") : own ? t("wear") : `${t("buy")} · ${it.price} 🪙`}</small></button>`;
        }).join("")}
      </section>`;
    app.querySelectorAll("[data-wear]").forEach(b => b.onclick = () => { S.wear = b.dataset.wear || null; save(); go("shop"); });
    app.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => {
      const it = ITEMS.find(x => x.id === b.dataset.buy);
      if (S.coins < it.price) { toast(t("noCoins")); return; }
      S.coins -= it.price; S.owned.push(it.id); S.wear = it.id; save(); beep(true); go("shop");
    });
  }

  function settings() {
    app.innerHTML = `
      <section class="card">
        <h2>${t("settingsTitle")}</h2>
        <div class="row"><span>${t("language")}</span>
          <span class="seg"><button type="button" data-lang="en" class="${S.lang === "en" ? "on" : ""}">English</button><button type="button" data-lang="he" class="${S.lang === "he" ? "on" : ""}">עברית</button></span></div>
        <div class="row"><span>${t("sound")}</span>
          <span class="seg"><button type="button" data-snd="1" class="${S.sound ? "on" : ""}">${t("on")}</button><button type="button" data-snd="0" class="${S.sound ? "" : "on"}">${t("off")}</button></span></div>
        <p class="muted about">${t("about")}</p>
        <button type="button" class="btn danger" id="rs">${t("reset")}</button>
      </section>`;
    app.querySelectorAll("[data-lang]").forEach(b => b.onclick = () => { S.lang = b.dataset.lang; save(); applyLang(); go("settings"); });
    app.querySelectorAll("[data-snd]").forEach(b => b.onclick = () => { S.sound = b.dataset.snd === "1"; save(); go("settings"); });
    app.querySelector("#rs").onclick = () => {
      const b = app.querySelector("#rs");
      if (!b.dataset.sure) { b.dataset.sure = "1"; b.textContent = t("resetAsk"); return; }
      const lang = S.lang; S = fresh(); S.lang = lang; save(); go("welcome");
    };
  }

  document.addEventListener("click", ev => {
    const b = ev.target.closest("[data-go]");
    if (b && !b.closest("#app")) go(b.dataset.go);
  });
  applyLang();
  go(S.name ? "map" : "welcome");
})();
