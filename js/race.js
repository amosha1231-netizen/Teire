// מרוץ המקורות: כביש תלת-ממדי מצויר על canvas, מכונית מאחור, מתחרים, פניות חדות, טורבו וקולות מנוע.
// המשחק עצמו: שער עם שני שלטים מתקרב, ובכל שלט מקור אחר. צריך להיות בנתיב של המקור הנכון כשמגיעים לשער.
// app.js בונה את הדף ומעביר לכאן את המכונית, החפיסה ופונקציות לעדכון המסך.
(function () {
  // ---------- ציור מכונית מאחור ----------
  // cx = מרכז, by = תחתית הגלגלים, w = רוחב. o: lean (נטייה בפנייה), brake, nitro, smoke, t (זמן לאנימציה)
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }
  function rr(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function drawCar(g, cx, by, w, look, o = {}) {
    const u = w / 2, t = o.t || 0, jeep = look.shape === "jeep";
    g.save();
    g.translate(cx, by);
    if (o.lean) g.rotate(o.lean * 0.05);
    if (o.bounce) g.translate(0, Math.sin(t * 40) * w * 0.004);
    // צל
    g.fillStyle = "rgba(0,0,0,.38)";
    g.beginPath(); g.ellipse(0, -w * 0.01, u * 1.1, w * 0.06, 0, 0, Math.PI * 2); g.fill();
    // עשן צמיגים בפנייה חדה או בהתרסקות
    if (o.smoke) {
      for (let k = 0; k < 6; k++) {
        const side = k % 2 ? 1 : -1, ph = (t * 3 + k * 0.37) % 1;
        g.fillStyle = `rgba(230,230,230,${0.35 * (1 - ph) * o.smoke})`;
        g.beginPath(); g.arc(side * u * (0.85 + ph * 0.5), -w * (0.05 + ph * 0.25), w * (0.08 + ph * 0.22), 0, Math.PI * 2); g.fill();
      }
    }
    // גלגלים
    g.fillStyle = "#111";
    rr(g, -u * 1.0, -w * 0.3, u * 0.32, w * 0.3, w * 0.04); g.fill();
    rr(g, u * 0.68, -w * 0.3, u * 0.32, w * 0.3, w * 0.04); g.fill();
    g.fillStyle = "#2b2b2b";
    g.fillRect(-u * 0.97, -w * 0.2, u * 0.26, w * 0.03); g.fillRect(u * 0.71, -w * 0.2, u * 0.26, w * 0.03);

    const body = g.createLinearGradient(0, -w * 0.62, 0, 0);
    body.addColorStop(0, shade(look.color, 0.35)); body.addColorStop(0.45, look.color); body.addColorStop(1, shade(look.color, -0.45));
    if (jeep) {
      // ג׳יפ משוריין: גוף מרובע, גלגל רזרבי, לוחות שריון
      g.fillStyle = body;
      rr(g, -u * 0.98, -w * 0.72, u * 1.96, w * 0.6, w * 0.06); g.fill();
      g.fillStyle = "#1b1f1a"; rr(g, -u * 0.7, -w * 0.68, u * 1.4, w * 0.2, w * 0.03); g.fill(); // חלון
      g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(-u * 0.62, -w * 0.66, u * 0.4, w * 0.04);
      g.strokeStyle = shade(look.color, -0.35); g.lineWidth = Math.max(1, w * 0.012);
      for (const yy of [0.44, 0.3]) { g.beginPath(); g.moveTo(-u * 0.95, -w * yy); g.lineTo(u * 0.95, -w * yy); g.stroke(); }
      for (const xx of [-0.6, 0.6]) for (const yy of [0.4, 0.27]) { g.fillStyle = shade(look.color, -0.5); g.beginPath(); g.arc(u * xx, -w * yy, w * 0.012, 0, 7); g.fill(); }
      g.fillStyle = "#151515"; g.beginPath(); g.arc(0, -w * 0.36, w * 0.13, 0, 7); g.fill(); // גלגל רזרבי
      g.fillStyle = "#555"; g.beginPath(); g.arc(0, -w * 0.36, w * 0.06, 0, 7); g.fill();
      g.fillStyle = "#222"; g.fillRect(-u * 0.9, -w * 0.78, u * 1.8, w * 0.04); // גגון
      g.fillStyle = "#333"; rr(g, -u * 1.02, -w * 0.16, u * 2.04, w * 0.07, w * 0.02); g.fill(); // פגוש
    } else {
      // מכונית ספורט: גוף רחב, חלון אחורי, כנף
      g.fillStyle = body;
      g.beginPath();
      g.moveTo(-u * 0.96, -w * 0.1); g.lineTo(-u * 1.02, -w * 0.3); g.quadraticCurveTo(-u * 1.0, -w * 0.42, -u * 0.72, -w * 0.47);
      g.quadraticCurveTo(-u * 0.5, -w * 0.62, -u * 0.3, -w * 0.64); g.lineTo(u * 0.3, -w * 0.64);
      g.quadraticCurveTo(u * 0.5, -w * 0.62, u * 0.72, -w * 0.47); g.quadraticCurveTo(u * 1.0, -w * 0.42, u * 1.02, -w * 0.3);
      g.lineTo(u * 0.96, -w * 0.1); g.closePath(); g.fill();
      // פס כהה באמצע (מכסה מנוע) ופסי מירוץ
      if (look.stripe) { g.fillStyle = look.stripe; g.fillRect(-u * 0.14, -w * 0.64, u * 0.1, w * 0.5); g.fillRect(u * 0.04, -w * 0.64, u * 0.1, w * 0.5); }
      // חלון אחורי
      const win = g.createLinearGradient(0, -w * 0.62, 0, -w * 0.47);
      win.addColorStop(0, "#3a4250"); win.addColorStop(1, "#07090c");
      g.fillStyle = win;
      g.beginPath(); g.moveTo(-u * 0.32, -w * 0.61); g.lineTo(u * 0.32, -w * 0.61); g.lineTo(u * 0.5, -w * 0.49); g.lineTo(-u * 0.5, -w * 0.49); g.closePath(); g.fill();
      g.fillStyle = "rgba(255,255,255,.22)";
      g.beginPath(); g.moveTo(-u * 0.26, -w * 0.6); g.lineTo(-u * 0.05, -w * 0.6); g.lineTo(-u * 0.2, -w * 0.5); g.lineTo(-u * 0.4, -w * 0.5); g.closePath(); g.fill();
      // לוח אחורי שחור עם פנסים
      g.fillStyle = "#16181c";
      g.beginPath(); g.moveTo(-u * 0.9, -w * 0.36); g.lineTo(u * 0.9, -w * 0.36); g.lineTo(u * 0.78, -w * 0.12); g.lineTo(-u * 0.78, -w * 0.12); g.closePath(); g.fill();
      // דיפיוזר
      g.fillStyle = "#0b0c0e"; g.fillRect(-u * 0.75, -w * 0.12, u * 1.5, w * 0.06);
      g.strokeStyle = "#2a2d33"; g.lineWidth = Math.max(1, w * 0.008);
      for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(u * k * 0.18, -w * 0.12); g.lineTo(u * k * 0.2, -w * 0.06); g.stroke(); }
      // כנף אחורית
      g.fillStyle = "#14161a";
      g.fillRect(-u * 0.5, -w * 0.72, u * 0.06, w * 0.12); g.fillRect(u * 0.44, -w * 0.72, u * 0.06, w * 0.12);
      g.fillStyle = look.wing || "#1f2228";
      rr(g, -u * 1.02, -w * 0.78, u * 2.04, w * 0.07, w * 0.02); g.fill();
      g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(-u * 1.0, -w * 0.775, u * 2.0, w * 0.015);
    }
    // פנסים אחוריים: זוהרים חזק בבלימה
    const glow = o.brake ? 1 : 0.55;
    g.shadowColor = "#ff2a2a"; g.shadowBlur = w * (o.brake ? 0.18 : 0.06);
    g.fillStyle = `rgba(255,${o.brake ? 60 : 30},${o.brake ? 60 : 30},${glow})`;
    if (jeep) { g.fillRect(-u * 0.95, -w * 0.62, u * 0.12, w * 0.16); g.fillRect(u * 0.83, -w * 0.62, u * 0.12, w * 0.16); }
    else {
      rr(g, -u * 0.86, -w * 0.33, u * 0.42, w * 0.045, w * 0.02); g.fill(); rr(g, u * 0.44, -w * 0.33, u * 0.42, w * 0.045, w * 0.02); g.fill();
      g.beginPath(); g.arc(-u * 0.35, -w * 0.3, w * 0.022, 0, 7); g.arc(u * 0.35, -w * 0.3, w * 0.022, 0, 7); g.fill();
    }
    g.shadowBlur = 0;
    // לוחית רישוי
    g.fillStyle = "#f4f4f0"; rr(g, -u * 0.22, -w * (jeep ? 0.22 : 0.25), u * 0.44, w * 0.075, w * 0.01); g.fill();
    g.fillStyle = "#1e3a8a"; g.font = `800 ${Math.max(6, w * 0.05)}px Rubik, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(look.plate || "תורה", 0, -w * (jeep ? 0.183 : 0.213));
    // אגזוזים ולהבות טורבו
    const ex = jeep ? [[-0.7, -0.12]] : [[-0.16, -0.09], [0.16, -0.09]];
    ex.forEach(([x, y]) => {
      g.fillStyle = "#3a3a3a"; g.beginPath(); g.arc(u * x, w * y, w * 0.03, 0, 7); g.fill();
      g.fillStyle = "#050505"; g.beginPath(); g.arc(u * x, w * y, w * 0.018, 0, 7); g.fill();
      if (o.nitro) {
        const len = w * (0.18 + 0.1 * Math.sin(t * 60 + x * 9));
        const fl = g.createRadialGradient(u * x, w * y, 0, u * x, w * y + len * 0.6, len);
        fl.addColorStop(0, "rgba(255,255,255,.95)"); fl.addColorStop(0.25, "rgba(120,200,255,.9)"); fl.addColorStop(0.6, "rgba(255,140,40,.7)"); fl.addColorStop(1, "rgba(255,60,0,0)");
        g.fillStyle = fl; g.beginPath(); g.ellipse(u * x, w * y + len * 0.5, w * 0.05, len * 0.6, 0, 0, 7); g.fill();
      }
    });
    g.restore();
  }

  // ---------- קולות: מנוע, כביש, צמיגים, טורבו, עקיפה, התרסקות ----------
  const SFX_KEY = "teire.racesfx";
  function makeSound() {
    let ctx = null, out = null, eng = null, road = null, skid = null, noiseBuf = null;
    let on = true;
    try { on = localStorage.getItem(SFX_KEY) !== "off"; } catch (e) { /* ignore */ }
    function noise() {
      if (noiseBuf) return noiseBuf;
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; d[i] = w * 0.5 + last * 3; }
      return noiseBuf;
    }
    function loopNoise(type, freq, q) {
      const s = ctx.createBufferSource(); s.buffer = noise(); s.loop = true;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const gn = ctx.createGain(); gn.gain.value = 0;
      s.connect(f); f.connect(gn); gn.connect(out); s.start();
      return { s, f, g: gn };
    }
    function start() {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        out = ctx.createGain(); out.gain.value = on ? 0.9 : 0;
        const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5;
        out.connect(comp); comp.connect(ctx.destination);
        // מנוע: שני מתנדים (שן מסור ומרובע) דרך מסנן, עם עיוות קל לצליל "גס"
        const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator();
        o1.type = "sawtooth"; o2.type = "square"; o3.type = "sawtooth";
        const shaper = ctx.createWaveShaper(), curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 2.5); }
        shaper.curve = curve;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600; lp.Q.value = 4;
        const gn = ctx.createGain(); gn.gain.value = 0;
        const g2 = ctx.createGain(); g2.gain.value = 0.5; const g3 = ctx.createGain(); g3.gain.value = 0.35;
        o1.connect(shaper); o2.connect(g2); g2.connect(shaper); o3.connect(g3); g3.connect(shaper);
        shaper.connect(lp); lp.connect(gn); gn.connect(out);
        o1.start(); o2.start(); o3.start();
        eng = { o1, o2, o3, lp, g: gn };
        road = loopNoise("bandpass", 500, 0.6);
        skid = loopNoise("bandpass", 2600, 9);
        ctx.resume();
      } catch (e) { ctx = null; }
    }
    // speed01 = 0..1, kmh לחישוב הילוכים, skid01 = עוצמת חריקת הצמיגים
    function update(kmh, speed01, skid01, boost) {
      if (!ctx) return;
      const t = ctx.currentTime;
      // הילוכים: הסל"ד עולה בתוך כל הילוך ויורד כשמחליפים
      const gears = [0, 60, 110, 160, 210, 260, 999];
      let gi = 1; while (gi < gears.length - 1 && kmh > gears[gi]) gi++;
      const lo = gears[gi - 1], hi = Math.min(gears[gi], lo + 60);
      const rpm = Math.min(1, (kmh - lo) / (hi - lo || 1));
      const f = 42 + rpm * 95 + gi * 6 + (boost ? 25 : 0);
      eng.o1.frequency.setTargetAtTime(f, t, 0.05);
      eng.o2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
      eng.o3.frequency.setTargetAtTime(f * 1.006 * 2, t, 0.05);
      eng.lp.frequency.setTargetAtTime(350 + rpm * 900 + speed01 * 600 + (boost ? 900 : 0), t, 0.06);
      eng.g.gain.setTargetAtTime(kmh > 1 ? 0.16 + speed01 * 0.08 : 0.07, t, 0.1);
      road.g.gain.setTargetAtTime(speed01 * 0.18, t, 0.15);
      road.f.frequency.setTargetAtTime(300 + speed01 * 900, t, 0.2);
      skid.g.gain.setTargetAtTime(skid01 * 0.12, t, 0.08);
    }
    function burst(type, freq, dur, vol, sweep) {
      if (!ctx) return;
      const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = noise();
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t);
      if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
      const gn = ctx.createGain(); gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f); f.connect(gn); gn.connect(out); s.start(t); s.stop(t + dur + 0.05);
    }
    function tone(freq, dur, vol, type = "square", to) {
      if (!ctx) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(gn); gn.connect(out); o.start(t); o.stop(t + dur + 0.05);
    }
    return {
      start,
      update,
      beep: hi => tone(hi ? 880 : 440, hi ? 0.5 : 0.18, 0.18),
      nitro() { burst("highpass", 400, 1.2, 0.5, 4000); tone(120, 0.9, 0.12, "sawtooth", 420); },
      whoosh() { burst("bandpass", 1800, 0.45, 0.35, 400); },
      gate() { burst("bandpass", 900, 0.25, 0.25, 2500); tone(660, 0.12, 0.08, "triangle"); },
      crash() { burst("lowpass", 1800, 1.1, 1.0, 120); tone(70, 0.6, 0.5, "sine", 30); burst("bandpass", 3000, 0.5, 0.4); },
      shield() { tone(520, 0.35, 0.15, "triangle", 1040); },
      // קפיצת הרמפה: שיגור, דופק בזמן ההחלטה, ונחיתה
      launch() { burst("bandpass", 600, 0.7, 0.45, 2400); tone(160, 0.7, 0.12, "sawtooth", 520); },
      heart() { tone(62, 0.16, 0.5, "sine", 40); setTimeout(() => tone(55, 0.14, 0.35, "sine", 38), 170); },
      tick() { tone(1200, 0.05, 0.05, "square"); },
      land() { burst("lowpass", 900, 0.5, 0.9, 90); tone(55, 0.35, 0.45, "sine", 30); },
      cheer() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 0.1, "triangle"), i * 90)); },
      toggle() {
        on = !on;
        try { localStorage.setItem(SFX_KEY, on ? "on" : "off"); } catch (e) { /* ignore */ }
        if (out) out.gain.value = on ? 0.9 : 0;
        return on;
      },
      get on() { return on; },
      stop() { if (ctx) { try { ctx.close(); } catch (e) { /* ignore */ } ctx = null; } },
    };
  }

  // ---------- הכביש ----------
  const SEG = 200, N = 1600, ROAD_W = 1500, CAM_H = 1000, DRAW = 140, LANES = 2;
  const CAM_D = 1 / Math.tan((50 * Math.PI / 180)); // עומק המצלמה לפי זווית ראייה של 100°
  const PLAYER_Z = CAM_H * CAM_D;
  const RAMP_T = 5.5; // שניות להחליט בתוך תא הנהג
  const GATE_DIST = 70 * SEG; // השער נולד במרחק הזה מהמכונית
  // הנתיבים: שמאל, אמצע (בין הנתיבים), ימין. ביחידות של חצי רוחב הכביש
  const LANE_X = { left: -0.5, mid: 0, right: 0.5 };

  // נופי המסלולים: שמיים, רכסים, שוליים ועצמים בצד הדרך
  const THEMES = {
    forest: { sky: ["#4f9ee0", "#a9d4f2", "#e8f3f8"], ridges: ["#8fb3c9", "#4e7d5b", "#2f6a40"], grass: ["#3f8a3a", "#4a9a42"], fog: "232,243,248", rock: "#8b8378", side: ["tree", "tree"], extra: "rock" },
    desert: { sky: ["#5aa9e6", "#f3d9a4", "#fbe7c0"], ridges: ["#e0b07a", "#c98a50", "#a9683a"], grass: ["#d6ae6a", "#e0bb78"], fog: "251,231,192", rock: "#a8774a", side: ["cactus", "rock"], extra: "cactus" },
    sea: { sky: ["#2f8fe0", "#8fd0f5", "#e6f7ff"], ridges: ["#a7c9dd", "#2b8fc9", "#e6d39c"], grass: ["#e1cc92", "#ead8a6"], fog: "230,247,255", rock: "#9a8f7a", side: ["palm", "palm"], extra: "umbrella", water: true },
    jerusalem: { sky: ["#f97316", "#fbbf77", "#fde7c8"], ridges: ["#caa47f", "#b38d69", "#97734f"], grass: ["#988a58", "#a69866"], fog: "253,231,200", rock: "#cdbb98", side: ["house", "cypress"], extra: "house" },
  };
  function buildTrack(theme) {
    // קטעים: ישר, פנייה רכה, ופנייה חדה עם שלטי חץ. גבעות בגלים שנסגרים בסוף המסלול
    const segs = [];
    const rnd = (a, b) => a + Math.random() * (b - a);
    let i = 0;
    const add = (n, curve, sharp) => {
      for (let k = 0; k < n && i < N; k++, i++) {
        const ease = k < n * 0.2 ? k / (n * 0.2) : k > n * 0.8 ? (n - k) / (n * 0.2) : 1;
        segs.push({ i, curve: curve * ease, sharp: sharp && ease > 0.5, sprites: [] });
      }
    };
    add(60, 0);
    while (i < N - 60) {
      const r = Math.random(), dir = Math.random() < 0.5 ? -1 : 1;
      if (r < 0.3) add(Math.round(rnd(25, 60)), 0);
      else if (r < 0.65) add(Math.round(rnd(45, 90)), dir * rnd(1.5, 3));
      else add(Math.round(rnd(30, 50)), dir * rnd(5.5, 7.5), true); // פנייה חדה
    }
    add(N - i, 0);
    const hill = k => 900 * Math.sin(2 * Math.PI * 3 * k / N) + 300 * Math.sin(2 * Math.PI * 11 * k / N);
    segs.forEach(s => {
      s.y1 = hill(s.i); s.y2 = hill(s.i + 1);
      s.dark = Math.floor(s.i / 3) % 2;
      // עצים, סלעים ושלטי חץ לפניות החדות
      const pick = () => theme.side[Math.random() < 0.7 ? 0 : 1];
      if (s.i % 3 === 0) s.sprites.push({ kind: pick(), x: -(1.55 + Math.random() * 1.8), s: 0.8 + Math.random() * 0.6 });
      if (s.i % 3 === 1) s.sprites.push({ kind: pick(), x: 1.55 + Math.random() * 1.8, s: 0.8 + Math.random() * 0.6 });
      if (s.i % 17 === 5) s.sprites.push({ kind: theme.extra, x: (Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random()), s: 1 });
      if (s.sharp && s.i % 4 === 0) s.sprites.push({ kind: "chevron", x: s.curve > 0 ? 1.28 : -1.28, dir: s.curve > 0 ? 1 : -1 });
    });
    return segs;
  }

  function start(opts) {
    const { root, look, boost: boost0 = 1, shield: shield0 = 0, sidesFor, ui } = opts;
    const theme = THEMES[opts.theme] || THEMES.forest, boost = boost0 * (opts.speed || 1);
    // שלבי הקושי בתוך המרוץ: שערים 1-5 מהחפיסה הראשונה, 6-10 מהשנייה, ומשם מהשלישית
    const decks = opts.decks || [opts.deck], ks = decks.map(() => 0);
    const stageOf = n => Math.min(decks.length - 1, n <= 5 ? 0 : n <= 10 ? 1 : 2);
    const isRamp = n => opts.ramps !== false && (n === 5 || n === 10 || n === 15 || (n > 15 && n % 10 === 5));
    const driverName = (opts.driver && opts.driver.name) || "";
    const canvas = root.querySelector("canvas"), g = canvas.getContext("2d");
    const segs = buildTrack(theme), trackLen = N * SEG;
    const snd = makeSound(); snd.start();
    let W = 0, H = 0, dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = root.clientWidth; H = root.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
    }
    resize();
    window.addEventListener("resize", resize);

    // מצב המשחק
    let pos = 0, speed = 0, target = 0, laneName = "mid", px = 0, score = 0, streak = 0, shield = shield0;
    let phase = "count", phaseT = 0, clock = 0, raceT = 0, gateZ = null, item = null, sides = null, k = 0, raf = 0, last = 0;
    let lap = 0, bgX = 0, crashT = 0, nitroT = 0, lean = 0, ended = false, flash = 0;
    // רמפה: gates = מספר השער, ramp = השער הנוכחי הוא רמפה, lift/zoom = גובה הקפיצה והזום לתא הנהג
    let gates = 0, ramp = false, lift = 0, zoom = 0, airTilt = 0, chosen = null, choseT = 0, beatT = 0, slow = 1, shake = 0, bodyLean = 0, stage = -1;
    const sparks = [];
    // המתחרים: מתחילים לפנינו, כל אחד במהירות קבועה. השחקן מאיץ עם כל תשובה נכונה ועוקף אותם
    const RIVALS = [
      { color: "#1d4ed8", stripe: "#e5e7eb", plate: "רש״י" },
      { color: "#facc15", stripe: "#111827", plate: "רמב״ם" },
      { color: "#f8fafc", stripe: "#dc2626", plate: "רמב״ן" },
      { color: "#16a34a", stripe: "#fef08a", plate: "תוס׳" },
    ].map((l, n) => ({ look: l, z: PLAYER_Z + 3200 + n * 2600, x: n % 2 ? 0.5 : -0.5, tx: n % 2 ? 0.5 : -0.5, v: 0, mul: [0.92, 1.0, 1.06, 1.12][n], ahead: true }));
    const durFor = s => Math.max(2300, 4600 - s * 180) / boost;
    const kmhOf = v => v / GATE_DIST * 4.6 * 140; // 140 קמ״ש במהירות ההתחלה
    const baseV = GATE_DIST / 4.6; // יחידות לשנייה במהירות ההתחלה

    const segAt = z => segs[Math.floor(((z % trackLen) + trackLen) % trackLen / SEG) % N];
    function newGate() {
      gates++;
      ramp = isRamp(gates);
      const st = stageOf(gates), di = ramp ? Math.min(decks.length - 1, st + 1) : st, d = decks[di];
      if (st !== stage) { if (stage >= 0 && ui.stage) ui.stage(st); stage = st; }
      item = d[ks[di]++ % d.length]; sides = sidesFor(item);
      gateZ = pos + PLAYER_Z + GATE_DIST;
      target = GATE_DIST / (durFor(score) / 1000);
      if (ramp) {
        // לפני הרמפה רואים רק את המשפט. המקורות יופיעו בתוך תא הנהג
        ui.question(item, null);
        ui.banner("🛫 רמפה! קפיצה לפניכם", "lap");
        if (ui.ramp) ui.ramp("near");
      } else ui.question(item, sides);
    }
    function startJump() {
      phase = "jump"; phaseT = 0; gateZ = null; snd.launch(); flash = 0.2;
      chosen = null; choseT = 0; beatT = 0;
      if (ui.ramp) ui.ramp("air");
    }
    function enterCockpit() {
      phase = "cockpit"; phaseT = 0; laneName = "mid"; zoom = 1;
      ui.question(item, sides);
      if (ui.ramp) ui.ramp("cockpit");
    }
    function leaveCockpit() {
      chosen = laneName; phase = "fall"; phaseT = 0;
      if (ui.ramp) ui.ramp("fall");
    }
    function landed() {
      phase = "landed"; phaseT = 0; snd.land(); shake = 0.5; flash = 0.25; lift = 0;
      const carX = W / 2, carY = H - Math.max(14, H * 0.06);
      for (let q = 0; q < 34; q++) sparks.push({ x: carX + (Math.random() - 0.5) * W * 0.3, y: carY, vx: (Math.random() - 0.5) * 420, vy: -120 - Math.random() * 380, life: 0.6 + Math.random() * 0.5 });
    }
    function resolveRamp() {
      if (ui.ramp) ui.ramp("done");
      if (chosen === sides.correct) {
        score += 3; streak++; ui.score(score); snd.cheer();
        phase = "turbo"; phaseT = 0; nitroT = 1.8; snd.nitro();
        ui.banner("🎯 נחיתה מושלמת! +3", "turbo"); ui.question(null);
        if (Math.floor(score / 10) > lap) lap = Math.floor(score / 10);
        return;
      }
      wrongAnswer();
    }
    function steer(s) {
      if (phase === "crash" || ended || phase === "fall" || phase === "landed") return;
      laneName = laneName === "mid" ? s : (laneName === s ? s : "mid"); // מהצד השני חוזרים קודם לאמצע
    }
    // הג'ויסטיק בוחר נתיב ישירות: שמאל, אמצע או ימין
    function setLane(s) {
      if (phase === "crash" || ended || phase === "fall" || phase === "landed" || !LANE_X.hasOwnProperty(s)) return;
      laneName = s;
    }
    function passGate() {
      const ok = laneName === sides.correct;
      if (ok) {
        score++; streak++; snd.gate(); flash = 0.25;
        ui.score(score);
        // כל 4 תשובות ברצף: טורבו! קפיצת מהירות, להבות, ונקודת בונוס
        if (streak % 4 === 0) {
          score++; ui.score(score);
          phase = "turbo"; phaseT = 0; nitroT = 1.8; snd.nitro(); gateZ = null;
          ui.banner("🔥 טורבו! +1", "turbo"); ui.question(null);
        } else newGate();
        if (Math.floor(score / 10) > lap) { lap = Math.floor(score / 10); ui.banner(`🏁 הקפה ${lap} הושלמה!`, "lap"); }
        return;
      }
      wrongAnswer();
    }
    function wrongAnswer() {
      if (shield > 0) {
        shield--; streak = 0; snd.shield(); gateZ = null; flash = 0.4;
        ui.banner("🛡️ המגן ספג את הפגיעה!", "shield"); ui.toast("המקור הנכון: " + item.right);
        phase = "pause"; phaseT = 0; // הפסקה קצרה ואז שער חדש
        ui.question(null);
        return;
      }
      phase = "crash"; phaseT = 0; crashT = 0; snd.crash(); target = 0; flash = 0.6;
      ui.toast("המקור הנכון: " + item.right);
      ui.banner("💥 התרסקות!", "crash");
    }

    // הקרנת נקודה מהעולם למסך
    function project(wx, wy, wz, camX, camY, camZ) {
      const cz = wz - camZ, sc = CAM_D / cz;
      return { x: W / 2 + sc * (wx - camX) * W / 2, y: H / 2 - sc * (wy - camY) * H / 2, w: sc * ROAD_W * W / 2, sc };
    }
    function poly(x1, y1, w1, x2, y2, w2, color) {
      g.fillStyle = color; g.beginPath();
      g.moveTo(x1 - w1, y1); g.lineTo(x2 - w2, y2); g.lineTo(x2 + w2, y2); g.lineTo(x1 + w1, y1); g.closePath(); g.fill();
    }
    function drawTree(x, y, h, s) {
      const w = h * 0.42;
      g.fillStyle = "#4a3426"; g.fillRect(x - w * 0.08, y - h * 0.18, w * 0.16, h * 0.18);
      for (let k2 = 0; k2 < 3; k2++) {
        const yy = y - h * (0.15 + k2 * 0.26), ww = w * (1 - k2 * 0.22);
        g.fillStyle = k2 % 2 ? "#1f5f3a" : (s > 1.1 ? "#2c7a47" : "#256b3e");
        g.beginPath(); g.moveTo(x - ww / 2, yy); g.lineTo(x, yy - h * 0.42); g.lineTo(x + ww / 2, yy); g.closePath(); g.fill();
      }
    }
    function drawChevron(x, y, h, dir) {
      const w = h * 0.9;
      g.fillStyle = "#555"; g.fillRect(x - h * 0.04, y - h * 0.5, h * 0.08, h * 0.5);
      g.fillStyle = "#111"; g.fillRect(x - w / 2, y - h * 1.1, w, h * 0.6);
      g.strokeStyle = "#fff"; g.lineWidth = Math.max(1, h * 0.1); g.lineJoin = "miter";
      for (const off of [-0.2, 0.15]) {
        g.beginPath(); g.moveTo(x + w * (off - 0.08 * dir), y - h * 1.0); g.lineTo(x + w * (off + 0.12 * dir), y - h * 0.8); g.lineTo(x + w * (off - 0.08 * dir), y - h * 0.6); g.stroke();
      }
    }
    function drawGate(p, sideTxt) {
      // שער עם שני שלטים ירוקים מעל הנתיבים, ומחסום אדום-לבן באמצע
      const lx = p.x - p.w * 1.2, rx = p.x + p.w * 1.2, top = p.y - p.sc * 1900 * H / 2, post = Math.max(2, p.w * 0.04);
      g.fillStyle = "#6b7280"; g.fillRect(lx - post / 2, top, post, p.y - top); g.fillRect(rx - post / 2, top, post, p.y - top);
      g.fillRect(lx, top, rx - lx, post * 1.2);
      ["left", "right"].forEach((side, n) => {
        const cx = p.x + (n ? 1 : -1) * p.w * 0.5, sw = p.w * 0.92, sh = p.sc * 620 * H / 2;
        g.fillStyle = "#0f6b3a"; rr(g, cx - sw / 2, top + post, sw, sh, Math.max(2, sh * 0.08)); g.fill();
        g.strokeStyle = "#fff"; g.lineWidth = Math.max(1, sh * 0.04); rr(g, cx - sw / 2 + sh * 0.06, top + post + sh * 0.06, sw - sh * 0.12, sh * 0.88, Math.max(2, sh * 0.06)); g.stroke();
        const fs = Math.min(sh * 0.32, sw / 9);
        if (fs > 4) {
          g.fillStyle = "#fff"; g.font = `800 ${fs}px Rubik, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
          try { g.direction = "rtl"; } catch (e) { /* ignore */ }
          const txt = sideTxt[side] || "", words = txt.split(" "), lines = [];
          let cur = "";
          words.forEach(w => { const tr = cur ? cur + " " + w : w; if (g.measureText(tr).width > sw * 0.86 && cur) { lines.push(cur); cur = w; } else cur = tr; });
          if (cur) lines.push(cur);
          lines.slice(0, 2).forEach((ln, li, arr) => g.fillText(ln, cx, top + post + sh / 2 + (li - (arr.length - 1) / 2) * fs * 1.15));
          g.direction = "ltr";
        }
      });
      // המחסום באמצע
      const bw = p.w * 0.32, bh = p.sc * 380 * H / 2;
      for (let s2 = 0; s2 < 6; s2++) { g.fillStyle = s2 % 2 ? "#fff" : "#dc2626"; g.fillRect(p.x - bw / 2 + s2 * bw / 6, p.y - bh, bw / 6 + 0.5, bh); }
      g.fillStyle = "#fbbf24"; g.beginPath(); g.arc(p.x - bw / 2, p.y - bh, Math.max(2, bh * 0.12), 0, 7); g.arc(p.x + bw / 2, p.y - bh, Math.max(2, bh * 0.12), 0, 7); g.fill();
    }

    function drawSprite(kind, x, y, h, sc) {
      if (kind === "tree") return drawTree(x, y, h, sc);
      if (kind === "rock") { g.fillStyle = theme.rock; g.beginPath(); g.ellipse(x, y - h * 0.35, h * 0.8, h * 0.45, 0, 0, 7); g.fill(); return; }
      if (kind === "cactus") {
        const w = h * 0.16; g.fillStyle = "#3f7d3a";
        rr(g, x - w / 2, y - h, w, h, w / 2); g.fill();
        rr(g, x - w * 1.9, y - h * 0.7, w * 0.8, h * 0.35, w * 0.4); g.fill(); g.fillRect(x - w * 1.5, y - h * 0.42, w * 1.2, w * 0.7);
        rr(g, x + w * 1.1, y - h * 0.85, w * 0.8, h * 0.4, w * 0.4); g.fill(); g.fillRect(x + w * 0.3, y - h * 0.5, w * 1.2, w * 0.7);
        return;
      }
      if (kind === "palm") {
        g.strokeStyle = "#8a5a2b"; g.lineWidth = Math.max(1.5, h * 0.06); g.lineCap = "round";
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + h * 0.12, y - h * 0.5, x + h * 0.05, y - h * 0.92); g.stroke();
        g.fillStyle = "#2f8f46";
        for (let a = 0; a < 6; a++) {
          const an = -Math.PI / 2 + (a - 2.5) * 0.55, ex = x + h * 0.05 + Math.cos(an) * h * 0.42, ey = y - h * 0.92 + Math.sin(an) * h * 0.22 + h * 0.12;
          g.beginPath(); g.moveTo(x + h * 0.05, y - h * 0.92); g.quadraticCurveTo((x + ex) / 2, ey - h * 0.2, ex, ey); g.quadraticCurveTo((x + ex) / 2, ey - h * 0.08, x + h * 0.05, y - h * 0.9); g.fill();
        }
        return;
      }
      if (kind === "umbrella") {
        g.fillStyle = "#555"; g.fillRect(x - h * 0.02, y - h, h * 0.04, h);
        ["#ef4444", "#fff", "#ef4444", "#fff"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y - h); g.arc(x, y - h * 0.82, h * 0.5, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4); g.closePath(); g.fill(); });
        return;
      }
      if (kind === "cypress") { g.fillStyle = "#2d4a2b"; g.beginPath(); g.ellipse(x, y - h * 0.5, h * 0.12, h * 0.5, 0, 0, 7); g.fill(); return; }
      if (kind === "house") {
        const w = h * 0.9, hh = h * 0.6;
        g.fillStyle = "#e9d8b4"; g.fillRect(x - w / 2, y - hh, w, hh);
        g.fillStyle = "#cdb88f"; g.fillRect(x - w / 2, y - hh, w, hh * 0.08);
        if (sc > 1.1) { g.fillStyle = "#d4a017"; g.beginPath(); g.arc(x, y - hh, w * 0.24, Math.PI, 0); g.fill(); }
        g.fillStyle = "#5b4636";
        for (const fx of [-0.28, 0.28]) { rr(g, x + w * fx - w * 0.07, y - hh * 0.7, w * 0.14, hh * 0.3, w * 0.07); g.fill(); }
        rr(g, x - w * 0.09, y - hh * 0.38, w * 0.18, hh * 0.38, w * 0.09); g.fill();
      }
    }
    function drawRamp(p) {
      // רמפה צהובה-שחורה על כל רוחב הכביש
      const hgt = p.sc * 520 * H / 2, w = p.w * 1.02;
      g.fillStyle = "#3b3f46";
      g.beginPath(); g.moveTo(p.x - w, p.y); g.lineTo(p.x - w * 0.96, p.y - hgt); g.lineTo(p.x + w * 0.96, p.y - hgt); g.lineTo(p.x + w, p.y); g.closePath(); g.fill();
      const n = 10;
      for (let q = 0; q < n; q++) {
        if (q % 2) continue;
        g.fillStyle = "#facc15";
        const x1 = p.x - w + (2 * w) * q / n, x2 = p.x - w + (2 * w) * (q + 1) / n;
        g.beginPath(); g.moveTo(x1, p.y); g.lineTo(x1 + hgt * 0.5, p.y - hgt); g.lineTo(x2 + hgt * 0.5, p.y - hgt); g.lineTo(x2, p.y); g.closePath(); g.fill();
      }
      g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(p.x - w * 0.96, p.y - hgt, w * 1.92, Math.max(1, hgt * 0.12));
      // שלט מעל
      const top = p.y - p.sc * 1700 * H / 2, post = Math.max(2, p.w * 0.03);
      g.fillStyle = "#6b7280"; g.fillRect(p.x - w * 1.15, top, post, p.y - top); g.fillRect(p.x + w * 1.15, top, post, p.y - top);
      const sh = p.sc * 480 * H / 2, sw = w * 1.3;
      g.fillStyle = "#e11d48"; rr(g, p.x - sw / 2, top, sw, sh, Math.max(2, sh * 0.15)); g.fill();
      const fs = sh * 0.55;
      if (fs > 5) {
        g.fillStyle = "#fff"; g.font = `800 ${fs}px Rubik, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
        try { g.direction = "rtl"; } catch (e) { /* ignore */ }
        g.fillText("🛫 קפיצה!", p.x, top + sh / 2); g.direction = "ltr";
      }
    }
    // תא הנהג: הדמות עם קסדה, מבעד לשמשה, נוטה לצד שנבחר
    function drawCockpit(t) {
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, theme.sky[0]); sky.addColorStop(1, theme.sky[1]);
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      // עננים וקווים שזזים מהר: אנחנו באוויר
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineCap = "round";
      for (let q = 0; q < 18; q++) {
        const x = (q * 97.3 % 1) * W, sp = 0.6 + (q * 37 % 10) / 10, y = ((q * 53 + t * 900 * sp) % (H * 1.3)) - H * 0.15;
        g.lineWidth = 2 + (q % 3); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 30 + 40 * sp); g.stroke();
      }
      const cx = W / 2, base = H * 0.86, S = Math.min(W * 0.8, H * 0.85);
      const tgt = laneName === "left" ? -0.38 : laneName === "right" ? 0.38 : 0;
      g.save();
      // הגוף כולו נוטה סביב המותניים
      g.translate(cx, base); g.rotate(bodyLean);
      const suit = look.color, dark = shade(look.color, -0.45);
      // כתפיים וחליפת מרוצים
      g.fillStyle = suit;
      g.beginPath(); g.moveTo(-S * 0.36, 0); g.quadraticCurveTo(-S * 0.38, -S * 0.36, -S * 0.12, -S * 0.42); g.lineTo(S * 0.12, -S * 0.42); g.quadraticCurveTo(S * 0.38, -S * 0.36, S * 0.36, 0); g.closePath(); g.fill();
      g.fillStyle = look.stripe || "#111"; g.fillRect(-S * 0.035, -S * 0.42, S * 0.07, S * 0.42);
      g.fillStyle = "#f8fafc"; rr(g, -S * 0.1, -S * 0.46, S * 0.2, S * 0.07, S * 0.03); g.fill(); // צווארון
      g.fillStyle = "#fff"; g.font = `800 ${S * 0.035}px Rubik, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("TORAH", -S * 0.22, -S * 0.25); g.fillText("RACING", S * 0.22, -S * 0.25);
      // קסדה
      const hy = -S * 0.62, hr = S * 0.19;
      g.save(); g.translate(0, hy); g.rotate(bodyLean * 0.4);
      const hg = g.createRadialGradient(-hr * 0.4, -hr * 0.5, hr * 0.1, 0, 0, hr * 1.1);
      hg.addColorStop(0, shade(suit, 0.55)); hg.addColorStop(0.5, suit); hg.addColorStop(1, dark);
      g.fillStyle = hg; g.beginPath(); g.ellipse(0, 0, hr, hr * 1.08, 0, 0, 7); g.fill();
      g.fillStyle = look.stripe || "#111"; g.beginPath(); g.ellipse(0, -hr * 0.2, hr * 0.14, hr * 0.92, 0, Math.PI, 0); g.fill();
      // משקף כהה עם השתקפות של השמיים
      const vg = g.createLinearGradient(0, -hr * 0.2, 0, hr * 0.35);
      vg.addColorStop(0, "#0b1220"); vg.addColorStop(0.5, "#1e3a8a"); vg.addColorStop(1, "#0b1220");
      g.fillStyle = vg; rr(g, -hr * 0.78, -hr * 0.18, hr * 1.56, hr * 0.5, hr * 0.22); g.fill();
      g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(-hr * 0.6, -hr * 0.14); g.lineTo(-hr * 0.25, -hr * 0.14); g.lineTo(-hr * 0.45, hr * 0.28); g.lineTo(-hr * 0.7, hr * 0.28); g.closePath(); g.fill();
      g.fillStyle = "#111"; rr(g, -hr * 0.5, hr * 0.45, hr, hr * 0.42, hr * 0.15); g.fill(); // סנטר
      g.fillStyle = "#9ca3af"; for (let q = -2; q <= 2; q++) g.fillRect(q * hr * 0.16 - hr * 0.04, hr * 0.56, hr * 0.08, hr * 0.2);
      if (driverName) {
        g.fillStyle = "#fff"; g.font = `800 ${hr * 0.2}px Rubik, sans-serif`;
        try { g.direction = "rtl"; } catch (e) { /* ignore */ }
        g.fillText(driverName.slice(0, 10), 0, -hr * 0.55); g.direction = "ltr";
      }
      g.restore();
      // ידיים על ההגה
      g.fillStyle = suit;
      g.save(); g.rotate(-bodyLean * 0.3);
      g.beginPath(); g.ellipse(-S * 0.26, -S * 0.14, S * 0.07, S * 0.16, 0.5, 0, 7); g.fill();
      g.beginPath(); g.ellipse(S * 0.26, -S * 0.14, S * 0.07, S * 0.16, -0.5, 0, 7); g.fill();
      g.restore();
      g.restore();
      // ההגה מסתובב לכיוון הנטייה
      g.save(); g.translate(cx, H * 0.84); g.rotate(bodyLean * 1.6);
      g.strokeStyle = "#111"; g.lineWidth = S * 0.045; g.beginPath(); g.arc(0, 0, S * 0.24, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      g.fillStyle = "#1f2937"; rr(g, -S * 0.07, -S * 0.1, S * 0.14, S * 0.1, S * 0.02); g.fill();
      g.fillStyle = "#e11d48"; g.fillRect(-S * 0.012, -S * 0.25, S * 0.024, S * 0.05);
      g.fillStyle = "#111"; g.beginPath(); g.ellipse(-S * 0.2, -S * 0.12, S * 0.05, S * 0.04, 0, 0, 7); g.ellipse(S * 0.2, -S * 0.12, S * 0.05, S * 0.04, 0, 0, 7); g.fill(); // כפפות
      g.restore();
      // מסגרת השמשה: עמודים בצבע המכונית ולוח מחוונים
      g.fillStyle = dark;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.1, 0); g.lineTo(W * 0.02, H); g.lineTo(0, H); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(W, 0); g.lineTo(W * 0.9, 0); g.lineTo(W * 0.98, H); g.lineTo(W, H); g.closePath(); g.fill();
      g.fillRect(0, 0, W, H * 0.035);
      // לוח המחוונים מתחת לשמשה
      const dg = g.createLinearGradient(0, H * 0.8, 0, H);
      dg.addColorStop(0, "#1f2937"); dg.addColorStop(1, "#0b0f17");
      g.fillStyle = dg; g.beginPath(); g.moveTo(0, H * 0.84); g.quadraticCurveTo(W / 2, H * 0.78, W, H * 0.84); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
      return tgt;
    }

    function render(t) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (shake > 0) g.translate((Math.random() - 0.5) * shake * 30, (Math.random() - 0.5) * shake * 20);
      const base = segAt(pos), basePct = (pos % SEG) / SEG;
      const pSeg = segAt(pos + PLAYER_Z), pPct = ((pos + PLAYER_Z) % SEG) / SEG;
      const playerY = pSeg.y1 + (pSeg.y2 - pSeg.y1) * pPct;
      const camX = px * ROAD_W * 0.55, camY = playerY + CAM_H;
      // שמיים, הרים ויער רחוק שזזים בפניות
      const sky = g.createLinearGradient(0, 0, 0, H * 0.6);
      sky.addColorStop(0, theme.sky[0]); sky.addColorStop(0.6, theme.sky[1]); sky.addColorStop(1, theme.sky[2]);
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(255,255,255,.85)";
      [[0.15, 0.12, 1], [0.5, 0.07, 1.4], [0.82, 0.15, 0.9]].forEach(([cx2, cy2, s]) => {
        const x = ((cx2 * W + bgX * 0.1) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15;
        g.beginPath(); g.ellipse(x, cy2 * H, 50 * s, 14 * s, 0, 0, 7); g.ellipse(x + 30 * s, cy2 * H - 8 * s, 30 * s, 14 * s, 0, 0, 7); g.fill();
      });
      const hz = H * 0.5;
      const ridge = (amp, freq, off, color, par) => {
        g.fillStyle = color; g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W + 10; x += 10) g.lineTo(x, hz - amp * (0.6 + 0.4 * Math.sin((x + bgX * par) * freq + off)) - amp * 0.3 * Math.sin((x + bgX * par) * freq * 2.7));
        g.lineTo(W, H); g.closePath(); g.fill();
      };
      ridge(H * 0.16, 0.006, 1, theme.ridges[0], 0.2);
      if (theme.water) { g.fillStyle = theme.ridges[1]; g.fillRect(0, hz - H * 0.04, W, H); g.fillStyle = "rgba(255,255,255,.35)"; for (let q = 0; q < 8; q++) g.fillRect(((q * 131 + bgX * 0.5) % W + W) % W, hz - H * 0.02 + q % 3 * 6, 30, 2); }
      else ridge(H * 0.1, 0.013, 3, theme.ridges[1], 0.45);
      ridge(H * 0.05, 0.03, 0, theme.ridges[2], 0.8);

      // הכביש: מהקרוב לרחוק, וזוכרים איפה נגמר כל קטע כדי לחתוך את מה שמאחורי גבעה
      let maxy = H, x = 0, dx = -(base.curve * basePct);
      const drawn = [];
      for (let n = 0; n < DRAW; n++) {
        const s = segs[(base.i + n) % N], z0 = Math.floor(pos / SEG) * SEG + n * SEG;
        const p1 = project(x, s.y1, z0, camX, camY, pos), p2 = project(x + dx, s.y2, z0 + SEG, camX, camY, pos);
        x += dx; dx += s.curve;
        s.clip = maxy; s.p1 = p1; s.z0 = z0;
        drawn.push(s);
        if (z0 - pos <= CAM_D || p2.y >= p1.y || p2.y >= maxy) continue;
        const fog = Math.min(1, n / DRAW);
        g.fillStyle = theme.grass[s.dark ? 0 : 1]; g.fillRect(0, p2.y, W, p1.y - p2.y + 1);
        // שולי הכביש, גדר בטיחות, אספלט וקווים
        poly(p1.x, p1.y, p1.w * 1.18, p2.x, p2.y, p2.w * 1.18, s.dark ? "#9aa0a6" : "#7d838a");
        poly(p1.x, p1.y, p1.w * 1.08, p2.x, p2.y, p2.w * 1.08, s.dark ? "#d62828" : "#f5f5f5");
        poly(p1.x, p1.y, p1.w, p2.x, p2.y, p2.w, s.dark ? "#5b5f66" : "#61656c");
        if (s.dark) {
          for (let l = 1; l < LANES; l++) { const lx1 = p1.x - p1.w + 2 * p1.w * l / LANES, lx2 = p2.x - p2.w + 2 * p2.w * l / LANES; poly(lx1, p1.y, p1.w * 0.025, lx2, p2.y, p2.w * 0.025, "#facc15"); }
        }
        poly(p1.x - p1.w * 0.93, p1.y, p1.w * 0.018, p2.x - p2.w * 0.93, p2.y, p2.w * 0.018, "#eee");
        poly(p1.x + p1.w * 0.93, p1.y, p1.w * 0.018, p2.x + p2.w * 0.93, p2.y, p2.w * 0.018, "#eee");
        // מעקה: פס מוגבה בשני הצדדים
        const rh1 = p1.sc * 150 * H / 2, rh2 = p2.sc * 150 * H / 2;
        [-1, 1].forEach(sd => {
          g.fillStyle = s.dark ? "#c7ccd1" : "#aeb4ba";
          g.beginPath(); g.moveTo(p1.x + sd * p1.w * 1.2, p1.y - rh1 * 0.4); g.lineTo(p2.x + sd * p2.w * 1.2, p2.y - rh2 * 0.4);
          g.lineTo(p2.x + sd * p2.w * 1.2, p2.y - rh2); g.lineTo(p1.x + sd * p1.w * 1.2, p1.y - rh1); g.closePath(); g.fill();
        });
        if (fog > 0.55) { g.fillStyle = `rgba(${theme.fog},${(fog - 0.55) * 1.6})`; g.fillRect(0, p2.y, W, p1.y - p2.y + 1); }
        maxy = p1.y;
      }

      // עצמים: מהרחוק לקרוב (עצים, שלטים, מתחרים, השער)
      const things = [];
      for (let n = drawn.length - 1; n >= 0; n--) {
        const s = drawn[n];
        if (!s.p1 || s.z0 - pos <= 300) continue;
        s.sprites.forEach(sp => things.push({ z: s.z0, s, sp }));
      }
      RIVALS.forEach(r => things.push({ z: r.z + pos, rival: r }));
      if (gateZ != null) things.push({ z: gateZ, gate: true });
      things.sort((a, b) => b.z - a.z);
      things.forEach(th => {
        if (th.sp) {
          const p = th.s.p1, sx = p.x + p.w * th.sp.x, sy = p.y;
          if (sy > th.s.clip + 2) return;
          const k3 = th.sp.kind, h = p.sc * ({ tree: 1700, palm: 1900, cypress: 1800, cactus: 1000, house: 1300, umbrella: 750 }[k3] * th.sp.s || (k3 === "rock" ? 380 : 520)) * H / 2;
          g.save(); g.beginPath(); g.rect(0, 0, W, th.s.clip); g.clip();
          if (k3 === "chevron") drawChevron(sx, sy, h, th.sp.dir);
          else drawSprite(k3, sx, sy, h, th.sp.s);
          g.restore();
          return;
        }
        // מתחרים והשער: מוצאים את הקטע שלהם ומשתמשים בהקרנה שלו
        const wz = th.rival ? pos + th.rival.z : th.z;
        const rel = wz - pos;
        if (rel <= PLAYER_Z * 0.6 || rel > DRAW * SEG * 0.95) return;
        const n = Math.floor((wz - Math.floor(pos / SEG) * SEG) / SEG), s = drawn[n];
        if (!s || !s.p1) return;
        const p = s.p1;
        if (p.y > s.clip + 2) return;
        g.save(); g.beginPath(); g.rect(0, 0, W, s.clip); g.clip();
        if (th.gate) { if (ramp) drawRamp(p); else drawGate(p, sides || {}); }
        else drawCar(g, p.x + p.w * th.rival.x, p.y, p.w * 0.55, th.rival.look, { t, lean: s.curve * 0.3 });
        g.restore();
      });

      // המכונית של השחקן
      const sc0 = CAM_D / PLAYER_Z, carW = Math.min(W * 0.36, sc0 * ROAD_W * W / 2 * 0.55);
      const carX = W / 2 + sc0 * (px * ROAD_W - camX) * W / 2;
      let carY = H - Math.max(14, H * 0.06);
      if (lift > 0) {
        // צל על הכביש, והמכונית באוויר מעליו
        g.fillStyle = `rgba(0,0,0,${0.35 * (1 - lift * 0.6)})`; g.beginPath(); g.ellipse(carX, carY, carW * 0.55 * (1 - lift * 0.3), carW * 0.05, 0, 0, 7); g.fill();
        carY -= lift * H * 0.28;
      }
      const speed01 = Math.min(1, speed / (baseV * 2.4));
      const skid = Math.min(1, Math.abs(pSeg.curve) / 7) * speed01 * (pSeg.sharp ? 1 : 0.35);
      g.save();
      if (airTilt) { g.translate(carX, carY - carW * 0.25); g.rotate(airTilt); g.translate(-carX, -(carY - carW * 0.25)); }
      if (phase === "crash") { g.translate(carX, carY - carW * 0.25); g.rotate(Math.sin(crashT * 9) * 0.25 * Math.max(0, 1 - crashT)); g.translate(-carX, -(carY - carW * 0.25)); }
      drawCar(g, carX, carY, carW, look, { t, lean, brake: phase === "crash" || phase === "count", nitro: nitroT > 0, smoke: phase === "crash" ? 1 : skid > 0.25 ? skid : 0, bounce: speed > 10 });
      g.restore();

      // קווי מהירות בטורבו
      if (nitroT > 0) {
        g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2;
        for (let q = 0; q < 26; q++) {
          const a = (q / 26) * Math.PI * 2 + t * 0.7, r1 = Math.min(W, H) * (0.35 + ((t * 3 + q * 0.13) % 1) * 0.5);
          g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * r1, H * 0.45 + Math.sin(a) * r1 * 0.6); g.lineTo(W / 2 + Math.cos(a) * (r1 + 60), H * 0.45 + Math.sin(a) * (r1 + 60) * 0.6); g.stroke();
        }
      }
      // ניצוצות הנחיתה
      sparks.forEach(sp => { g.fillStyle = `rgba(255,${180 + Math.random() * 60 | 0},60,${Math.min(1, sp.life * 2)})`; g.fillRect(sp.x, sp.y, 3, 3); });
      // זום לתא הנהג: עיגול שנפתח מהמכונית ובתוכו תא הנהג
      if (zoom > 0) {
        const R = Math.hypot(W, H) * zoom, zx = carX + (W / 2 - carX) * zoom, zy = carY - carW * 0.4 + (H / 2 - carY + carW * 0.4) * zoom;
        g.save(); g.beginPath(); g.arc(zx, zy, Math.max(1, R), 0, 7); g.clip();
        drawCockpit(t);
        g.restore();
        if (zoom < 1) { g.strokeStyle = "#fff"; g.lineWidth = 6; g.beginPath(); g.arc(zx, zy, Math.max(1, R), 0, 7); g.stroke(); }
      }
      if (phase === "cockpit") {
        // שעון: פס שהולך ומתקצר, ודופק אדום בשוליים
        const left = Math.max(0, 1 - phaseT / RAMP_T);
        g.fillStyle = "rgba(0,0,0,.45)"; rr(g, W * 0.15, H * 0.05, W * 0.7, 12, 6); g.fill();
        g.fillStyle = left < 0.35 ? "#ef4444" : "#facc15"; rr(g, W * 0.15, H * 0.05, W * 0.7 * left, 12, 6); g.fill();
        g.fillStyle = "#fff"; g.font = `800 ${Math.max(14, Math.min(22, W / 22))}px Rubik, sans-serif`; g.textAlign = "center"; g.textBaseline = "top";
        try { g.direction = "rtl"; } catch (e) { /* ignore */ }
        g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 6;
        g.fillText(chosen || laneName !== "mid" ? "אפשר עוד לשנות... ⏳" : "הטו את הגוף לצד המקור הנכון!", W / 2, H * 0.05 + 20);
        g.shadowBlur = 0; g.direction = "ltr";
        const pulse = Math.max(0, Math.sin(phaseT * Math.PI * (1.6 + phaseT * 0.5)));
        const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
        vg.addColorStop(0, "rgba(220,38,38,0)"); vg.addColorStop(1, `rgba(220,38,38,${0.15 + 0.25 * pulse})`);
        g.fillStyle = vg; g.fillRect(0, 0, W, H);
      }
      if (flash > 0) { g.fillStyle = phase === "crash" ? `rgba(255,80,40,${flash})` : `rgba(255,255,255,${flash})`; g.fillRect(0, 0, W, H); }
      return { skid, speed01 };
    }

    function frame(now) {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      const t = now / 1000;
      phaseT += dt;
      if (phase === "count") {
        // ספירה לאחור: 3, 2, 1, יוצאים!
        const c = 3 - Math.floor(phaseT);
        if (c !== clock) { clock = c; if (c > 0) { ui.banner(String(c), "count"); snd.beep(false); } else { ui.banner("צא!", "go"); snd.beep(true); } }
        if (phaseT >= 3) { phase = "drive"; newGate(); }
      } else if (phase === "turbo") {
        target = baseV * 2.6 * boost;
        if (phaseT >= 1.8) { phase = "drive"; newGate(); }
      } else if (phase === "pause") {
        if (phaseT >= 1.2) { phase = "drive"; newGate(); }
      } else if (phase === "jump") {
        // עולים באוויר, הכל מאט, והמצלמה נכנסת לתא הנהג
        lift = Math.min(1, phaseT / 0.7); lift = 1 - (1 - lift) * (1 - lift);
        slow = Math.max(0.15, 1 - phaseT * 1.3);
        zoom = Math.max(0, Math.min(1, (phaseT - 0.55) / 0.45));
        if (phaseT >= 1.0) enterCockpit();
      } else if (phase === "cockpit") {
        slow = 0.12; lift = 1;
        if (laneName !== "mid" && !choseT) choseT = phaseT;
        beatT -= dt;
        if (beatT <= 0) { snd.heart(); beatT = Math.max(0.35, 0.85 - phaseT * 0.1); }
        if (phaseT >= RAMP_T || (choseT && phaseT - choseT >= 1.6 && laneName !== "mid")) leaveCockpit();
      } else if (phase === "fall") {
        // יוצאים מהזום, המכונית נוטה לצד שנבחר ונוחתת
        zoom = Math.max(0, 1 - phaseT / 0.45);
        const dir = chosen === "left" ? -1 : chosen === "right" ? 1 : 0;
        airTilt = dir * 0.22 * Math.sin(Math.min(1, phaseT / 1.1) * Math.PI);
        lift = phaseT < 0.45 ? 1 : Math.max(0, 1 - Math.pow((phaseT - 0.45) / 0.65, 2));
        slow = Math.min(1, 0.12 + phaseT * 0.8);
        if (phaseT >= 1.1) { airTilt = 0; landed(); }
      } else if (phase === "landed") {
        slow = 1;
        if (phaseT >= 0.7) resolveRamp();
      }
      if (phase !== "jump" && phase !== "cockpit" && phase !== "fall") slow = 1;
      bodyLean += ((laneName === "left" ? -0.38 : laneName === "right" ? 0.38 : 0) - bodyLean) * Math.min(1, dt * 7);
      shake = Math.max(0, shake - dt * 1.2);
      for (let q = sparks.length - 1; q >= 0; q--) { const sp = sparks[q]; sp.life -= dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 900 * dt; if (sp.life <= 0) sparks.splice(q, 1); }
      if (phase !== "count" && phase !== "crash" && phase !== "cockpit") raceT += dt;
      // מהירות: מאיצים ובולמים בהדרגה
      const acc = phase === "crash" || target < speed ? 3 : phase === "turbo" ? 2.2 : 1.6;
      speed += (target - speed) * Math.min(1, dt * acc);
      if (phase === "crash") speed *= Math.max(0, 1 - dt * 2.5);
      pos += speed * dt * slow;
      // מעבר בין נתיבים, ונטייה של המכונית בפנייה ובהחלפת נתיב
      const goal = LANE_X[laneName], dpx = goal - px;
      px += dpx * Math.min(1, dt * 9);
      const curNow = segAt(pos + PLAYER_Z).curve;
      lean += ((curNow * 0.25 * Math.min(1, speed / baseV)) + dpx * 3 - lean) * Math.min(1, dt * 6);
      bgX -= curNow * speed * dt * 0.0035;
      nitroT = Math.max(0, nitroT - dt); flash = Math.max(0, flash - dt * 1.5);
      // מתחרים: נוסעים קדימה, ומפנים את הנתיב כשהשחקן מתקרב מאחור
      RIVALS.forEach(r => {
        r.v += (baseV * r.mul * (phase === "count" ? 0 : 1) - r.v) * Math.min(1, dt * 0.8);
        r.z += (r.v - speed) * dt * slow;
        if (r.z > PLAYER_Z && r.z < PLAYER_Z + 3500 && Math.abs(r.x - px) < 0.45) r.tx = px > 0 ? -0.5 : 0.5;
        r.x += (r.tx - r.x) * Math.min(1, dt * 2.5);
        const ahead = r.z > PLAYER_Z;
        if (r.ahead && !ahead && phase !== "count") snd.whoosh();
        r.ahead = ahead;
      });
      // הגענו לשער?
      if (phase === "drive" && gateZ != null && pos + PLAYER_Z >= gateZ) { if (ramp) startJump(); else passGate(); }
      if (phase === "crash") { crashT += dt; if (crashT > 1.6 && !ended) { ended = true; ui.end(score, gates); return; } }
      const r = render(t);
      const kmh = Math.round(kmhOf(speed));
      const place = 1 + RIVALS.filter(x2 => x2.z > PLAYER_Z).length;
      const dist = gateZ != null ? Math.max(0, Math.min(1, 1 - (gateZ - pos - PLAYER_Z) / GATE_DIST)) : (phase === "turbo" ? 1 : 0);
      ui.hud({ kmh, place, of: RIVALS.length + 1, lapPct: Math.round(((score % 10) + dist * (phase === "drive" ? 1 : 0)) * 10), time: raceT, shield, lane: laneName });
      snd.update(phase === "cockpit" ? kmh * 0.3 : kmh, r.speed01 * slow, phase === "crash" || lift > 0 ? 0 : r.skid, nitroT > 0);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return {
      steer, setLane,
      get lane() { return laneName; },
      toggleSound: () => snd.toggle(),
      get soundOn() { return snd.on; },
      stop() { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); snd.stop(); },
    };
  }

  // מכונית קטנה לתצוגה במוסך
  function preview(canvas, look) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth || 96, h = canvas.clientHeight || 60;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const g = canvas.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCar(g, w / 2, h - 4, Math.min(w * 0.8, h * 1.2), look, {});
  }

  window.TeireRace = { start, preview, drawCar };
})();
