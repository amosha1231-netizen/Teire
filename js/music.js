// מוזיקת רקע שנוצרת בדפדפן (בלי קבצי שמע): ניגון שקט בסולם "אהבה רבה", ובחדר הוויכוח צליל דרמטי.
// הדפדפן מרשה להשמיע רק אחרי לחיצה, אז המוזיקה מתחילה בלחיצה הראשונה. כפתור 🎵 בסרגל העליון משתיק.
(function () {
  const KEY = "teire.music";
  let ctx = null, master = null, timer = 0, mood = "calm", playing = false, step = 0;
  const on = () => { try { return localStorage.getItem(KEY) !== "off"; } catch (e) { return true; } };

  // סולם אהבה רבה מ-רה: רה, מי במול, פה דיאז, סול, לה, סי במול, דו
  const SCALE = [0, 1, 4, 5, 7, 8, 10];
  const freq = (deg, oct) => 146.83 * Math.pow(2, (SCALE[((deg % 7) + 7) % 7] + 12 * (oct + Math.floor(deg / 7))) / 12);
  const TUNE = [0, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0, 2, 4, 6, 7, 6, 4, 2, 3, 2, 1, 0, -1, 0, 1, 0];

  function note(f, t, len, type, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + len + 0.05);
  }

  function tick() {
    const t = ctx.currentTime + 0.05;
    if (mood === "dark") {
      // צליל נמוך ומתמשך עם צלצול מדי פעם
      if (step % 8 === 0) note(freq(0, -1), t, 4, "sawtooth", 0.035);
      if (step % 8 === 4) note(freq([1, 4, 5][step / 8 % 3 | 0], 0), t, 2.5, "sine", 0.05);
      step++;
      timer = setTimeout(tick, 500);
    } else {
      const deg = TUNE[step % TUNE.length];
      note(freq(deg, 1), t, 0.6, "triangle", 0.06);
      if (step % 4 === 0) note(freq(0, -1), t, 2.2, "sine", 0.05);
      if (step % 8 === 4) note(freq(4, -1), t, 2.2, "sine", 0.04);
      step++;
      timer = setTimeout(tick, 380);
    }
  }

  function start() {
    if (playing || !on() || document.body.classList.contains("shabbat")) return; // בשבת ובחג אין מוזיקה
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (!master) { master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination); }
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
