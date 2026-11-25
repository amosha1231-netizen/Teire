// מהירות המשחק בטלפון.
// 1. מצב חסכוני: בטלפון שמתקשה (פחות מ-40 פריימים בשנייה במפה) עוצרים את התנועה הקישוטית של המפה
//    (גלים, קצף, עננים, ניצוצות, ציפורים) ומקטינים מעט את הרזולוציה במרוץ. המפה נשארת אותה מפה.
//    אפשר לבחור בתפריט: אוטומטי (ברירת המחדל), תמיד פועל, או כבוי.
// 2. אנימציות שמחוץ למסך נעצרות, כדי שהטלפון לא יעבוד על מה שלא רואים.
(function () {
  const KEY = "teire.lite";
  const MODES = ["auto", "on", "off"];
  let mode = "auto", slow = false;
  try { const m = localStorage.getItem(KEY); if (MODES.includes(m)) mode = m; } catch (e) { /* ignore */ }
  // מכשיר חלש מאוד (מעט ליבות או זיכרון): מתחילים חסכוני מיד, בלי לחכות למדידה
  try { if ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 2)) slow = true; } catch (e) { /* ignore */ }
  // מי שביקש פחות תנועה בהגדרות הטלפון מקבל את אותו מצב
  try { if (matchMedia("(prefers-reduced-motion: reduce)").matches) slow = true; } catch (e) { /* ignore */ }

  const lite = () => mode === "on" || (mode === "auto" && slow);
  const listeners = [];
  function apply() {
    document.documentElement.classList.toggle("lite", lite());
    listeners.forEach(fn => { try { fn(lite()); } catch (e) { /* ignore */ } });
  }
  apply();

  // ---- מדידת קצב הפריימים ----
  // מודדים 2.5 שניות כשהמפה פתוחה. החציון עמיד לפריים איטי אחד (למשל בזמן טעינה).
  let probing = false, probes = 0;
  function probe() {
    if (mode !== "auto" || slow || probing || probes >= 3 || document.hidden) return;
    probing = true; probes++;
    const gaps = [];
    let last = 0, t0 = 0;
    const step = t => {
      if (document.hidden) { probing = false; return; } // יצאו מהאפליקציה באמצע: מודדים בפעם אחרת
      if (last) gaps.push(t - last); else t0 = t;
      last = t;
      if (t - t0 < 2500) return void requestAnimationFrame(step);
      probing = false;
      if (gaps.length < 20) return;
      gaps.sort((a, b) => a - b);
      const median = gaps[gaps.length >> 1];
      if (median > 25) { slow = true; probes = 99; apply(); } // פחות מ-40 פריימים בשנייה
    };
    // מחכים רגע שהמפה תסיים להיטען לפני שמודדים
    setTimeout(() => requestAnimationFrame(step), 1200);
  }

  // ---- עצירת אנימציות מחוץ למסך ----
  // מקבלים את המסגרת שרואים (למשל המפה) ועוצרים את מה שזז בתוכה כשהוא לא על המסך
  function watch(frame, selector) {
    if (!window.IntersectionObserver || !frame) return { stop() {} };
    const io = new IntersectionObserver(list => {
      list.forEach(e => e.target.classList.toggle("off-screen", !e.isIntersecting));
    }, { root: frame, rootMargin: "120px" });
    frame.querySelectorAll(selector).forEach(el => io.observe(el));
    return { stop() { io.disconnect(); } };
  }

  // ---- רזולוציה מסתגלת לציור בקנבס (המרוץ) ----
  // מתחילים ברזולוציה מלאה (עד פי 2). אם הפריימים איטיים לאורך שנייה, יורדים בשלב, ולא חוזרים למעלה
  // (כדי שהתמונה לא תקפוץ הלוך וחזור). במצב חסכוני מתחילים מ-1.5.
  function canvasScale() {
    const full = Math.min(window.devicePixelRatio || 1, 2);
    let dpr = lite() ? Math.min(full, 1.5) : full;
    let sum = 0, n = 0, warm = 1.5, bad = 0;
    return {
      get dpr() { return dpr; },
      // dt בשניות. מחזיר true אם צריך לשנות את גודל הקנבס.
      // השנייה וחצי הראשונות לא נספרות (טעינה), וצריך שתי שניות איטיות ברצף כדי לרדת שלב
      frame(dt) {
        if (document.hidden || dt <= 0 || dt > 0.25) return false;
        if (warm > 0) { warm -= dt; return false; }
        sum += dt; n++;
        if (sum < 1) return false;
        const avg = sum / n; sum = 0; n = 0;
        bad = avg > 1 / 45 ? bad + 1 : 0;
        if (bad >= 2 && dpr > 1) { bad = 0; dpr = Math.max(1, Math.round((dpr - 0.25) * 4) / 4); return true; }
        return false;
      },
    };
  }

  window.TeirePerf = {
    get lite() { return lite(); },
    get mode() { return mode; },
    setMode(m) {
      if (!MODES.includes(m)) return;
      mode = m;
      try { localStorage.setItem(KEY, m); } catch (e) { /* ignore */ }
      if (m === "auto") probes = 0;
      apply();
    },
    // לסבב בתפריט: אוטומטי -> פועל -> כבוי -> אוטומטי
    next() { this.setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]); return mode; },
    onChange(fn) { listeners.push(fn); },
    probe, watch, canvasScale,
  };
})();
