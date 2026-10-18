// סגירת האתר בשבת ובחג, לפי זמני השקיעה וצאת הכוכבים במיקום של המשתמש.
// החישוב נעשה בדפדפן (בלי שרת): שקיעה לפי נוסחת השמש, צאת הכוכבים כשהשמש 8.5° מתחת לאופק.
(function () {
  const LKEY = "teire.location.v1";
  const CITIES = [
    { name: "ירושלים", lat: 31.778, lon: 35.235, tz: ["Asia/Jerusalem", "Asia/Tel_Aviv"] },
    { name: "תל אביב", lat: 32.085, lon: 34.781 },
    { name: "חיפה", lat: 32.794, lon: 34.99 },
    { name: "באר שבע", lat: 31.252, lon: 34.791 },
    { name: "צפת", lat: 32.965, lon: 35.496 },
    { name: "ניו יורק", lat: 40.713, lon: -74.006, tz: ["America/New_York", "America/Detroit", "America/Toronto"] },
    { name: "מונטריאול", lat: 45.502, lon: -73.567, tz: ["America/Montreal"] },
    { name: "שיקגו", lat: 41.878, lon: -87.63, tz: ["America/Chicago"] },
    { name: "לוס אנג'לס", lat: 34.052, lon: -118.244, tz: ["America/Los_Angeles"] },
    { name: "מיאמי", lat: 25.762, lon: -80.192 },
    { name: "לונדון", lat: 51.507, lon: -0.128, tz: ["Europe/London"] },
    { name: "פריז", lat: 48.857, lon: 2.352, tz: ["Europe/Paris"] },
    { name: "אנטוורפן", lat: 51.219, lon: 4.402, tz: ["Europe/Brussels"] },
    { name: "אמסטרדם", lat: 52.37, lon: 4.895, tz: ["Europe/Amsterdam"] },
    { name: "ברלין", lat: 52.52, lon: 13.405, tz: ["Europe/Berlin"] },
    { name: "מוסקבה", lat: 55.756, lon: 37.617, tz: ["Europe/Moscow"] },
    { name: "קייב", lat: 50.45, lon: 30.523, tz: ["Europe/Kiev", "Europe/Kyiv"] },
    { name: "יוהנסבורג", lat: -26.204, lon: 28.047, tz: ["Africa/Johannesburg"] },
    { name: "בואנוס איירס", lat: -34.604, lon: -58.382, tz: ["America/Argentina/Buenos_Aires"] },
    { name: "סאו פאולו", lat: -23.551, lon: -46.633, tz: ["America/Sao_Paulo"] },
    { name: "מקסיקו סיטי", lat: 19.433, lon: -99.133, tz: ["America/Mexico_City"] },
    { name: "סידני", lat: -33.869, lon: 151.209, tz: ["Australia/Sydney"] },
    { name: "מלבורן", lat: -37.814, lon: 144.963, tz: ["Australia/Melbourne"] },
  ];

  function guessLocation() {
    let tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* ignore */ }
    const c = CITIES.find(c => c.tz && c.tz.includes(tz));
    if (c) return { name: c.name, lat: c.lat, lon: c.lon };
    // אזור זמן לא מוכר: הערכה גסה לפי הפרש השעות
    return { name: "לפי אזור הזמן", lat: 35, lon: -new Date().getTimezoneOffset() / 4 };
  }

  function getLocation() {
    try { const s = JSON.parse(localStorage.getItem(LKEY)); if (s && typeof s.lat === "number") return s; } catch (e) { /* ignore */ }
    return guessLocation();
  }
  function setLocation(loc) {
    try { localStorage.setItem(LKEY, JSON.stringify(loc)); } catch (e) { /* ignore */ }
  }
  const inIsrael = loc => loc.lat > 29.4 && loc.lat < 33.4 && loc.lon > 34.2 && loc.lon < 35.9;
  const nearJerusalem = loc => Math.abs(loc.lat - 31.778) < .15 && Math.abs(loc.lon - 35.235) < .2;

  // זמן שהשמש נמצאת angle מעלות מתחת לאופק (בערב), ליום אזרחי y-m-d
  function sunsetAt(y, m, d, lat, lon, angle) {
    const rad = Math.PI / 180;
    const jdNoon = Date.UTC(y, m, d, 12) / 86400000 + 2440587.5;
    const n = Math.round(jdNoon - 2451545 + .0008);
    const J = n - lon / 360;
    const M = (357.5291 + .98560028 * J) % 360;
    const C = 1.9148 * Math.sin(M * rad) + .02 * Math.sin(2 * M * rad) + .0003 * Math.sin(3 * M * rad);
    const L = (M + C + 180 + 102.9372) % 360;
    const transit = 2451545 + J + .0053 * Math.sin(M * rad) - .0069 * Math.sin(2 * L * rad);
    const decl = Math.asin(Math.sin(L * rad) * Math.sin(23.4397 * rad));
    const cosW = (Math.sin(-angle * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
    const w = Math.acos(Math.max(-1, Math.min(1, cosW))) / rad;
    return new Date((transit + w / 360 - 2440587.5) * 86400000);
  }

  // ימים טובים (היום עצמו, לא הערב שלפניו)
  const hebFmt = (() => { try { return new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long", timeZone: "UTC" }); } catch (e) { return null; } })();
  const YT_ISRAEL = { Tishri: [1, 2, 10, 15, 22], Nisan: [15, 21], Sivan: [6] };
  const YT_ABROAD = { Tishri: [1, 2, 10, 15, 16, 22, 23], Nisan: [15, 16, 21, 22], Sivan: [6, 7] };
  const YT_NAMES = { "Tishri-1": "ראש השנה", "Tishri-2": "ראש השנה", "Tishri-10": "יום כיפור", "Tishri-15": "סוכות", "Tishri-16": "סוכות", "Tishri-22": "שמיני עצרת", "Tishri-23": "שמחת תורה", "Nisan-15": "פסח", "Nisan-16": "פסח", "Nisan-21": "שביעי של פסח", "Nisan-22": "אחרון של פסח", "Sivan-6": "שבועות", "Sivan-7": "שבועות" };

  // מה קדוש ביום האזרחי הזה? מחזיר שם או null
  function holyName(y, m, d, loc) {
    const date = new Date(Date.UTC(y, m, d, 12));
    let yt = null;
    if (hebFmt) {
      const parts = hebFmt.formatToParts(date);
      const day = Number(parts.find(p => p.type === "day").value), month = parts.find(p => p.type === "month").value;
      const table = inIsrael(loc) ? YT_ISRAEL : YT_ABROAD;
      if (table[month] && table[month].includes(day)) yt = YT_NAMES[month + "-" + day] || "יום טוב";
    }
    if (date.getUTCDay() === 6) return yt ? "שבת ו" + yt : "שבת";
    return yt;
  }

  // התקופה הקדושה של יום אזרחי: מלפני השקיעה בערב הקודם ועד צאת הכוכבים
  function windowFor(y, m, d, loc) {
    const before = nearJerusalem(loc) ? 40 : 30;
    const prev = new Date(Date.UTC(y, m, d - 1, 12));
    const start = new Date(sunsetAt(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate(), loc.lat, loc.lon, .833) - before * 60000);
    const end = sunsetAt(y, m, d, loc.lat, loc.lon, 8.5);
    return { start, end };
  }

  // מצב עכשיו: { closed, name, start, end } או { closed:false, next:{name,start} } אם שבת/חג נכנסים בקרוב
  function status(now) {
    now = now || new Date();
    const loc = getLocation();
    const base = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
    const day = k => { const x = new Date(base.getTime() + k * 86400000); return [x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()]; };
    for (let k = -1; k <= 8; k++) {
      const [y, m, d] = day(k);
      const name = holyName(y, m, d, loc);
      if (!name) continue;
      const w = windowFor(y, m, d, loc);
      if (now >= w.start && now < w.end) {
        // ימים קדושים רצופים (למשל חג ואחריו שבת): הסוף הוא צאת הכוכבים של האחרון
        let end = w.end, j = k + 1;
        while (j <= k + 3) { const [y2, m2, d2] = day(j); if (!holyName(y2, m2, d2, loc)) break; end = windowFor(y2, m2, d2, loc).end; j++; }
        return { closed: true, name, start: w.start, end, loc };
      }
      if (now < w.start) return { closed: false, next: { name, start: w.start }, loc };
    }
    return { closed: false, loc };
  }

  window.TeireShabbat = { status, getLocation, setLocation, CITIES, sunsetAt };
})();
