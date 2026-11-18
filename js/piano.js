// היכל הנגינה: משחק מקלדת. המקלדת מראה רק את התווים של הניגון (נמוך משמאל, גבוה מימין, כמו בפסנתר).
// מצב שאלות: עומדים על קליד (📍), מקבלים שאלה שהתשובה שלה מספר, וזזים כמספר התשובה: ➡️ למעלה (ימינה), ⬅️ למטה (שמאלה).
// מצב נגינה: הקליד הבא מאיר ולוחצים עליו. בסוף שני המצבים הניגון מתנגן במלואו עם ליווי, והקלידים מאירים.
// הצלילים: הקלטות פסנתר אמיתיות מ-audio/acoustic_grand_piano (FluidR3 GM, רישיון CC BY 3.0), כל 4 חצאי טונים.
(function () {
  const S = window.TEIRE_SONGS;
  const NAMES = ["דו", "דו♯", "רה", "רה♯", "מי", "פה", "פה♯", "סול", "סול♯", "לה", "לה♯", "סי"];
  const FLAT = { 1: "רה♭", 3: "מי♭", 6: "סול♭", 8: "לה♭", 10: "סי♭" };
  const COLORS = ["#ef4444", "#ef4444", "#f97316", "#f97316", "#eab308", "#22c55e", "#22c55e", "#06b6d4", "#06b6d4", "#3b82f6", "#3b82f6", "#a855f7"];
  const isBlack = m => [1, 3, 6, 8, 10].includes(m % 12);
  const noteName = (m, flats) => (flats && FLAT[m % 12]) || NAMES[m % 12];

  // ---------- צליל ----------
  let ctx = null, out = null;
  const bufs = {};
  function audio() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 5; comp.connect(ctx.destination);
        out = ctx.createGain(); out.gain.value = 0.9; out.connect(comp);
      } catch (e) { return null; }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  const sampleFor = m => Math.max(36, Math.min(84, Math.round((m - 36) / 4) * 4 + 36));
  function load(notes) {
    if (!audio()) return Promise.resolve();
    const need = [...new Set(notes.map(sampleFor))];
    return Promise.all(need.map(k => bufs[k] || (bufs[k] = fetch(`audio/acoustic_grand_piano/${k}.mp3`)
      .then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => ctx.decodeAudioData(b, ok, no)))
      .catch(() => null))));
  }
  // מנגן תו בזמן t (שניות של ה-AudioContext). אם ההקלטה לא נטענה, צליל פשוט במקומה.
  function note(m, t, vol = 0.7, len = 1.2, dest = out) {
    if (!audio()) return;
    t = Math.max(t || 0, ctx.currentTime);
    const k = sampleFor(m), g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + len);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.5);
    g.connect(dest);
    Promise.resolve(bufs[k]).then(buf => {
      let s;
      if (buf) { s = ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = Math.pow(2, (m - k) / 12); }
      else { s = ctx.createOscillator(); s.type = "triangle"; s.frequency.value = 440 * Math.pow(2, (m - 69) / 12); }
      s.connect(g); s.start(Math.max(t, ctx.currentTime)); s.stop(t + len + 0.6);
    });
  }
  // זמזום קטן לטעות
  function buzz() {
    if (!audio()) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = "square"; o.frequency.setValueAtTime(150, t); o.frequency.linearRampToValueAtTime(110, t + 0.18);
    g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.25);
  }

  // מנגן את כל הניגון עם ליווי (בס ואקורד מפורק). onNote(i) נקרא בכל תו כדי להאיר את הקליד.
  function playSong(song, onNote, onDone) {
    const timers = [];
    let bus = null, off = false;
    const all = song.notes.map(n => n[0]).concat(...song.chords.map(c => [c[0], ...c[1]]));
    load(all).then(() => {
      if (off) return;
      if (!audio()) return onDone && onDone();
      bus = ctx.createGain(); bus.connect(out);
      const beat = 60 / song.bpm, t0 = ctx.currentTime + 0.25;
      let t = 0;
      song.notes.forEach(([m, d], i) => {
        note(m, t0 + t * beat, 0.75, d * beat * 0.95, bus);
        timers.push(setTimeout(() => onNote && onNote(i), (0.25 + t * beat) * 1000));
        t += d;
      });
      const bars = Math.ceil(t / 4);
      for (let b = 0; b < bars; b++) {
        const [bass, ch] = song.chords[b % song.chords.length], bt = t0 + b * 4 * beat;
        note(bass, bt, 0.45, 4 * beat * 0.95, bus);
        [0, 1, 2, 1, 0, 1, 2, 1].forEach((k, j) => note(ch[k], bt + j * beat / 2, 0.2, beat * 0.5, bus));
      }
      timers.push(setTimeout(() => onDone && onDone(), (0.25 + bars * 4 * beat + 0.6) * 1000));
    });
    return { stop() { off = true; timers.forEach(clearTimeout); if (bus) { bus.gain.setTargetAtTime(0, ctx.currentTime, 0.05); const b = bus; setTimeout(() => b.disconnect(), 300); } } };
  }

  // ---------- המשחק ----------
  // el = המקום בעמוד, opts = { song, mode: "q" | "p", onEnd(score, total) }
  function start(el, opts) {
    const song = opts.song, mode = opts.mode, notes = song.notes.map(n => n[0]);
    const keys = [...new Set(notes)].sort((a, b) => a - b);
    const idx = m => keys.indexOf(m);
    let i = mode === "q" ? 1 : 0, score = 0, tries = 0, stopped = false, busy = false, player = null, used = new Set();
    const total = notes.length - (mode === "q" ? 1 : 0);

    el.innerHTML = `
      <div class="piano-game">
        <div class="arena-top"><span class="pill dark">${song.icon} ${song.name}</span><span class="pill dark" id="pscore">⭐ 0</span></div>
        <div class="piano-progress"><i id="pbar"></i></div>
        <div class="piano-q" id="pq"></div>
        <div class="piano-keys" dir="ltr" id="pkeys" style="--n:${keys.length}">
          ${keys.map((m, k) => `<button class="pkey ${isBlack(m) ? "black" : ""}" data-k="${k}" style="--c:${COLORS[m % 12]}">
            <span class="pk-mark"></span><span class="pk-count"></span><b>${noteName(m, song.flats)}</b></button>`).join("")}
        </div>
        <div class="piano-legend" dir="ltr"><span>⬅️ נמוך</span>${mode === "q" ? `<span dir="rtl">ספרו קלידים מה-📍</span>` : ""}<span>גבוה ➡️</span></div>
      </div>`;
    window.scrollTo(0, 0);
    const btns = [...el.querySelectorAll(".pkey")];
    const q = el.querySelector("#pq");
    const flash = (k, cls = "hit") => { const b = btns[k]; if (!b) return; b.classList.remove(cls); void b.offsetWidth; b.classList.add(cls); setTimeout(() => b.classList.remove(cls), 450); };
    const clearMarks = () => btns.forEach(b => { b.classList.remove("pk-here", "pk-target"); b.querySelector(".pk-count").textContent = ""; });
    load(notes);

    function pickQuestion(n) {
      const list = S.NUMBER_Q[n] || [];
      let fresh = list.filter(x => !used.has(x.q));
      if (!fresh.length) { list.forEach(x => used.delete(x.q)); fresh = list; }
      const pick = fresh[Math.floor(Math.random() * fresh.length)];
      if (pick) used.add(pick.q);
      return pick;
    }

    function show() {
      clearMarks(); tries = 0;
      el.querySelector("#pbar").style.width = `${Math.round(((mode === "q" ? i - 1 : i) / total) * 100)}%`;
      if (i >= notes.length) return finish();
      const target = idx(notes[i]);
      if (mode === "p") {
        btns[target].classList.add("pk-target");
        q.innerHTML = `<div class="pq-main">לחצו על <b>${noteName(notes[i], song.flats)}</b></div><div class="small muted">תו ${i + 1} מתוך ${notes.length}</div>`;
        return;
      }
      const from = idx(notes[i - 1]), d = target - from;
      btns[from].classList.add("pk-here");
      if (d === 0) {
        q.innerHTML = `<div class="pq-main">🔁 אותו תו שוב!</div><div class="small muted">לחצו שוב על הקליד של ה-📍</div>`;
        q.dataset.note = "";
        return;
      }
      const it = pickQuestion(Math.abs(d));
      q.dataset.note = it ? `${Math.abs(d)}: ${it.note} (${it.source})` : "";
      q.innerHTML = `<div class="pq-main">${it ? it.q : `זוזו ${Math.abs(d)} קלידים`}</div>
        <div class="pq-dir ${d > 0 ? "up" : "down"}">${d > 0 ? "➡️ עולים: זוזו ימינה כמספר התשובה" : "⬅️ יורדים: זוזו שמאלה כמספר התשובה"}</div>`;
    }

    // רמז אחרי שתי טעויות: מספרים על הקלידים מה-📍 עד היעד
    function hint() {
      const from = idx(notes[i - 1]), to = idx(notes[i]), step = to > from ? 1 : -1;
      for (let k = from + step, n = 1; ; k += step, n++) { btns[k].querySelector(".pk-count").textContent = n; if (k === to) break; }
      btns[to].classList.add("pk-target");
      if (q.dataset.note) q.insertAdjacentHTML("beforeend", `<div class="small pq-hint">💡 התשובה ${q.dataset.note}</div>`);
    }

    function press(k) {
      if (stopped || busy || i >= notes.length) return;
      note(keys[k], 0, 0.75, 0.9);
      if (keys[k] === notes[i]) {
        flash(k);
        if (tries === 0) { score++; el.querySelector("#pscore").textContent = `⭐ ${score}`; }
        if (mode === "q" && q.dataset.note && tries === 0) q.insertAdjacentHTML("beforeend", `<div class="small pq-ok">✓ נכון! ${q.dataset.note}</div>`);
        i++;
        busy = true;
        setTimeout(() => { busy = false; if (!stopped) show(); }, mode === "q" ? 900 : 180);
      } else {
        tries++; buzz(); flash(k, "miss");
        if (mode === "q" && tries === 2) hint();
        if (mode === "p" && tries === 1) q.insertAdjacentHTML("beforeend", `<div class="small pq-hint">הקליד המואר הוא ${noteName(notes[i], song.flats)}</div>`);
      }
    }
    btns.forEach((b, k) => b.addEventListener("pointerdown", e => { e.preventDefault(); press(k); }));
    // במחשב: המקשים A S D F G H J K L בשורה, משמאל לימין
    const KEYS = "asdfghjkl";
    const onKey = e => { const k = KEYS.indexOf((e.key || "").toLowerCase()); if (k >= 0 && k < keys.length) press(k); };
    document.addEventListener("keydown", onKey);

    function finish() {
      clearMarks();
      q.innerHTML = `<div class="pq-main">🎶 ככה נשמע הניגון במלואו</div><div class="small muted">הקשיבו ועקבו אחרי הקלידים</div>`;
      player = playSong(song, n => { if (!stopped) flash(idx(notes[n]), "play"); }, () => { if (!stopped) opts.onEnd(score, total); });
    }

    if (mode === "q") {
      // הניגון מתחיל: מנגנים את התו הראשון ומציבים שם את ה-📍
      q.innerHTML = `<div class="pq-main">הניגון מתחיל ב<b>${noteName(notes[0], song.flats)}</b></div>`;
      busy = true;
      load(notes).then(() => { if (stopped) return; note(notes[0], 0, 0.75, 1); flash(idx(notes[0])); setTimeout(() => { busy = false; if (!stopped) show(); }, 1100); });
    } else show();

    return { stop() { stopped = true; document.removeEventListener("keydown", onKey); if (player) player.stop(); } };
  }

  // השמעה של הניגון בלי משחק (כפתור "שמעו את הניגון")
  function preview(song, onNote, onDone) { return playSong(song, onNote, onDone); }

  window.TeirePiano = { SONGS: S.SONGS, start, preview, noteName };
})();
