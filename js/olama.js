// היכל עלמא: משחקים חיים לכל החדר. מנחה אחד פותח חדר על מסך גדול, וכולם מצטרפים מהטלפון עם קוד קצר.
// המנחה הוא "הבעלים" של המשחק: הוא שולח את מצב המשחק לכולם (broadcast), ואוסף את התשובות.
// תשובות האורחים נכתבות לטבלה olama_events (supabase/update-8.sql), והמנחה קורא אותה כל שנייה.
// כך גם עם 40 טלפונים לא נשלחת כל תשובה לכל הטלפונים. אם הטבלה עוד לא קיימת, התשובות נשלחות ב-broadcast.
// בלי Supabase הכול עובד בין לשוניות באותו דפדפן (BroadcastChannel), לבדיקה.
(function () {
  const db = window.TeireDB;
  const sb = db.realtime;
  const TIME = 15000;
  const COLORS = ["#e11d48", "#2563eb", "#d97706", "#16a34a"];
  const LETTERS = ["א", "ב", "ג", "ד"];
  const SITE_URL = "https://amosha1231-netizen.github.io/Teire/";

  const MODES = {
    one: { name: "אחד נגד מאה", icon: "🦁", count: 12, rules: "שחקן אחד עומד מול כל החדר. כולם עונים על אותה שאלה. מי מהקהל שטועה, יוצא. אם האחד טועה, הקהל שנשאר מנצח. אם האחד מוציא את כל הקהל, הוא מנצח!" },
    quiz: { name: "חידון חי", icon: "⚡", count: 10, rules: "כולם עונים על כל שאלה. תשובה נכונה ומהירה שווה יותר נקודות. אחרי כל שאלה רואים את חמשת המובילים, ובסוף עולים לפודיום." },
    team: { name: "שבט מול שבט", icon: "🏳️", count: 12, rules: "החדר מתחלק באקראי לשבטים. כל אחד עונה מהטלפון, והתשובה של השבט היא מה שרוב חברי השבט בחרו. שבט שצדק מקבל 100 נקודות. השבט עם הכי הרבה נקודות מנצח!" },
    survive: { name: "אחרון שורד", icon: "🔥", count: 20, rules: "טעית או לא ענית בזמן? יצאת. השאלות נעשות קשות יותר. אם כולם טועים באותה שאלה, כולם נשארים. האחרון שנשאר מנצח!" },
  };
  const TOPICS = {
    mix: { name: "כל עולם התורה", test: () => true },
    shas: { name: "משנה וגמרא", test: p => p === "mishna" || p === "gemara" || p === "beit-midrash" || p === "sages" || p === "aramaic-hall" },
    tanach: { name: "תורה, תנ\"ך ופרשת השבוע", test: p => ["gan-eden", "teiva", "ohel", "mitzrayim", "sinai", "midbar", "mikdash", "david"].includes(p) || p.startsWith("parasha") || p === "verse-hall" },
    halacha: { name: "הלכה ומנהג", test: p => p.startsWith("kollel") || p === "beit-knesset" },
    gdolim: { name: "חכמים וגדולי ישראל", test: p => p === "sages" || ["vilna", "volozhin", "radin", "mezhibozh", "breslov", "prague", "baghdad", "morocco", "fustat"].includes(p) },
  };
  const LEVELS = {
    ramp: { name: "מתחיל קל ונהיה קשה", min: 1 },
    hard: { name: "קשות מההתחלה", min: 3 },
  };

  const TRIBES = [["יהודה", "#dc2626"], ["לוי", "#2563eb"], ["אפרים", "#16a34a"], ["דן", "#d97706"], ["נפתלי", "#7c3aed"], ["זבולון", "#0891b2"]];
  // שבט מול שבט: כמה שבטים לפי מספר השחקנים
  const tribeCount = n => n < 12 ? 2 : n < 24 ? 3 : 4;

  let ctx = null, session = null;
  const esc = s => ctx.esc(s);
  const app = () => document.getElementById("app");

  // ---------- ערוץ החדר ----------
  function channel(code, onMsg) {
    if (sb) {
      const ch = sb.channel("teire-olama-" + code, { config: { broadcast: { self: false } } });
      ch.on("broadcast", { event: "m" }, ({ payload }) => onMsg(payload));
      ch.subscribe();
      return { send: p => ch.send({ type: "broadcast", event: "m", payload: p }), close: () => sb.removeChannel(ch) };
    }
    const bc = new BroadcastChannel("teire-olama-" + code);
    bc.onmessage = ev => onMsg(ev.data);
    return { send: p => bc.postMessage(p), close: () => bc.close() };
  }

  // ---------- שאלות ----------
  function questionPool(topic) {
    const seen = new Set(), out = [];
    const add = (q, place, lvl) => {
      if (!q || !q.question || !Array.isArray(q.answers) || q.answers.length !== 4 || typeof q.correct !== "number") return;
      if (!TOPICS[topic].test(place) || seen.has(q.question)) return;
      seen.add(q.question);
      out.push({ question: q.question, answers: q.answers, correct: q.correct, source: q.source || "", verse: q.verse || "", lvl });
    };
    (window.TEIRE_SEED || []).forEach(q => add(q, q.place, 1));
    const L = window.TEIRE_LEVELS || {};
    Object.keys(L).forEach(place => Object.keys(L[place]).forEach(lvl => (L[place][lvl] || []).forEach(q => add(q, place, Number(lvl)))));
    ((window.TeireSages || {}).SAGES || []).forEach(s => (s.quest || []).forEach(q => add(q, "sages", 3)));
    return out;
  }
  // מדרגות: כל שאלה נלקחת משלב קושי גבוה יותר, כך שהשאלות האחרונות הן הקשות ביותר
  function pickQuestions(topic, n, level) {
    let pool = questionPool(topic);
    const hard = pool.filter(q => q.lvl >= LEVELS[level].min);
    if (hard.length >= n) pool = hard;
    const buckets = [...new Set(pool.map(q => q.lvl))].sort((a, b) => a - b).map(l => db.shuffle(pool.filter(q => q.lvl === l)));
    const qs = [];
    for (let i = 0; i < n && buckets.some(b => b.length); i++) {
      let bi = Math.round(i * (buckets.length - 1) / Math.max(1, n - 1));
      while (!buckets[bi].length) bi = (bi + 1) % buckets.length; // השלב נגמר: לוקחים מהשלב הבא
      qs.push(buckets[bi].pop());
    }
    qs.sort((a, b) => a.lvl - b.lvl);
    return qs.map(q => {
      const order = db.shuffle([0, 1, 2, 3]);
      return { question: q.question, verse: q.verse, source: q.source, answers: order.map(i => q.answers[i]), correct: order.indexOf(q.correct) };
    });
  }

  // ---------- זהות האורח ----------
  function guestId() {
    try {
      let id = sessionStorage.getItem("teire.olama.pid");
      if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("teire.olama.pid", id); }
      return id;
    } catch (e) { return Math.random().toString(36).slice(2, 10); }
  }
  const savedName = () => { try { return localStorage.getItem("teire.olama.name") || ctx.player.name || ""; } catch (e) { return ctx.player.name || ""; } };

  // ---------- כניסה להיכל ----------
  function viewHall() {
    app().innerHTML = `
      <div class="place-hero olama-hero">
        <div class="place-icon">🌐</div>
        <h1>היכל עלמא</h1>
        <p>משחקים חיים לכל החדר. חי, איפה שאתם!</p>
      </div>
      <div class="card center">
        <h3>📱 מצטרפים למשחק</h3>
        <p class="small muted">הקלידו את הקוד שמופיע על המסך הגדול</p>
        <form id="joinf" class="olama-join">
          <input id="jcode" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="קוד החדר" autocomplete="off">
          <button class="btn gold">הצטרפות</button>
        </form>
      </div>
      <div class="card">
        <h3>🎤 פותחים חדר חדש ומקבלים קוד (למנחה)</h3>
        <p class="small muted">פותחים במחשב שמחובר למסך או למקרן. אחרי הלחיצה על "פתיחת חדר" יופיעו על המסך קוד וברקוד, וכולם יצטרפו מהטלפון.</p>
        <div class="olama-modes">
          ${Object.entries(MODES).map(([id, m]) => `<label class="olama-mode"><input type="radio" name="mode" value="${id}" ${id === "one" ? "checked" : ""}>
            <span class="olama-mode-in"><b>${m.icon} ${m.name}</b><span class="small">${m.rules}</span></span></label>`).join("")}
        </div>
        <div class="olama-opts">
          <label><span class="small muted">נושא השאלות</span>
            <select id="topic">${Object.entries(TOPICS).map(([id, t]) => `<option value="${id}">${t.name}</option>`).join("")}</select></label>
          <label><span class="small muted">רמת קושי</span>
            <select id="level">${Object.entries(LEVELS).map(([id, l]) => `<option value="${id}">${l.name}</option>`).join("")}</select></label>
          <label><span class="small muted">התחלה אוטומטית</span>
            <select id="auto">${[10, 15, 20, 30, 40].map(n => `<option value="${n}" ${n === 20 ? "selected" : ""}>כשיש ${n} שחקנים, אחרי דקה</option>`).join("")}<option value="0">רק כשאני לוחץ</option></select></label>
        </div>
        <button class="btn big-btn" id="open">פתיחת חדר</button>
        ${sb ? "" : `<p class="notice small">האתר במצב מקומי, ולכן אפשר להצטרף רק מלשונית אחרת באותו דפדפן.</p>`}
      </div>`;
    document.getElementById("joinf").onsubmit = ev => {
      ev.preventDefault();
      const code = document.getElementById("jcode").value.trim();
      if (/^\d{4}$/.test(code)) location.hash = "#/olama/" + code;
      else ctx.toast("הקוד הוא 4 ספרות");
    };
    document.getElementById("open").onclick = () => {
      const mode = (document.querySelector("input[name=mode]:checked") || {}).value || "quiz";
      host(mode, document.getElementById("topic").value, document.getElementById("level").value, Number(document.getElementById("auto").value));
    };
  }

  // ---------- המנחה ----------
  function host(mode, topic, level, autoN) {
    const M = MODES[mode];
    const code = String(1000 + Math.floor(Math.random() * 9000));
    const questions = pickQuestions(topic, M.count, level);
    const AUTO_WAIT = 60000;
    if (questions.length < 3) { ctx.toast("אין מספיק שאלות בנושא הזה"); return; }
    const players = {}; // pid -> { name, score, alive, ans: { qi: {choice, ms} }, out }
    const st = { phase: "lobby", idx: 0, oneId: null, endsAt: 0, winner: null, note: "", autoAt: 0 };
    let teams = []; // [{ name, color, score, choice }]; לכל שחקן p.team = מספר השבט
    let lastId = 0, pollTimer = 0, beatTimer = 0, qTimer = 0, autoTimer = 0, nextTimer = 0, stopped = false;
    const NEXT_WAIT = 9000;
    const ch = channel(code, m => { if (m.t === "g") onEvent(m.ev); });

    function onEvent(ev) {
      if (!ev || !ev.pid) return;
      let p = players[ev.pid];
      if (!p) {
        // מי שמגיע באמצע משחק הדחה צופה בלבד
        p = players[ev.pid] = { name: String(ev.name || "אורח").slice(0, 16), score: 0, alive: st.phase === "lobby" || mode === "quiz" || mode === "team", ans: {} };
        if (teams.length) p.team = smallestTeam(); // מאחר מצטרף לשבט הקטן ביותר
        if (st.phase === "lobby") {
          // כשמגיעים מספיק שחקנים, מחכים עוד דקה למאחרים ומתחילים לבד
          if (autoN && !st.autoAt && Object.keys(players).length >= autoN) {
            st.autoAt = Date.now() + AUTO_WAIT;
            autoTimer = setTimeout(() => { if (st.phase === "lobby") start(); }, AUTO_WAIT);
          }
          draw(); broadcast();
        }
      }
      if (ev.name) p.name = String(ev.name).slice(0, 16);
      if (ev.kind === "ans" && st.phase === "q" && ev.q === st.idx && !p.ans[ev.q]) {
        p.ans[ev.q] = { choice: Number(ev.choice), ms: Math.max(0, Math.min(TIME, Number(ev.ms) || TIME)) };
        updateCount();
        const need = Object.entries(players).filter(([id, x]) => x.alive || id === st.oneId);
        if (need.length && need.every(([, x]) => x.ans[st.idx])) setTimeout(() => { if (st.phase === "q") reveal(); }, 600);
      }
    }

    // קוראים את האירועים החדשים מהטבלה. בפעם הראשונה רק מוצאים מאיפה להתחיל (כדי לא לקרוא חדרים ישנים עם אותו קוד)
    let tableOk = !!sb, started = false;
    async function poll() {
      if (stopped || !tableOk) return;
      try {
        if (!started) {
          const { data, error } = await sb.from("olama_events").select("id").order("id", { ascending: false }).limit(1);
          if (error) throw error;
          lastId = data && data[0] ? data[0].id : 0;
          started = true;
        } else {
          const { data, error } = await sb.from("olama_events").select("id,pid,name,kind,q,choice,ms").eq("room", code).gt("id", lastId).order("id").limit(500);
          if (error) throw error;
          (data || []).forEach(ev => { lastId = Math.max(lastId, ev.id); onEvent(ev); });
        }
      } catch (e) {
        if (e && (e.code === "42P01" || e.code === "PGRST205")) { tableOk = false; return; } // אין טבלה: נסתמך על broadcast
      }
      pollTimer = setTimeout(poll, 1000);
    }

    function results() {
      const ranked = Object.entries(players).sort((a, b) => (b[1].alive - a[1].alive) || b[1].score - a[1].score);
      const res = {};
      ranked.forEach(([id, p], i) => {
        const a = p.ans[st.idx];
        res[id] = [a && a.choice === (questions[st.idx] || {}).correct ? 1 : 0, p.score, i + 1, p.alive ? 1 : 0];
      });
      return res;
    }
    function snapshot() {
      const q = questions[st.idx];
      const s = { t: "s", code, mode, phase: st.phase, idx: st.idx, total: questions.length, oneId: st.oneId, oneName: st.oneId && players[st.oneId] ? players[st.oneId].name : "", n: Object.keys(players).length };
      if (st.phase === "lobby") { s.names = Object.entries(players).map(([id, p]) => [id, p.name]); s.autoLeft = st.autoAt ? Math.max(0, st.autoAt - Date.now()) : 0; }
      if (st.phase === "q") Object.assign(s, { q: { question: q.question, verse: q.verse, answers: q.answers }, left: Math.max(0, st.endsAt - Date.now()) });
      if (st.phase === "reveal" || st.phase === "end") Object.assign(s, { correct: q.correct, res: results(), note: st.note, winner: st.winner });
      if (teams.length && st.phase !== "lobby") { s.teams = teams.map(t => [t.name, t.color, t.score, t.choice]); s.tm = {}; Object.entries(players).forEach(([id, p]) => { s.tm[id] = p.team; }); }
      return s;
    }
    const broadcast = () => { if (!stopped) ch.send(snapshot()); };

    function alivePlayers() { return Object.entries(players).filter(([id, p]) => p.alive && id !== st.oneId); }

    function smallestTeam() {
      const sizes = teams.map((t, i) => Object.values(players).filter(p => p.team === i).length);
      return sizes.indexOf(Math.min(...sizes));
    }
    function start() {
      if (!Object.keys(players).length) { ctx.toast("עוד אף אחד לא הצטרף"); return; }
      if (mode === "team") {
        const ids = db.shuffle(Object.keys(players));
        if (ids.length < 2) { ctx.toast("צריך לפחות שני שחקנים"); return; }
        teams = TRIBES.slice(0, tribeCount(ids.length)).map(([name, color]) => ({ name, color, score: 0, choice: -1 }));
        ids.forEach((id, i) => { players[id].team = i % teams.length; });
      }
      if (mode === "one") {
        if (!st.oneId || !players[st.oneId]) st.oneId = db.shuffle(Object.keys(players))[0];
        if (Object.keys(players).length < 2) { ctx.toast("צריך לפחות שני שחקנים"); return; }
      }
      ask(0);
    }
    function ask(i) {
      clearTimeout(autoTimer); clearInterval(nextTimer); stopCountdown();
      st.phase = "q"; st.idx = i; st.endsAt = Date.now() + TIME; st.note = "";
      clearTimeout(qTimer);
      qTimer = setTimeout(reveal, TIME + 1200); // עוד רגע קטן לתשובות שבדרך
      draw(); broadcast();
    }
    function reveal() {
      if (st.phase !== "q") return;
      clearTimeout(qTimer);
      const q = questions[st.idx];
      const ok = p => p.ans[st.idx] && p.ans[st.idx].choice === q.correct;
      Object.values(players).forEach(p => { if (ok(p)) p.score += 500 + Math.round(500 * (1 - p.ans[st.idx].ms / TIME)); });
      const last = st.idx === questions.length - 1;
      let over = last;
      if (mode === "survive") {
        const alive = Object.values(players).filter(p => p.alive);
        const wrong = alive.filter(p => !ok(p));
        if (wrong.length === alive.length && alive.length > 1) st.note = "כולם טעו, אז כולם נשארים!";
        else { wrong.forEach(p => { p.alive = false; p.out = st.idx + 1; }); st.note = wrong.length ? `${wrong.length} יצאו מהמשחק` : "כולם צדקו!"; }
        const left = Object.entries(players).filter(([, p]) => p.alive);
        if (left.length <= 1) over = true;
        if (over) st.winner = left.length === 1 ? left[0][1].name : left.map(([, p]) => p.name).join(", ");
      }
      if (mode === "one") {
        const one = players[st.oneId];
        const crowd = alivePlayers();
        const wrong = crowd.filter(([, p]) => !ok(p));
        // אם האחד וכל הקהל טעו יחד, אף אחד לא יוצא וממשיכים
        const allWrong = !ok(one) && wrong.length === crowd.length;
        if (!allWrong) wrong.forEach(([, p]) => { p.alive = false; p.out = st.idx + 1; });
        const left = alivePlayers().length;
        if (allWrong) { st.note = "האחד וכל הקהל טעו, אז כולם נשארים!"; if (over) st.winner = "crowd"; }
        else if (!ok(one)) { over = true; st.winner = "crowd"; st.note = `${one.name} טעה! הקהל ניצח`; }
        else if (!left) { over = true; st.winner = "one"; st.note = `${one.name} הוציא את כל הקהל!`; }
        else { st.note = wrong.length ? `${one.name} צדק, ו-${wrong.length} מהקהל יצאו. נשארו ${left}` : `${one.name} צדק, וכל הקהל צדק גם`; if (over) st.winner = "one"; }
        // הקופה של האחד: 100 נקודות על כל מי שיצא מהקהל
        one.score = Object.entries(players).filter(([id, p]) => id !== st.oneId && !p.alive).length * 100;
      }
      if (mode === "team") {
        // הרוב קובע: התשובה שהכי הרבה חברי שבט בחרו. בתיקו, זו שנבחרה ראשונה
        teams.forEach((t, ti) => {
          const votes = [0, 0, 0, 0], first = [1e9, 1e9, 1e9, 1e9];
          Object.values(players).forEach(p => { const a = p.ans[st.idx]; if (p.team === ti && a && a.choice >= 0) { votes[a.choice]++; first[a.choice] = Math.min(first[a.choice], a.ms); } });
          const best = Math.max(...votes);
          t.votes = votes;
          t.choice = best ? [0, 1, 2, 3].filter(i => votes[i] === best).sort((a, b) => first[a] - first[b])[0] : -1;
          if (t.choice === q.correct) t.score += 100;
        });
        const okNames = teams.filter(t => t.choice === q.correct).map(t => t.name);
        st.note = okNames.length === teams.length ? "כל השבטים צדקו!" : okNames.length ? `צדקו: ${okNames.map(n => "שבט " + n).join(", ")}` : "אף שבט לא צדק הפעם";
        if (over) { const top = Math.max(...teams.map(t => t.score)); st.winner = teams.filter(t => t.score === top).map(t => t.name).join(" ו"); }
      }
      st.phase = over ? "end" : "reveal";
      if (over && mode === "quiz") { const top = Object.values(players).sort((a, b) => b.score - a.score)[0]; st.winner = top ? top.name : ""; }
      draw(); broadcast();
      if (over) ctx.confetti();
    }

    function updateCount() {
      const el = document.getElementById("acount");
      if (!el) return;
      const need = Object.entries(players).filter(([id, p]) => p.alive || id === st.oneId);
      el.textContent = `${need.filter(([, p]) => p.ans[st.idx]).length} / ${need.length} ענו`;
    }

    const joinUrl = SITE_URL + "#/olama/" + code;
    function draw() {
      const q = questions[st.idx];
      const head = `<div class="olama-bar"><span>🌐 עלמא · ${M.icon} ${M.name}</span><span class="olama-code-sm">קוד: <b>${code}</b></span><button class="btn ghost small-btn" id="quit">סגירת החדר</button></div>`;
      if (st.phase === "lobby") {
        app().innerHTML = `${head}
          <div class="olama-lobby">
            <div class="card center olama-join-card">
              <div class="small muted">נכנסים ל-<b dir="ltr">amosha1231-netizen.github.io/Teire</b> ← היכל עלמא, או סורקים:</div>
              <div id="qr" class="olama-qr"></div>
              <div class="olama-code">${code}</div>
            </div>
            <div class="card">
              <h3>${M.icon} ${M.name}</h3>
              <p class="small">${M.rules}</p>
              <h3>מחוברים: ${Object.keys(players).length}</h3>
              ${mode === "one" ? `<p class="small muted">הקישו על שם כדי לבחור את "האחד". אם לא תבחרו, נגריל.</p>` : ""}
              <div class="olama-names">${Object.entries(players).map(([id, p]) => `<button class="olama-name ${id === st.oneId ? "one" : ""}" data-id="${id}">${id === st.oneId ? "🦁 " : ""}${esc(p.name)}</button>`).join("") || `<span class="muted">מחכים לשחקנים...</span>`}</div>
              <div class="olama-auto">${st.autoAt ? `⏳ המשחק מתחיל בעוד <b id="autocd"></b>` : autoN ? `המשחק יתחיל לבד דקה אחרי שיגיעו ${autoN} שחקנים` : ""}</div>
              <button class="btn gold big-btn" id="go">${st.autoAt ? "להתחיל עכשיו" : "מתחילים!"} (${questions.length} שאלות)</button>
            </div>
          </div>`;
        drawQR(document.getElementById("qr"), joinUrl);
        if (st.autoAt) countdown(st.autoAt);
        app().querySelectorAll(".olama-name").forEach(b => b.onclick = () => { if (mode === "one") { st.oneId = b.dataset.id; draw(); broadcast(); } });
        document.getElementById("go").onclick = start;
      } else if (st.phase === "q") {
        app().innerHTML = `${head}
          ${mode === "one" ? oneStrip() : ""}${mode === "team" ? teamStrip() : ""}
          <div class="olama-qhead"><span>שאלה ${st.idx + 1} מתוך ${questions.length}</span><span class="olama-clock" id="clock">${Math.ceil(TIME / 1000)}</span><span id="acount"></span></div>
          <div class="timer"><span id="tbar"></span></div>
          <div class="card olama-q">
            ${q.verse ? `<div class="verse"><div class="verse-text">${esc(q.verse)}</div></div>` : ""}
            <div class="qtext">${esc(q.question)}</div>
            <div class="olama-answers">${q.answers.map((a, i) => `<div class="olama-ans" style="--c:${COLORS[i]}"><span class="letter">${LETTERS[i]}</span>${esc(a)}</div>`).join("")}</div>
          </div>
          <p class="small muted center">📺 זה המסך של המנחה, כאן רק מציגים. עונים מהטלפונים, עם קוד החדר ${code}.</p>
          <div class="row center-row"><button class="btn ghost" id="skip">לחשוף עכשיו</button></div>`;
        runClock(st.endsAt);
        updateCount();
        document.getElementById("skip").onclick = reveal;
      } else {
        const counts = [0, 0, 0, 0];
        Object.values(players).forEach(p => { const a = p.ans[st.idx]; if (a && a.choice >= 0) counts[a.choice]++; });
        const max = Math.max(1, ...counts);
        const ranked = Object.entries(players).sort((a, b) => (b[1].alive - a[1].alive) || b[1].score - a[1].score);
        const end = st.phase === "end";
        app().innerHTML = `${head}
          ${mode === "one" ? oneStrip() : ""}
          ${end ? endBanner(ranked) : ""}
          <div class="card olama-q">
            <div class="qtext">${esc(q.question)}</div>
            <div class="olama-answers">${q.answers.map((a, i) => `<div class="olama-ans ${i === q.correct ? "right" : "dim"}" style="--c:${COLORS[i]}"><span class="letter">${LETTERS[i]}</span>${esc(a)}<span class="olama-cnt"><i style="width:${counts[i] / max * 100}%"></i>${counts[i]}</span></div>`).join("")}</div>
            ${q.source ? `<div class="small muted center" style="margin-top:8px">מקור: ${esc(q.source)}</div>` : ""}
          </div>
          ${st.note ? `<div class="olama-note">${esc(st.note)}</div>` : ""}
          <div class="card">${mode === "team" ? `<h3>🏳️ השבטים</h3>${teams.map(t => `<div class="olama-rank olama-tribe" style="--c:${t.color}"><b>שבט ${esc(t.name)}</b><span>בחר: ${t.choice >= 0 ? `<b style="color:${COLORS[t.choice]}">${LETTERS[t.choice]}</b>` : "לא ענה"} ${t.choice === q.correct ? "✓" : "✗"} <small class="muted">(${(t.votes || []).map((v, i) => LETTERS[i] + ":" + v).join(" ")})</small></span><b>${t.score}</b></div>`).join("")}`
            : mode === "quiz" ? `<h3>🏆 המובילים</h3>${ranked.slice(0, 5).map(([, p], i) => `<div class="olama-rank"><b>${i + 1}</b><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join("")}`
            : mode === "survive" ? `<h3>🔥 נשארו במשחק: ${ranked.filter(([, p]) => p.alive).length}</h3><div class="olama-names">${ranked.map(([, p]) => `<span class="olama-name ${p.alive ? "" : "out"}">${esc(p.name)}</span>`).join("")}</div>`
            : `<h3>👥 הקהל שנשאר: ${alivePlayers().length}</h3><div class="olama-names">${ranked.filter(([id]) => id !== st.oneId).map(([, p]) => `<span class="olama-name ${p.alive ? "" : "out"}">${esc(p.name)}</span>`).join("")}</div>`}</div>
          <div class="row center-row">${end ? `<button class="btn gold" id="again">משחק חדש</button><a class="btn ghost" href="#/">🗺️ למפה</a>` : `<button class="btn gold big-btn" id="next">לשאלה הבאה ⬅ <span id="nextcd"></span></button>`}</div>`;
        if (end) document.getElementById("again").onclick = () => { location.hash = "#/olama"; };
        else {
          document.getElementById("next").onclick = () => ask(st.idx + 1);
          // עוברים לבד לשאלה הבאה אחרי כמה שניות, כדי שהמשחק לא ייעצר אם המנחה לא לוחץ
          autoNext();
        }
      }
      document.getElementById("quit").onclick = () => { location.hash = "#/olama"; };
    }
    function autoNext() {
      clearInterval(nextTimer);
      const at = Date.now() + NEXT_WAIT;
      const tick = () => {
        const el = document.getElementById("nextcd");
        if (st.phase !== "reveal" || !el) return clearInterval(nextTimer);
        const s = Math.max(0, Math.ceil((at - Date.now()) / 1000));
        el.textContent = `(${s})`;
        if (s <= 0) { clearInterval(nextTimer); ask(st.idx + 1); }
      };
      tick();
      nextTimer = setInterval(tick, 250);
    }
    function teamStrip() {
      return `<div class="olama-tribes">${teams.map(t => `<span style="--c:${t.color}">שבט ${esc(t.name)} <b>${t.score}</b></span>`).join("")}</div>`;
    }
    function oneStrip() {
      const one = players[st.oneId] || { name: "", score: 0 };
      return `<div class="olama-one"><span>🦁 האחד: <b>${esc(one.name)}</b></span><span>💰 קופה: <b>${one.score}</b></span><span>👥 נגד: <b>${alivePlayers().length}</b></span></div>`;
    }
    function endBanner(ranked) {
      let title, sub = "";
      if (mode === "one") {
        title = st.winner === "one" ? `🦁 ${esc(players[st.oneId].name)} ניצח את כל החדר!` : `👥 הקהל ניצח!`;
        const surv = alivePlayers().map(([, p]) => esc(p.name)).join(", ");
        sub = st.winner === "one" ? `עם קופה של ${players[st.oneId].score} נקודות` : surv ? `שרדו: ${surv}` : "";
      } else if (mode === "survive") title = `🔥 ${esc(st.winner)} שרד עד הסוף!`;
      else if (mode === "team") {
        title = `🏆 שבט ${esc(st.winner)} ניצח!`;
        sub = teamStrip();
      }
      else {
        const top = ranked.slice(0, 3);
        title = "🏆 הפודיום";
        sub = `<div class="olama-podium">${[1, 0, 2].map(i => top[i] ? `<div class="pod p${i + 1}"><b>${esc(top[i][1].name)}</b><span>${top[i][1].score}</span><i>${i + 1}</i></div>` : "").join("")}</div>`;
      }
      return `<div class="card center olama-end"><h1>${title}</h1>${sub}</div>`;
    }

    document.body.classList.add("olama-host"); // במסך המנחה מסתירים את התפריט התחתון
    session = { close() { document.body.classList.remove("olama-host"); stopped = true; clearTimeout(autoTimer); clearInterval(nextTimer); stopCountdown(); clearTimeout(pollTimer); clearInterval(beatTimer); clearTimeout(qTimer); stopClock(); ch.close(); } };
    // שולחים את המצב שוב כל שתי שניות, למי שהצטרף מאוחר או פספס הודעה
    beatTimer = setInterval(broadcast, 2000);
    poll();
    draw();
    broadcast();
  }

  let clockTimer = 0;
  function stopClock() { clearInterval(clockTimer); }
  function runClock(endsAt) {
    stopClock();
    const bar = document.getElementById("tbar"), clock = document.getElementById("clock");
    const left = Math.max(0, endsAt - Date.now());
    if (bar) { bar.style.width = (left / TIME * 100) + "%"; requestAnimationFrame(() => { bar.style.transition = `width ${left}ms linear`; bar.style.width = "0%"; }); }
    const tick = () => { const s = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)); if (clock) { clock.textContent = s; clock.classList.toggle("hot", s <= 5); } };
    tick();
    clockTimer = setInterval(tick, 250);
  }

  // ספירה לאחור לפני התחלה אוטומטית (#autocd), אצל המנחה ואצל האורחים
  let cdTimer = 0;
  function stopCountdown() { clearInterval(cdTimer); }
  function countdown(at) {
    stopCountdown();
    const tick = () => { const el = document.getElementById("autocd"); if (!el) return stopCountdown(); const s = Math.max(0, Math.ceil((at - Date.now()) / 1000)); el.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
    tick();
    cdTimer = setInterval(tick, 500);
  }

  // קוד QR לכתובת ההצטרפות (qrcode-generator 1.4.4, רישיון MIT, נטען רק אצל המנחה)
  let qrLib = null;
  function drawQR(el, url) {
    if (!el) return;
    const paint = () => { const q = window.qrcode(0, "M"); q.addData(url); q.make(); el.innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); };
    if (window.qrcode) return paint();
    if (!qrLib) qrLib = new Promise((ok, fail) => { const s = document.createElement("script"); s.src = "js/qrcode.js"; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
    qrLib.then(paint, () => { el.innerHTML = ""; });
  }

  // ---------- האורח (בטלפון) ----------
  function guest(code) {
    const pid = guestId();
    let name = savedName(), joined = false, key = "", qStart = 0, myAns = null, lastSeen = 0, tableOk = !!sb;
    const ch = channel(code, m => { if (m.t === "s" && m.code === code) onState(m); });

    async function toHost(ev) {
      ev = { ...ev, pid, name };
      if (tableOk) {
        const { error } = await sb.from("olama_events").insert({ room: code, pid, name, kind: ev.kind, q: ev.q == null ? null : ev.q, choice: ev.choice == null ? null : ev.choice, ms: ev.ms == null ? null : ev.ms });
        if (!error) return;
        tableOk = false;
      }
      ch.send({ t: "g", ev });
    }

    function askName() {
      app().innerHTML = `
        <div class="place-hero olama-hero"><div class="place-icon">🌐</div><h1>היכל עלמא</h1><p>חדר ${esc(code)}</p></div>
        <div class="card center">
          <h3>איך קוראים לך?</h3>
          <form id="namef" class="olama-join">
            <input id="gname" maxlength="16" placeholder="השם שיופיע על המסך" value="${esc(name)}" autocomplete="off">
            <button class="btn gold">נכנסים!</button>
          </form>
        </div>`;
      document.getElementById("namef").onsubmit = ev => {
        ev.preventDefault();
        const v = document.getElementById("gname").value.trim();
        if (!v) return ctx.toast("כתבו שם");
        name = v.slice(0, 16);
        try { localStorage.setItem("teire.olama.name", name); } catch (e) { /* ignore */ }
        joined = true;
        toHost({ kind: "join" });
        waiting("מתחברים לחדר...");
        // אם המנחה עוד לא ראה אותנו, שולחים שוב
        setTimeout(() => { if (joined && !lastSeen) toHost({ kind: "join" }); }, 5000);
      };
    }

    function waiting(text, extra = "") {
      app().innerHTML = `<div class="card center olama-wait">
        <div class="olama-me">${ctx.avatarSVG(ctx.player.look, 80)}<b>${esc(name)}</b></div>
        <h2>${text}</h2>${extra}
        <p class="small muted">חדר ${esc(code)} · מסתכלים על המסך הגדול 👀</p></div>`;
    }

    function onState(s) {
      lastSeen = Date.now();
      if (!joined) return;
      const k = s.phase + ":" + s.idx + (s.phase === "lobby" ? ":" + s.n + ":" + s.oneId + ":" + !!s.autoLeft : "");
      if (k === key) return;
      key = k;
      const isOne = s.oneId === pid;
      if (s.phase === "lobby") {
        const inList = (s.names || []).some(([id]) => id === pid);
        if (!inList) toHost({ kind: "join" });
        const names = (s.names || []).map(([id, nm]) => `<span class="olama-name ${id === s.oneId ? "one" : ""}">${id === s.oneId ? "🦁 " : ""}${esc(nm)}${id === pid ? " (את/ה)" : ""}</span>`).join("");
        waiting(inList ? "נכנסת! מחכים שהמשחק יתחיל" : "מתחברים לחדר...", `${s.autoLeft ? `<p class="olama-auto">⏳ מתחילים בעוד <b id="autocd"></b></p>` : ""}${names ? `<div class="olama-names">${names}</div>` : ""}<p>${s.n} מחוברים${s.mode === "one" ? (isOne ? `<br><b class="olama-you-one">🦁 נבחרת להיות האחד!</b>` : s.oneName ? `<br>🦁 האחד: <b>${esc(s.oneName)}</b>` : "") : ""}</p>`);
        if (s.autoLeft) countdown(Date.now() + s.autoLeft);
        return;
      }
      stopCountdown();
      const r = (s.res || {})[pid];
      if (s.phase === "q") {
        myAns = null;
        qStart = Date.now();
        if (s.mode !== "quiz" && !isOne && key && s.idx > 0 && lastRes && !lastRes[3]) return waiting("יצאת מהמשחק 😅", `<p>אפשר להמשיך לצפות במסך</p>`);
        app().innerHTML = `
          ${isOne ? `<div class="olama-one"><span>🦁 את/ה האחד! אסור לטעות</span></div>` : ""}${myTeam(s) ? `<div class="olama-mytribe" style="--c:${myTeam(s)[1]}">אתם בשבט ${esc(myTeam(s)[0])} · הרוב בשבט קובע</div>` : ""}
          <div class="olama-qhead"><span>שאלה ${s.idx + 1}/${s.total}</span><span class="olama-clock" id="clock"></span></div>
          <div class="timer"><span id="tbar"></span></div>
          <div class="card olama-q">
            <div class="qtext">${esc(s.q.question)}</div>
            <div class="olama-answers phone">${s.q.answers.map((a, i) => `<button class="olama-ans" data-i="${i}" style="--c:${COLORS[i]}"><span class="letter">${LETTERS[i]}</span>${esc(a)}</button>`).join("")}</div>
            <div class="olama-sent" id="sent" hidden></div>
          </div>`;
        const endsAt = Date.now() + s.left;
        runClock(endsAt);
        app().querySelectorAll(".olama-ans").forEach(b => b.onclick = () => {
          if (myAns !== null || Date.now() > endsAt) return;
          myAns = Number(b.dataset.i);
          if (navigator.vibrate) navigator.vibrate(30);
          app().querySelectorAll(".olama-ans").forEach(x => { x.disabled = true; x.classList.toggle("dim", x !== b); });
          b.classList.add("picked");
          const sent = document.getElementById("sent");
          sent.hidden = false; sent.innerHTML = `✓ בחרת <b style="color:${COLORS[myAns]}">${LETTERS[myAns]}</b>. מחכים לשאר השחקנים...`;
          toHost({ kind: "ans", q: s.idx, choice: myAns, ms: Date.now() - qStart });
        });
        return;
      }
      stopClock();
      lastRes = r;
      if (!r) return waiting("המשחק כבר התחיל", `<p>תוכלו להצטרף לסיבוב הבא</p>`);
      const ok = r[0] === 1;
      if (s.phase === "reveal") {
        let line = ok ? "✓ צדקת!" : "✗ לא נכון";
        const T = myTeam(s);
        if (T) line = `שבט ${esc(T[0])} בחר ${T[3] >= 0 ? LETTERS[T[3]] : "כלום"}: ${T[3] === s.correct ? "✓ צדקתם!" : "✗ טעיתם"}<br><span class="small">אתה בחרת: ${ok ? "נכון" : "לא נכון"} · לשבט ${T[2]} נקודות</span>`;
        else if (s.mode === "quiz") line += `<br><span class="small">מקום ${r[2]} · ${r[1]} נקודות</span>`;
        else if (isOne) line += ok ? `<br><span class="small">💰 קופה: ${r[1]}</span>` : "";
        else if (!r[3]) line = ok ? "יצאת מהמשחק" : "✗ טעית, יצאת מהמשחק";
        else line += `<br><span class="small">עדיין במשחק! 💪</span>`;
        if (navigator.vibrate) navigator.vibrate(ok ? [40] : [120, 60, 120]);
        app().innerHTML = `<div class="card center olama-res ${ok ? "good" : "bad"}"><h1>${line}</h1>
          <p>התשובה: <b style="color:${COLORS[s.correct]}">${LETTERS[s.correct]}</b></p>${s.note ? `<p>${esc(s.note)}</p>` : ""}</div>`;
        return;
      }
      // סוף המשחק
      let title;
      if (s.mode === "one") title = (isOne ? s.winner === "one" : s.winner === "crowd" && r[3]) ? "🏆 ניצחת!" : s.winner === "one" ? `🦁 ${esc(s.oneName)} ניצח` : "👥 הקהל ניצח!";
      else if (s.mode === "team") title = myTeam(s) && s.winner.split(" ו").includes(myTeam(s)[0]) ? `🏆 שבט ${esc(myTeam(s)[0])} ניצח!` : `שבט ${esc(s.winner)} ניצח`;
      else if (s.mode === "survive") title = r[3] ? "🏆 שרדת עד הסוף!" : `🔥 ${esc(s.winner)} שרד עד הסוף`;
      else title = r[2] === 1 ? "🏆 מקום ראשון!" : `מקום ${r[2]}`;
      if (title.startsWith("🏆")) ctx.confetti();
      app().innerHTML = `<div class="card center olama-res"><h1>${title}</h1>${s.mode === "quiz" ? `<p>${r[1]} נקודות</p>` : ""}
        <p class="small muted">תודה שהשתתפת! המשחק המלא מחכה במפה</p>
        <div class="row center-row"><a class="btn" href="#/">למסע בתורה</a></div></div>`;
    }
    let lastRes = null;
    const myTeam = st => st.teams && st.tm && st.tm[pid] != null ? st.teams[st.tm[pid]] : null;

    session = { close() { joined = false; stopClock(); ch.close(); } };
    askName();
  }

  function view(arg, c) {
    ctx = c;
    stop();
    if (arg && /^\d{4}$/.test(arg)) return guest(arg);
    viewHall();
  }
  function stop() { if (session) { session.close(); session = null; } stopClock(); stopCountdown(); }

  window.TeireOlama = { view, stop };
})();
