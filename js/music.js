// מוזיקת רקע מהקלטות של כלים אמיתיים (audio/<כלי>/<תו>.mp3, מתוך FluidR3_GM, רישיון CC BY 3.0).
// לכל מקום מנגינה משלו: פסנתר רגוע במפה, ניגון לימוד בבית המדרש, שמחה בירושלים, ניגון חסידי בצפת ובמירון,
// קצב מהיר באתגרים, וצלילים דרמטיים בהיכל הפלפולים. הכלים נטענים רק כשצריך אותם.
// הדפדפן מרשה להשמיע רק אחרי לחיצה, אז המוזיקה מתחילה בלחיצה הראשונה. כפתור 🎵 בסרגל העליון משתיק.
(function () {
  const KEY = "teire.music";
  let ctx = null, master = null, verb = null, timer = 0, mood = "calm", playing = false, step = 0;
  const on = () => { try { return localStorage.getItem(KEY) !== "off"; } catch (e) { return true; } };

  // אילו תווים הוקלטו לכל כלי (כל 4 חצאי טונים; השאר מתקבלים בשינוי מהירות קטן)
  const RANGES = {
    acoustic_grand_piano: [36, 84], violin: [55, 87], cello: [36, 64], clarinet: [50, 82],
    acoustic_guitar_nylon: [40, 72], pizzicato_strings: [43, 79], marimba: [55, 87],
  };
  const buffers = {}, loading = {};
  function load(inst) {
    if (loading[inst]) return loading[inst];
    const [lo, hi] = RANGES[inst], notes = [];
    for (let m = lo; m <= hi; m += 4) notes.push(m);
    buffers[inst] = {};
    return loading[inst] = Promise.all(notes.map(m =>
      fetch(`audio/${inst}/${m}.mp3`).then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b))
        .then(buf => { buffers[inst][m] = buf; }).catch(() => { /* תו חסר: מנגנים מהקרוב */ })));
  }

  // מנגן תו: בוחר את ההקלטה הקרובה ומשנה את הגובה שלה
  function play(inst, note, t, vol, len) {
    const set = buffers[inst];
    if (!set || !note) return;
    let best = null;
    for (const k in set) if (best === null || Math.abs(k - note) < Math.abs(best - note)) best = +k;
    if (best === null) return;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = set[best];
    s.playbackRate.value = Math.pow(2, (note - best) / 12);
    g.gain.setValueAtTime(vol, t);
    if (len) { g.gain.setValueAtTime(vol, t + len); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.35); }
    s.connect(g); g.connect(master); g.connect(verb);
    s.start(t); s.stop(t + (len ? len + 0.4 : 4));
  }

  // אורך תו במנגינה: עד התו הבא (0 = ממשיכים להחזיק)
  const held = (mel, i, beat) => { let n = 1; while (n < 8 && mel[(i + n) % mel.length] === 0) n++; return n * beat; };

  // השירים. כל שלב הוא שמינית; 8 שלבים = תיבה. bars: [בס, תווי אקורד]
  const SONGS = {
    // מפה ומקומות רגילים: פסנתר רגוע בסול מז'ור
    calm: {
      beat: 0.62, inst: ["acoustic_grand_piano"],
      bars: [[43, [55, 59, 62, 67]], [40, [55, 59, 64, 67]], [36, [52, 55, 60, 64]], [38, [54, 57, 62, 66]],
             [43, [55, 59, 62, 67]], [40, [55, 59, 64, 67]], [45, [57, 60, 64, 69]], [38, [54, 57, 62, 66]]],
      mel: [71, 0, 0, 0, 74, 0, 72, 0, 71, 0, 0, 0, 67, 0, 0, 0, 72, 0, 0, 0, 71, 0, 69, 0, 69, 0, 0, 0, 0, 0, 0, 0,
            71, 0, 0, 0, 74, 0, 76, 0, 74, 0, 0, 0, 71, 0, 0, 0, 72, 0, 71, 0, 69, 0, 0, 0, 67, 0, 0, 0, 0, 0, 0, 0],
      tick(i, t, bar) {
        const [bass, ch] = bar, k = i % 8;
        if (k === 0) play("acoustic_grand_piano", bass, t, 0.5);
        play("acoustic_grand_piano", ch[[0, 1, 2, 3, 2, 1, 2, 1][k]], t, 0.22);
        play("acoustic_grand_piano", this.mel[i % this.mel.length], t + 0.015, 0.4);
      },
    },
    // בית המדרש, הכוללים והספרייה: ניגון לימוד בלה מינור, פסנתר וצ'לו
    study: {
      beat: 0.55, inst: ["acoustic_grand_piano", "cello"],
      bars: [[45, [57, 60, 64]], [38, [57, 62, 65]], [43, [55, 59, 62]], [36, [55, 60, 64]],
             [41, [57, 60, 65]], [38, [57, 62, 65]], [40, [56, 59, 64]], [45, [57, 60, 64]]],
      mel: [76, 0, 0, 0, 74, 0, 72, 0, 74, 0, 0, 0, 72, 0, 71, 0, 71, 0, 72, 0, 74, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0,
            72, 0, 0, 0, 69, 0, 0, 0, 69, 0, 0, 0, 65, 0, 0, 0, 68, 0, 0, 0, 71, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0],
      tick(i, t, bar) {
        const [bass, ch] = bar, k = i % 8;
        if (k === 0) play("cello", bass + 12, t, 0.3, this.beat * 7.5);
        if (k % 2 === 0) play("acoustic_grand_piano", ch[[0, 1, 2, 1][k / 2]], t, 0.18);
        play("acoustic_grand_piano", this.mel[i % this.mel.length], t + 0.015, 0.38);
      },
    },
    // ירושלים: שמחה בסולם פריגיש (כמו בשירי חתונה), קלרינט וגיטרה
    jerusalem: {
      beat: 0.27, inst: ["clarinet", "acoustic_guitar_nylon"],
      bars: [[50, [62, 66, 69]], [43, [62, 67, 70]], [50, [62, 66, 69]], [48, [60, 63, 67]],
             [50, [62, 66, 69]], [43, [62, 67, 70]], [48, [60, 63, 67]], [50, [62, 66, 69]]],
      mel: [69, 0, 69, 70, 69, 67, 66, 0, 67, 0, 67, 69, 67, 66, 63, 0, 66, 0, 66, 67, 66, 63, 62, 0, 63, 66, 67, 69, 70, 0, 69, 0,
            74, 0, 72, 70, 69, 0, 70, 72, 70, 0, 69, 67, 67, 0, 0, 0, 72, 70, 69, 67, 66, 0, 63, 0, 62, 0, 0, 0, 0, 0, 0, 0],
      tick(i, t, bar) {
        const [bass, ch] = bar, k = i % 8;
        if (k === 0 || k === 4) play("acoustic_guitar_nylon", k ? bass + 7 : bass, t, 0.45);
        if (k === 2 || k === 6) ch.forEach((n, j) => play("acoustic_guitar_nylon", n, t + j * 0.018, 0.22));
        const m = this.mel[i % this.mel.length];
        if (m) play("clarinet", m, t, 0.32, held(this.mel, i % this.mel.length, this.beat) * 0.95);
      },
    },
    // צפת ומירון: ניגון חסידי איטי בסולם אהבה רבה, כינור על צליל צ'לו מתמשך
    mystic: {
      beat: 0.45, inst: ["violin", "cello", "acoustic_guitar_nylon"],
      bars: [[40, [64, 68, 71]], [38, [62, 65, 69]], [45, [57, 60, 64]], [40, [64, 68, 71]],
             [40, [64, 68, 71]], [45, [57, 60, 64]], [38, [62, 65, 69]], [40, [64, 68, 71]]],
      mel: [76, 0, 0, 0, 74, 72, 71, 0, 72, 0, 71, 69, 68, 0, 0, 0, 69, 71, 72, 0, 71, 0, 69, 68, 69, 0, 68, 0, 65, 0, 64, 0,
            64, 65, 68, 69, 71, 0, 0, 0, 72, 71, 72, 74, 76, 0, 0, 0, 74, 72, 71, 69, 68, 0, 69, 68, 64, 0, 0, 0, 0, 0, 0, 0],
      tick(i, t, bar) {
        const [bass, ch] = bar, k = i % 8;
        if (k === 0) play("cello", bass, t, 0.32, this.beat * 7.8);
        if (k % 2 === 1) play("acoustic_guitar_nylon", ch[[0, 1, 2, 1][(k - 1) / 2]], t, 0.12);
        const m = this.mel[i % this.mel.length];
        if (m) play("violin", m, t, 0.3, held(this.mel, i % this.mel.length, this.beat) * 0.97);
      },
    },
    // אתגרים ודו-קרבות: קצבי ושמח, מרימבה ופיציקטו
    upbeat: {
      beat: 0.19, inst: ["marimba", "pizzicato_strings"],
      bars: [[48, [72, 76, 79, 84]], [45, [72, 76, 81, 84]], [41, [72, 77, 81, 84]], [43, [74, 79, 83, 86]]],
      tick(i, t, bar) {
        const [bass, ch] = bar, k = i % 8;
        if (k % 2 === 0) play("pizzicato_strings", k % 4 ? bass + 7 : bass, t, 0.5);
        play("marimba", ch[[0, 1, 2, 1, 3, 2, 1, 2][k]], t, k % 2 ? 0.2 : 0.3);
      },
    },
    // היכל הפלפולים: צ'לו נמוך ותווי פסנתר בודדים
    dark: {
      beat: 0.5, inst: ["cello", "acoustic_grand_piano"],
      bars: [[38, [51]], [38, [57]], [38, [58]], [37, [51]]],
      tick(i, t, bar) {
        const k = i % 8;
        if (k === 0) play("cello", bar[0], t, 0.35, this.beat * 7.8);
        if (k === 4) play("acoustic_grand_piano", bar[1][0], t, 0.25);
        if (k === 6 && (i >> 3) % 2) play("acoustic_grand_piano", bar[1][0] + 12, t, 0.12);
      },
    },
  };

  function tick() {
    const song = SONGS[mood] || SONGS.calm;
    song.tick(step, ctx.currentTime + 0.05, song.bars[(step >> 3) % song.bars.length]);
    step++;
    timer = setTimeout(tick, song.beat * 1000);
  }
  function begin() {
    clearTimeout(timer); step = 0;
    const song = SONGS[mood] || SONGS.calm, want = mood;
    // מחכים שהכלים של השיר ייטענו, ואז מתחילים
    Promise.all(song.inst.map(load)).then(() => { if (playing && mood === want) { clearTimeout(timer); step = 0; tick(); } });
  }

  function makeVerb(out) {
    // הד של אולם, נבנה מרעש שדועך
    const c = ctx.createConvolver(), len = ctx.sampleRate * 2.8, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    c.buffer = buf;
    const wet = ctx.createGain(); wet.gain.value = 0.18;
    c.connect(wet); wet.connect(out);
    return c;
  }

  function start() {
    if (playing || !on() || document.body.classList.contains("shabbat")) return; // בשבת ובחג אין מוזיקה
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (!master) {
        // מגביל עוצמה בסוף השרשרת, כדי שאקורדים מלאים לא יישמעו צורמים
        const limit = ctx.createDynamicsCompressor(); limit.threshold.value = -12; limit.ratio.value = 6; limit.connect(ctx.destination);
        master = ctx.createGain(); master.gain.value = ducked ? 0.12 : 0.6; master.connect(limit); verb = makeVerb(limit);
      }
      ctx.resume();
    } catch (e) { return; }
    playing = true; begin(); render();
  }
  function stop() { clearTimeout(timer); playing = false; if (ctx) ctx.suspend(); render(); }
  function toggle() {
    const next = !on();
    try { localStorage.setItem(KEY, next ? "on" : "off"); } catch (e) { /* ignore */ }
    if (next) start(); else stop();
  }
  function render() {
    const b = document.getElementById("musicBtn");
    if (b) { b.textContent = on() ? "🎵" : "🔇"; b.setAttribute("aria-label", on() ? "השתקת המוזיקה" : "הפעלת המוזיקה"); }
  }
  // במרוץ מנמיכים את המוזיקה כדי שישמעו את המנוע
  let ducked = false;
  function duck(d) { ducked = d; if (master && ctx) master.gain.setTargetAtTime(d ? 0.12 : 0.6, ctx.currentTime, 0.2); }
  function setMood(m) { if (m === mood) return; mood = m; if (playing) begin(); }

  document.addEventListener("pointerdown", e => { if (!e.target.closest("#musicBtn")) start(); });
  document.addEventListener("keydown", () => start());
  document.addEventListener("DOMContentLoaded", render);
  window.Music = { start, stop, toggle, mood: setMood, render, duck };
})();
