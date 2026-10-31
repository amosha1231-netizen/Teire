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
  const GATE_DIST = 70 * SEG; // השער נולד במרחק הזה מהמכונית
  // הנתיבים: שמאל, אמצע (בין הנתיבים), ימין. ביחידות של חצי רוחב הכביש
  const LANE_X = { left: -0.5, mid: 0, right: 0.5 };

  function buildTrack() {
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
      if (s.i % 3 === 0) s.sprites.push({ kind: "tree", x: -(1.55 + Math.random() * 1.8), s: 0.8 + Math.random() * 0.6 });
      if (s.i % 3 === 1) s.sprites.push({ kind: "tree", x: 1.55 + Math.random() * 1.8, s: 0.8 + Math.random() * 0.6 });
      if (s.i % 17 === 5) s.sprites.push({ kind: "rock", x: (Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random()), s: 1 });
      if (s.sharp && s.i % 4 === 0) s.sprites.push({ kind: "chevron", x: s.curve > 0 ? 1.28 : -1.28, dir: s.curve > 0 ? 1 : -1 });
    });
    return segs;
  }

  function start(opts) {
    const { root, look, boost = 1, shield: shield0 = 0, deck, sidesFor, ui } = opts;
    const canvas = root.querySelector("canvas"), g = canvas.getContext("2d");
    const segs = buildTrack(), trackLen = N * SEG;
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
      item = deck[k++ % deck.length]; sides = sidesFor(item);
      gateZ = pos + PLAYER_Z + GATE_DIST;
      target = GATE_DIST / (durFor(score) / 1000);
      ui.question(item, sides);
    }
    function steer(s) {
      if (phase === "crash" || ended) return;
      laneName = laneName === "mid" ? s : (laneName === s ? s : "mid"); // מהצד השני חוזרים קודם לאמצע
    }
    // הג'ויסטיק בוחר נתיב ישירות: שמאל, אמצע או ימין
    function setLane(s) {
      if (phase === "crash" || ended || !LANE_X.hasOwnProperty(s)) return;
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

    function render(t) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const base = segAt(pos), basePct = (pos % SEG) / SEG;
      const pSeg = segAt(pos + PLAYER_Z), pPct = ((pos + PLAYER_Z) % SEG) / SEG;
      const playerY = pSeg.y1 + (pSeg.y2 - pSeg.y1) * pPct;
      const camX = px * ROAD_W * 0.55, camY = playerY + CAM_H;
      // שמיים, הרים ויער רחוק שזזים בפניות
      const sky = g.createLinearGradient(0, 0, 0, H * 0.6);
      sky.addColorStop(0, "#4f9ee0"); sky.addColorStop(0.6, "#a9d4f2"); sky.addColorStop(1, "#e8f3f8");
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
      ridge(H * 0.16, 0.006, 1, "#8fb3c9", 0.2);
      ridge(H * 0.1, 0.013, 3, "#4e7d5b", 0.45);
      ridge(H * 0.05, 0.03, 0, "#2f6a40", 0.8);

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
        g.fillStyle = s.dark ? "#3f8a3a" : "#4a9a42"; g.fillRect(0, p2.y, W, p1.y - p2.y + 1);
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
        if (fog > 0.55) { g.fillStyle = `rgba(232,243,248,${(fog - 0.55) * 1.6})`; g.fillRect(0, p2.y, W, p1.y - p2.y + 1); }
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
          const h = p.sc * (th.sp.kind === "tree" ? 1700 * th.sp.s : th.sp.kind === "rock" ? 380 : 520) * H / 2;
          g.save(); g.beginPath(); g.rect(0, 0, W, th.s.clip); g.clip();
          if (th.sp.kind === "tree") drawTree(sx, sy, h, th.sp.s);
          else if (th.sp.kind === "rock") { g.fillStyle = "#8b8378"; g.beginPath(); g.ellipse(sx, sy - h * 0.35, h * 0.8, h * 0.45, 0, 0, 7); g.fill(); }
          else drawChevron(sx, sy, h, th.sp.dir);
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
        if (th.gate) drawGate(p, sides || {});
        else drawCar(g, p.x + p.w * th.rival.x, p.y, p.w * 0.55, th.rival.look, { t, lean: s.curve * 0.3 });
        g.restore();
      });

      // המכונית של השחקן
      const sc0 = CAM_D / PLAYER_Z, carW = Math.min(W * 0.36, sc0 * ROAD_W * W / 2 * 0.55);
      const carX = W / 2 + sc0 * (px * ROAD_W - camX) * W / 2;
      let carY = H - Math.max(14, H * 0.06);
      const speed01 = Math.min(1, speed / (baseV * 2.4));
      const skid = Math.min(1, Math.abs(pSeg.curve) / 7) * speed01 * (pSeg.sharp ? 1 : 0.35);
      g.save();
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
      }
      if (phase !== "count" && phase !== "crash") raceT += dt;
      // מהירות: מאיצים ובולמים בהדרגה
      const acc = phase === "crash" || target < speed ? 3 : phase === "turbo" ? 2.2 : 1.6;
      speed += (target - speed) * Math.min(1, dt * acc);
      if (phase === "crash") speed *= Math.max(0, 1 - dt * 2.5);
      pos += speed * dt;
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
        r.z += (r.v - speed) * dt;
        if (r.z > PLAYER_Z && r.z < PLAYER_Z + 3500 && Math.abs(r.x - px) < 0.45) r.tx = px > 0 ? -0.5 : 0.5;
        r.x += (r.tx - r.x) * Math.min(1, dt * 2.5);
        const ahead = r.z > PLAYER_Z;
        if (r.ahead && !ahead && phase !== "count") snd.whoosh();
        r.ahead = ahead;
      });
      // הגענו לשער?
      if (phase === "drive" && gateZ != null && pos + PLAYER_Z >= gateZ) passGate();
      if (phase === "crash") { crashT += dt; if (crashT > 1.6 && !ended) { ended = true; ui.end(score); return; } }
      const r = render(t);
      const kmh = Math.round(kmhOf(speed));
      const place = 1 + RIVALS.filter(x2 => x2.z > PLAYER_Z).length;
      const dist = gateZ != null ? Math.max(0, Math.min(1, 1 - (gateZ - pos - PLAYER_Z) / GATE_DIST)) : (phase === "turbo" ? 1 : 0);
      ui.hud({ kmh, place, of: RIVALS.length + 1, lapPct: Math.round(((score % 10) + dist * (phase === "drive" ? 1 : 0)) * 10), time: raceT, shield, lane: laneName });
      snd.update(kmh, r.speed01, phase === "crash" ? 0 : r.skid, nitroT > 0);
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
