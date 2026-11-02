// כלי רכב לפרס: מי שמגיע למספר כוכבים מסוים מקבל כלי רכב ליום שלם (24 שעות).
// ככל שההישג גדול יותר, הרכב מפואר ומהיר יותר. ברכב הדמות זזה מהר יותר במפה ובעולמות שבתוך הערים.
// אחרי שהיום נגמר: כל משימה מושלמת (3 כוכבים) מחזירה את הרכב הכי טוב שהשגתם לעוד 24 שעות.
// הנתונים נשמרים בשחקן עצמו (player.ride, player.ridesEarned), ולכן נשמרים גם בשרת עם שאר ההתקדמות.
(function () {
  const DAY = 24 * 60 * 60 * 1000;

  // stars = כמה כוכבים צריך בסך הכול. speed = פי כמה מהר מההליכה הרגילה. tier = צבע הקלף כשמקבלים.
  const RIDES = [
    { id: "carriage", name: "כרכרה", icon: "🐎", stars: 10, speed: 1.4, tier: "bronze", note: "סוס וכרכרת עץ. נוסעים לאט אבל בסטייל." },
    { id: "car", name: "מכונית", icon: "🚗", stars: 30, speed: 1.8, tier: "silver", note: "מכונית משפחתית כחולה, מהירה פי 1.8 מהליכה." },
    { id: "lux", name: "רכב מפואר", icon: "🚘", stars: 60, speed: 2.2, tier: "gold", note: "רכב שחור מבריק עם חישוקי זהב." },
    { id: "limo", name: "לימוזינה לבנה", icon: "🤍", stars: 100, speed: 2.6, tier: "gold", note: "לימוזינה ארוכה, כמו של חתן בדרך לחופה." },
    { id: "fire", name: "מרכבת אש", icon: "🔥", stars: 160, speed: 3.2, tier: "special", note: "\"והנה רכב אש וסוסי אש\" (מלכים ב ב, יא). מרכבה של אליהו הנביא." },
  ];
  const byId = id => RIDES.find(r => r.id === id);

  // הרכב הכי טוב שמגיע לפי מספר הכוכבים
  const bestFor = stars => RIDES.filter(r => stars >= r.stars).pop() || null;
  const nextFor = stars => RIDES.find(r => stars < r.stars) || null;

  // הרכב הפעיל עכשיו (או null אם אין, או שהיום נגמר)
  function active(player, now = Date.now()) {
    const r = player.ride;
    if (!r || !(r.until > now)) return null;
    const ride = byId(r.id);
    return ride ? { ...ride, until: r.until } : null;
  }

  // בודק אם הגיעו לרכב חדש. מחזיר את הרכב החדש (כדי להציג קלף), או null.
  // שחקן ותיק שכבר עבר כמה ספים בבת אחת מקבל רק את הגבוה ביניהם, והשאר נרשמים כ"הושגו".
  function check(player, stars, now = Date.now()) {
    player.ridesEarned = player.ridesEarned || [];
    const fresh = RIDES.filter(r => stars >= r.stars && !player.ridesEarned.includes(r.id));
    if (!fresh.length) return null;
    fresh.forEach(r => player.ridesEarned.push(r.id));
    const top = fresh[fresh.length - 1];
    const cur = active(player, now);
    // רכב חדש מחליף את הנוכחי רק אם הוא טוב יותר (וזה תמיד כך, כי הספים עולים)
    if (!cur || RIDES.indexOf(top) >= RIDES.indexOf(byId(cur.id))) player.ride = { id: top.id, until: now + DAY };
    return top;
  }

  // משימה מושלמת: אם אין רכב פעיל, מקבלים שוב את הרכב הכי טוב שהשגתם. מחזיר את הרכב, או null.
  function renew(player, stars, now = Date.now()) {
    if (active(player, now)) return null;
    const best = bestFor(stars);
    // רכב שעוד לא קיבלו בפעם הראשונה מגיע דרך check, עם קלף של "רכב חדש"
    if (!best || !(player.ridesEarned || []).includes(best.id)) return null;
    player.ride = { id: best.id, until: now + DAY };
    return best;
  }

  // כמה זמן נשאר, כטקסט קצר: "23:41" או "12 דק׳"
  function left(until, now = Date.now()) {
    const m = Math.max(0, Math.ceil((until - now) / 60000));
    if (m < 60) return m + " דק׳";
    const h = Math.floor(m / 60), mm = m % 60;
    return h + ":" + String(mm).padStart(2, "0");
  }

  // ציור הרכב מהצד, פונה ימינה. הדמות יושבת מעליו (ב-app.js), והרכב מכסה את החצי התחתון שלה.
  const wheel = (cx, cy, r, rim = "#cbd5e1", tire = "#1f2937") =>
    `<g class="rd-wheel"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${tire}"/><circle cx="${cx}" cy="${cy}" r="${r * .55}" fill="${rim}"/><path d="M${cx - r * .5} ${cy}h${r}M${cx} ${cy - r * .5}v${r}" stroke="${tire}" stroke-width="1.5"/></g>`;
  const ART = {
    carriage: () => `
      <path d="M8 36 q-4 -14 6 -20 l4 -8 l4 6 q10 2 12 12 l-4 4 q-4 -6 -10 -6 l-2 12z" fill="#8b5a2b"/>
      <path d="M12 10 l-4 -6 M14 8 l-2 -7" stroke="#5b3a1a" stroke-width="2" stroke-linecap="round"/>
      <circle cx="18" cy="16" r="1.4" fill="#111"/>
      <path d="M12 36 v8 M20 34 v10" stroke="#8b5a2b" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M30 26 h12" stroke="#5b3a1a" stroke-width="2"/>
      <path d="M40 14 h44 q4 0 4 4 v18 h-48z" fill="#b45309" stroke="#78350f" stroke-width="2"/>
      <path d="M44 18 h36 v10 h-36z" fill="#fcd34d" opacity=".55"/>
      <path d="M38 14 q26 -12 52 0" fill="none" stroke="#78350f" stroke-width="3"/>
      ${wheel(50, 40, 8, "#d6a65a", "#5b3a1a")}${wheel(78, 40, 8, "#d6a65a", "#5b3a1a")}`,
    car: () => `
      <path d="M8 34 q0 -10 10 -12 l14 -2 l12 -12 h26 l14 12 q12 2 12 12 v6 h-88z" fill="#2563eb" stroke="#1e3a8a" stroke-width="2"/>
      <path d="M36 21 l10 -10 h10 v10z M60 11 h9 l10 10 h-19z" fill="#bfdbfe"/>
      <rect x="88" y="27" width="6" height="4" rx="1" fill="#fde047"/>
      <rect x="8" y="27" width="5" height="4" rx="1" fill="#ef4444"/>
      ${wheel(28, 40, 8)}${wheel(76, 40, 8)}`,
    lux: () => `
      <path d="M4 34 q0 -9 12 -11 l18 -3 l12 -10 h28 l16 10 q16 2 16 12 v6 h-102z" fill="#111827" stroke="#000" stroke-width="2"/>
      <path d="M38 20 l9 -8 h11 v8z M62 12 h11 l12 8 h-23z" fill="#94a3b8"/>
      <path d="M8 30 h96" stroke="#fbbf24" stroke-width="1.6"/>
      <rect x="99" y="25" width="7" height="4" rx="1" fill="#fff"/>
      ${wheel(26, 40, 8, "#fbbf24", "#0b0f19")}${wheel(84, 40, 8, "#fbbf24", "#0b0f19")}`,
    limo: () => `
      <path d="M2 34 q0 -9 12 -11 l14 -2 l10 -9 h70 l14 9 q14 2 14 12 v7 h-134z" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
      <path d="M34 20 l8 -6 h16 v6z M62 14 h18 v6 h-18z M84 14 h20 l10 6 h-30z" fill="#1e293b"/>
      <path d="M6 30 h126" stroke="#cbd5e1" stroke-width="1.6"/>
      <path d="M58 6 q4 -6 8 0 q4 -6 8 0 l-8 8z" fill="#f472b6"/>
      ${wheel(24, 41, 8, "#e2e8f0")}${wheel(112, 41, 8, "#e2e8f0")}`,
    fire: () => `
      <path class="rd-flame" d="M2 30 q6 -18 14 -10 q2 -14 12 -6 q6 -12 12 2 l-10 18z" fill="#f97316"/>
      <path class="rd-flame" d="M6 30 q6 -10 10 -4 q4 -8 8 0 l-6 10z" fill="#fde047"/>
      <path d="M20 34 q-2 -14 8 -18 l4 -8 l4 6 q8 2 10 10 l-4 4 q-4 -4 -8 -4 l-2 12z" fill="#ef4444"/>
      <path d="M24 10 q-4 -10 4 -12 q-2 6 2 8" fill="#fbbf24"/>
      <circle cx="33" cy="15" r="1.4" fill="#fff"/>
      <path d="M48 14 h40 q6 0 6 6 v16 h-46z" fill="#facc15" stroke="#b45309" stroke-width="2"/>
      <path d="M52 18 h36 v8 h-36z" fill="#f97316" opacity=".6"/>
      ${wheel(58, 40, 8, "#fde047", "#b91c1c")}${wheel(86, 40, 8, "#fde047", "#b91c1c")}`,
  };
  const WIDTH = { carriage: 96, car: 104, lux: 114, limo: 140, fire: 104 };
  // seat = איפה יושבת הדמות (באחוזים מרוחב הרכב, מימין לשמאל לא משנה כי הכול מתהפך יחד)
  const SEAT = { carriage: 34, car: 58, lux: 56, limo: 46, fire: 28 };
  function svg(id, h = 50) {
    const w = WIDTH[id] || 100;
    // הכרכרה ומרכבת האש צוירו עם הסוס משמאל, ולכן הופכים אותן כדי שגם הן ייסעו ימינה כמו המכוניות
    const art = (ART[id] || ART.car)(), back = id === "carriage" || id === "fire";
    return `<svg class="ride-svg ride-${id}" width="${w * h / 50}" height="${h}" viewBox="0 0 ${w} 50" aria-hidden="true">${back ? `<g transform="translate(${w} 0) scale(-1 1)">${art}</g>` : art}</svg>`;
  }

  window.TeireRides = { DAY, RIDES, byId, bestFor, nextFor, active, check, renew, left, svg, SEAT };
})();
