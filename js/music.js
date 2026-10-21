// מוזיקת רקע שנוצרת בדפדפן (בלי קבצי שמע): פסנתר רגוע ורוחני, ובחדר הוויכוח צליל דרמטי.
// הדפדפן מרשה להשמיע רק אחרי לחיצה, אז המוזיקה מתחילה בלחיצה הראשונה. כפתור 🎵 בסרגל העליון משתיק.
(function () {
  const KEY = "teire.music";
  let ctx = null, master = null, verb = null, timer = 0, mood = "calm", playing = false, step = 0;
  const on = () => { try { return localStorage.getItem(KEY) !== "off"; } catch (e) { return true; } };

  // ניגון פסנתר רגוע: אקורדים בארפג'יו איטי בסול מז'ור, עם מנגינה עדינה מעל והד של אולם
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  // סול, מי מינור, דו, רה (ובסוף סבב: לה מינור וסוס) - כל אקורד: בס ותווי הארפג'יו
  const CHORDS = [
    [43, [55, 59, 62, 67]], [40, [55, 59, 64, 67]], [36, [52, 55, 60, 64]], [38, [54, 57, 62, 66]],
    [43, [55, 59, 62, 67]], [40, [55, 59, 64, 67]], [45, [57, 60, 64, 69]], [38, [54, 57, 62, 66]],
  ];
  // מנגינה: תו אחד לכל חצי אקורד (0 = שקט)
  const MELODY = [71, 0, 74, 72, 71, 0, 67, 0, 72, 0, 71, 69, 69, 0, 0, 0, 71, 0, 74, 76, 74, 0, 71, 0, 72, 71, 69, 0, 67, 0, 0, 0];
  const BEAT = 0.62; // שניות לתו בארפג'יו

  function piano(f, t, len, vol) {
    // צליל פסנתר: כמה הרמוניות שדועכות מהר יותר ככל שהן גבוהות יותר
    [[1, 1, "triangle"], [2, 0.35, "sine"], [3, 0.12, "sine"]].forEach(([h, a, type]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f * h;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * a, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len / h);
      o.connect(g); g.connect(master); g.connect(verb);
      o.start(t); o.stop(t + len / h + 0.05);
    });
  }
  function note(f, t, len, type, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + len + 0.05);
  }
  function makeVerb() {
    // הד של אולם גדול, נבנה מרעש שדועך
    const c = ctx.createConvolver(), len = ctx.sampleRate * 3.5, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    c.buffer = buf;
    const wet = ctx.createGain(); wet.gain.value = 0.35;
    c.connect(wet); wet.connect(ctx.destination);
    return c;
  }

  function tick() {
    const t = ctx.currentTime + 0.05;
    if (mood === "dark") {
      // צליל נמוך ומתמשך עם צלצול מדי פעם
      if (step % 8 === 0) note(midi(38), t, 4, "sawtooth", 0.035);
      if (step % 8 === 4) note(midi([51, 57, 58][step / 8 % 3 | 0]), t, 2.5, "sine", 0.05);
      step++;
      timer = setTimeout(tick, 500);
    } else {
      const [bass, arp] = CHORDS[(step >> 3) % CHORDS.length], i = step % 8;
      if (i === 0) piano(midi(bass), t, 5, 0.09);
      piano(midi(arp[[0, 1, 2, 3, 2, 1, 2, 1][i]]), t, 2.6, 0.05);
      if (i % 4 === 0) { const m = MELODY[(step >> 2) % MELODY.length]; if (m) piano(midi(m), t + 0.02, 3, 0.07); }
      step++;
      timer = setTimeout(tick, BEAT * 1000);
    }
  }

  function start() {
    if (playing || !on() || document.body.classList.contains("shabbat")) return; // בשבת ובחג אין מוזיקה
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (!master) { master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination); verb = makeVerb(); }
      ctx.resume();
    } catch (e) { return; }
    playing = true; step = 0; tick(); render();
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
  function setMood(m) { if (m === mood) return; mood = m; step = 0; }

  document.addEventListener("pointerdown", e => { if (!e.target.closest("#musicBtn")) start(); }, { once: false });
  document.addEventListener("keydown", () => start());
  document.addEventListener("DOMContentLoaded", render);
  window.Music = { start, stop, toggle, mood: setMood, render };
})();
