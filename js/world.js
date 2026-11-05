// העולם: המקומות במפה, הדמויות המלוות, פריטי החנות וציור הדמות האישית.
(function () {
  // המקומות לפי סדר המסע. color = צבע הרקע של התחנה, guide = הדמות שמלווה בתחנה.
  const PLACES = [
    { id: "gan-eden", name: "גן עדן", icon: "🌳", color: "#7cc576", desc: "בריאת העולם ואדם וחוה",
      guide: { name: "ארי", emoji: "🦁", hello: "שלום! אני ארי. \"הוי גבור כארי\" - בואו נראה כמה אתם יודעים על בריאת העולם!" } },
    { id: "teiva", name: "תיבת נח", icon: "🌈", color: "#5fb6e8", desc: "המבול, התיבה והקשת",
      guide: { name: "יונה", emoji: "🕊️", hello: "שלום! אני היונה שהביאה את עלה הזית. מוכנים לעלות לתיבה?" } },
    { id: "ohel", name: "אוהל אברהם", icon: "⛺", color: "#e8b65f", desc: "האבות והאמהות",
      guide: { name: "גמלי", emoji: "🐪", hello: "ברוכים הבאים לאוהל של אברהם, הפתוח לכל ארבע הרוחות!" } },
    { id: "mitzrayim", name: "מצרים", icon: "🏺", color: "#e2895a", desc: "יוסף, משה ועשר המכות",
      guide: { name: "צפי", emoji: "🐸", hello: "קוואק! אני צפי מהמכה השנייה. בואו נצא ממצרים יחד!" } },
    { id: "sinai", name: "הר סיני", icon: "⛰️", color: "#9a8bd6", desc: "מתן תורה והלוחות",
      guide: { name: "נשרי", emoji: "🦅", hello: "\"ואשא אתכם על כנפי נשרים\" - עלו איתי להר סיני!" } },
    { id: "midbar", name: "המדבר", icon: "🏜️", color: "#d9a95b", desc: "המן, המרגלים והמשכן",
      guide: { name: "כבשי", emoji: "🐑", hello: "ארבעים שנה הלכנו במדבר. בואו נבדוק מה זכרתם מהדרך!" } },
    { id: "beit-midrash", name: "בית המדרש", icon: "📚", color: "#5a7fc4", desc: "משנה, גמרא ופרקי אבות",
      guide: { name: "ינשופי", emoji: "🦉", hello: "שלום לומדים! אני ינשופי. תא שמע, בואו נלמד גמרא!" } },
    { id: "beit-knesset", name: "בית הכנסת", icon: "🕍", color: "#c46a9a", desc: "ברכות, תפילה וחגים",
      guide: { name: "צביקה", emoji: "🦌", hello: "\"רץ כצבי לעשות רצון אביך שבשמים\" - בואו נרוץ לבית הכנסת!" } },
    // free = פתוח מההתחלה, bank = השאלות מגיעות מקובץ השלבים ולא ממסד הנתונים
    { id: "mishna", name: "מסע במשנה", icon: "📜", color: "#b45309", desc: "מי אמר מה, ובאיזו מסכת", free: true, bank: true,
      guide: { name: "דבורי", emoji: "🐝", hello: "בזזז! אני דבורי. דברי תורה מתוקים מדבש, בואו נטעם מהמשנה!" } },
    { id: "gemara", name: "מסע בגמרא", icon: "📖", color: "#0f766e", desc: "סיפורי הגמרא, מסכת ודף", free: true, bank: true,
      guide: { name: "נמלי", emoji: "🐜", hello: "\"לך אל נמלה עצל\" - אני נמלי, ואני לומדת דף אחרי דף. בואו נלמד יחד!" } },
    // home = לאן חוזרים (תחנות בתוך העולם של ירושלים)
    { id: "mikdash", name: "בית המקדש", icon: "🏛️", color: "#ca8a04", desc: "המקדש, הכהנים והעלייה לרגל", free: true, bank: true, home: "#/town/jerusalem",
      guide: { name: "תורי", emoji: "🐦", hello: "שלום! אני תורי, מ\"תורים ובני יונה\" שהביאו למקדש. בואו נלמד על בית המקדש!" } },
    { id: "david", name: "דוד המלך", icon: "👑", color: "#7c3aed", desc: "נעים זמירות ישראל", free: true, bank: true, home: "#/town/jerusalem",
      guide: { name: "דובי", emoji: "🐻", hello: "\"גם את הארי גם את הדוב הכה עבדך\". אני דובי, וטוב שדוד לא נלחם בי היום! בואו נלמד עליו."} },
    // הכוללים ב"קריית התורה"
    { id: "kollel-ovadia", name: "הכולל של הרב עובדיה יוסף", icon: "📘", color: "#1e3a8a", desc: "פסקי מרן הרב עובדיה", free: true, bank: true, home: "#/town/torah",
      guide: { name: "ספרי", emoji: "📚", hello: "שלום! אני ספרי, ספר ההלכה של הכולל. כאן נבחנים על ההלכה. (לימוד בלבד: למעשה שואלים רב.)" } },
    { id: "kollel-yitzhak", name: "הכולל של הרב יצחק יוסף", icon: "📘", color: "#155e75", desc: "ילקוט יוסף וברכות", free: true, bank: true, home: "#/town/torah",
      guide: { name: "ספרי", emoji: "📚", hello: "שלום! אני ספרי, ספר ההלכה של הכולל. כאן נבחנים על ההלכה. (לימוד בלבד: למעשה שואלים רב.)" } },
    { id: "kollel-david", name: "הכולל של הרב דוד יוסף", icon: "📘", color: "#3730a3", desc: "הלכה ברורה וברכות", free: true, bank: true, home: "#/town/torah",
      guide: { name: "ספרי", emoji: "📚", hello: "שלום! אני ספרי, ספר ההלכה של הכולל. כאן נבחנים על ההלכה. (לימוד בלבד: למעשה שואלים רב.)" } },
    { id: "kollel-orlezion", name: "הכולל של האור לציון", icon: "📘", color: "#065f46", desc: "הרב בן ציון אבא שאול והלכות שבת", free: true, bank: true, home: "#/town/torah",
      guide: { name: "ספרי", emoji: "📚", hello: "שלום! אני ספרי, ספר ההלכה של הכולל. כאן נבחנים על ההלכה. (לימוד בלבד: למעשה שואלים רב.)" } },
    { id: "kollel-yigal", name: "הכולל של הרב יגאל כהן", icon: "📘", color: "#9a3412", desc: "הלכות יום יום מהשולחן ערוך", free: true, bank: true, home: "#/town/torah",
      guide: { name: "ספרי", emoji: "📚", hello: "שלום! אני ספרי, ספר ההלכה של הכולל. כאן נבחנים על ההלכה. (לימוד בלבד: למעשה שואלים רב.)" } },
  ];

  // פריטים לדמות. price 0 = חינם מההתחלה.
  const ITEMS = {
    hat: [
      { id: "none", name: "בלי", price: 0 },
      { id: "kippah", name: "כיפה כחולה", price: 0 },
      { id: "kippah-sruga", name: "כיפה סרוגה", price: 30 },
      { id: "cap", name: "כובע מצחייה", price: 50 },
      { id: "black-hat", name: "כובע שחור", price: 80 },
      { id: "crown", name: "כתר תורה", price: 250 },
    ],
    shirt: [
      { id: "#3b82f6", name: "כחול", price: 0 },
      { id: "#ffffff", name: "לבן", price: 0 },
      { id: "#22c55e", name: "ירוק", price: 20 },
      { id: "#ef4444", name: "אדום", price: 20 },
      { id: "#a855f7", name: "סגול", price: 40 },
      { id: "#f59e0b", name: "זהב", price: 120 },
      // פריטי יהלומים 💎: המחיר האמיתי נקבע בשרת (gem_items ב-supabase/update-10.sql), כאן רק לתצוגה.
      { id: "#06b6d4", name: "טורקיז", gems: 30 },
      { id: "#ec4899", name: "ורוד", gems: 30 },
      { id: "#111827", name: "שחור מלכותי", gems: 50 },
      { id: "#c0c0c0", name: "כסף", gems: 80 },
    ],
    extra: [
      { id: "none", name: "בלי", price: 0 },
      { id: "glasses", name: "משקפיים", price: 40 },
      { id: "tzitzit", name: "ציצית", price: 30 },
      { id: "backpack", name: "תיק ספרים", price: 60 },
      { id: "book", name: "ספר ביד", price: 90 },
      { id: "medal", name: "מדליית חתן תורה", price: 300 },
    ],
  };
  const SKINS = ["#f6d3b3", "#e9b98f", "#c68a5e", "#8d5a3b"];
  const HAIR = ["#3b2a1e", "#7a4a24", "#d9a441", "#111111"];

  // ציור הדמות כ-SVG בסגנון צ'יבי: ראש גדול, ידיים, רגליים ונעליים. look = { skin, hair, hat, shirt, extra }
  // העיניים בקבוצה av-eyes, כדי שה-CSS יוכל למצמץ.
  function avatarSVG(look, size) {
    const L = Object.assign({ skin: SKINS[0], hair: HAIR[0], hat: "kippah", shirt: "#3b82f6", extra: "none" }, look);
  if (L.hat === "bow") L.hat = "kippah"; // פריט ישן שהוסר מהחנות
  const s = size || 120;
  const ink = "rgba(40,24,12,.55)";             // קו מתאר רך
  const white = L.shirt === "#ffffff";
  const shirtLine = white ? "#cbd5e1" : "rgba(0,0,0,.22)";
  const shade = "rgba(0,0,0,.12)";
  const pants = "#334155", shoe = "#1f2937";
  let back = "", mid = "", front = "", hat = "";

  // מאחורי הגוף: תיק, שיער ארוך
  if (L.extra === "backpack") back += `<rect x="30" y="88" width="60" height="40" rx="12" fill="#8b5a2b" stroke="${ink}" stroke-width="1.5"/>`;

  // רגליים ונעליים 
  const legs = `<rect x="46" y="120" width="12" height="27" rx="6" fill="${pants}" stroke="${ink}" stroke-width="1.2"/>
       <rect x="62" y="120" width="12" height="27" rx="6" fill="${pants}" stroke="${ink}" stroke-width="1.2"/>`;
  const shoes = `<path d="M42 146 q0 -6 9 -6 h6 v10 h-12 q-3 0 -3 -4 Z" fill="${shoe}"/><path d="M78 146 q0 -6 -9 -6 h-6 v10 h12 q3 0 3 -4 Z" fill="${shoe}"/>`;

  // גוף: חולצה 
  const body = `<path d="M41 88 Q60 82 79 88 Q83 104 81 124 Q60 128 39 124 Q37 104 41 88 Z" fill="${L.shirt}" stroke="${shirtLine}" stroke-width="2"/>
       <path d="M52 87 L60 95 L68 87" fill="none" stroke="${shirtLine}" stroke-width="2" stroke-linejoin="round"/>`;

  // ידיים: שרוול בצבע החולצה ויד בצבע העור. עם ספר, היד הימנית (בצד שמאל של המסך) מחזיקה אותו מקדימה.
  const holdBook = L.extra === "book";
  const armL = `<path d="M42 90 Q32 96 31 114" fill="none" stroke="${L.shirt}" stroke-width="10" stroke-linecap="round"/>
                <path d="M42 90 Q32 96 31 114" fill="none" stroke="${shirtLine}" stroke-width="1" stroke-linecap="round" opacity=".6"/>
                <circle cx="31" cy="117" r="5" fill="${L.skin}" stroke="${ink}" stroke-width="1.2"/>`;
  const armR = holdBook
    ? `<path d="M78 90 Q90 98 82 110" fill="none" stroke="${L.shirt}" stroke-width="10" stroke-linecap="round"/>
       <circle cx="80" cy="112" r="5" fill="${L.skin}" stroke="${ink}" stroke-width="1.2"/>`
    : `<path d="M78 90 Q88 96 89 114" fill="none" stroke="${L.shirt}" stroke-width="10" stroke-linecap="round"/>
       <path d="M78 90 Q88 96 89 114" fill="none" stroke="${shirtLine}" stroke-width="1" stroke-linecap="round" opacity=".6"/>
       <circle cx="89" cy="117" r="5" fill="${L.skin}" stroke="${ink}" stroke-width="1.2"/>`;

  // פריטים על הגוף
  if (L.extra === "backpack") mid += `<path d="M46 88 L44 118 M74 88 L76 118" stroke="#6b4423" stroke-width="4" stroke-linecap="round"/>`;
  if (L.extra === "tzitzit") mid += `<g stroke="#94a3b8" stroke-width="3" stroke-linecap="round"><path d="M48 122 v16 M52 122 v13 M68 122 v13 M72 122 v16"/></g><g stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M48 122 v16 M52 122 v13 M68 122 v13 M72 122 v16"/></g>`;
  if (L.extra === "medal") mid += `<path d="M53 88 L60 104 L67 88" fill="none" stroke="#2563eb" stroke-width="4"/><circle cx="60" cy="108" r="7.5" fill="#f5c542" stroke="#b7791f" stroke-width="2"/><path d="M60 104 l1.3 2.7 3 .4 -2.2 2 .6 3 -2.7 -1.5 -2.7 1.5 .6 -3 -2.2 -2 3 -.4 Z" fill="#fff6c8"/>`;
  if (holdBook) front += `<g transform="rotate(-10 74 110)"><rect x="62" y="98" width="24" height="28" rx="3" fill="#1e3a5f" stroke="${ink}" stroke-width="1.2"/><rect x="65" y="101" width="18" height="22" rx="2" fill="#c99a2e" opacity=".35"/><text x="74" y="117" font-size="11" text-anchor="middle" fill="#ffd67a" font-family="serif">ת</text></g>
    <circle cx="78" cy="110" r="5" fill="${L.skin}" stroke="${ink}" stroke-width="1.2"/>`;

  // ראש גדול
  const head = `<rect x="54" y="78" width="12" height="10" rx="4" fill="${L.skin}"/>
    <circle cx="29" cy="56" r="6" fill="${L.skin}" stroke="${ink}" stroke-width="1.2"/><circle cx="91" cy="56" r="6" fill="${L.skin}" stroke="${ink}" stroke-width="1.2"/>
    <ellipse cx="60" cy="52" rx="31" ry="30" fill="${L.skin}" stroke="${ink}" stroke-width="1.5"/>`;
  const hairTop = `<path d="M30 50 Q30 22 60 22 Q90 22 90 50 Q86 36 72 33 Q66 39 58 34 Q50 39 44 34 Q34 38 30 50 Z" fill="${L.hair}" stroke="${ink}" stroke-width="1.2"/>`;
  // פנים: עיניים גדולות עם ברק, גבות, לחיים וחיוך. העיניים בקבוצה av-eyes כדי שיוכלו למצמץ.
  const face = `
    <path d="M42 44 q6 -4 11 -1 M67 43 q5 -3 11 1" fill="none" stroke="${L.hair === "#d9a441" ? "#a0702a" : L.hair}" stroke-width="2.4" stroke-linecap="round"/>
    <g class="av-eyes">
      <ellipse cx="48" cy="55" rx="5.2" ry="6.4" fill="#1f2937"/><ellipse cx="72" cy="55" rx="5.2" ry="6.4" fill="#1f2937"/>
      <circle cx="49.8" cy="52.6" r="2" fill="#fff"/><circle cx="73.8" cy="52.6" r="2" fill="#fff"/>
      <circle cx="46.6" cy="57.8" r=".9" fill="#fff" opacity=".8"/><circle cx="70.6" cy="57.8" r=".9" fill="#fff" opacity=".8"/>
    </g>
    <ellipse cx="39" cy="65" rx="5" ry="3.2" fill="#f87171" opacity=".35"/><ellipse cx="81" cy="65" rx="5" ry="3.2" fill="#f87171" opacity=".35"/>
    <path d="M53 67 Q60 74 67 67" fill="#fff" stroke="#7c2d12" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;

  if (L.hat === "kippah") hat = `<path d="M44 28 Q60 14 76 28 Q60 24 44 28 Z" fill="#1d4ed8" stroke="#1e3a8a" stroke-width="1"/>`;
  if (L.hat === "kippah-sruga") hat = `<path d="M44 28 Q60 14 76 28 Q60 24 44 28 Z" fill="#f8fafc" stroke="#16a34a" stroke-width="2.2" stroke-dasharray="3 2"/>`;
  if (L.hat === "cap") hat = `<path d="M30 40 Q30 14 60 14 Q90 14 90 40 Q60 32 30 40 Z" fill="#ef4444" stroke="${ink}" stroke-width="1.2"/><path d="M84 37 h20 q3 5 -4 7 h-19 Z" fill="#b91c1c"/><circle cx="60" cy="15" r="2.5" fill="#b91c1c"/>`;
  if (L.hat === "black-hat") hat = `<rect x="38" y="6" width="44" height="24" rx="7" fill="#111827"/><rect x="24" y="26" width="72" height="8" rx="4" fill="#111827"/><rect x="38" y="21" width="44" height="4" fill="#374151"/>`;
  if (L.hat === "crown") hat = `<path d="M38 30 L40 8 L50 19 L60 4 L70 19 L80 8 L82 30 Z" fill="#f5c542" stroke="#b7791f" stroke-width="2"/><circle cx="60" cy="20" r="3" fill="#ef4444"/><circle cx="46" cy="25" r="2" fill="#3b82f6"/><circle cx="74" cy="25" r="2" fill="#22c55e"/>`;

  const glasses = L.extra === "glasses" ? `<g fill="rgba(255,255,255,.15)" stroke="#1f2937" stroke-width="2.2"><circle cx="48" cy="55" r="9"/><circle cx="72" cy="55" r="9"/><path d="M57 55 h6" fill="none"/></g>` : "";

  return `<svg viewBox="0 0 120 160" width="${s}" height="${s * 160 / 120}" role="img" aria-label="הדמות שלי">
    <ellipse cx="60" cy="152" rx="26" ry="4" fill="rgba(0,0,0,.15)"/>
    ${back}${legs}${shoes}${armL}${body}${mid}${armR}${head}${hairTop}${face}${glasses}${hat}${front}
  </svg>`;
  }

  // גדולי ישראל בגולה: המקומות כבר במפה, והשאלות יתווספו בהמשך (soon = נעול עד אז)
  [["vilna", "הגאון מוילנה", "🏰", "#1e40af"], ["volozhin", "ישיבת וולוז'ין", "📚", "#0f766e"], ["radin", "החפץ חיים", "📖", "#7c3aed"],
   ["mezhibozh", "הבעל שם טוב", "🌲", "#15803d"], ["breslov", "רבי נחמן מברסלב", "🎶", "#0369a1"], ["prague", "המהר\"ל מפראג", "🕍", "#9f1239"],
   ["baghdad", "הבן איש חי", "🌴", "#b45309"], ["morocco", "אור החיים הקדוש", "🏜️", "#be123c"], ["fustat", "הרמב\"ם", "🏺", "#a16207"]]
    .forEach(([id, name, icon, color]) => PLACES.push({ id, name, icon, color, desc: "בקרוב", free: true, bank: true, soon: true, gola: true,
      guide: { name: "ינשופי", emoji: "🦉", hello: `ברוכים הבאים! כאן נלמד על ${name}.` } }));

  // היכלות הפרשנים בהיכל פרשת השבוע (הרשימה ב-content/parasha.js). השם והתיאור נקבעים בכל פתיחה, לפי הפרשה של השבוע.
  const PAR = window.TEIRE_PARASHA;
  if (PAR) PAR.COMMENTATORS.forEach(c => PLACES.push({
    id: "parasha-" + c.id, name: `היכל ${c.name}`, icon: c.icon, color: c.color,
    get desc() { return `פרשת ${PAR.current.name || "השבוע"} · ${c.desc}`; },
    free: true, bank: true, parasha: true, home: "#/town/parasha",
    guide: { name: "מגילי", emoji: "📜", hello: `ברוכים הבאים להיכל ${c.name} (${c.full})! קראו את הפסוק, ודייקו: מה ${c.name} אומר עליו?` },
  }));
  // היכל השלמת הפסוק: מכל התורה, לא קשור לפרשה
  PLACES.push({ id: "verse-hall", name: "היכל השלמת הפסוק", icon: "🔤", color: "#0f172a", desc: "השלימו את המילה החסרה, מכל התורה",
    free: true, bank: true, home: "#/town/parasha",
    guide: { name: "אותיות", emoji: "🔤", hello: "ברוכים הבאים! אני אותיות. תראו את הפסוק עם המילה החסרה, ותשלימו אותה מהזיכרון." } });

  // היכל הארמית: מילים, מונחים ופתגמים בארמית של התלמוד (השאלות ב-content/aramaic.js)
  PLACES.push({ id: "aramaic-hall", name: "היכל הארמית", icon: "🗝️", color: "#78350f", desc: "מילים, מונחים ופתגמים בארמית של הגמרא",
    free: true, bank: true, home: "#/town/torah",
    guide: { name: "בר מילי", emoji: "🦉", hello: "שלמא עלך! אני בר מילי. כאן לומדים את הארמית של הגמרא: מילים, מונחים ופתגמים. מה פירוש המילה?" } });

  // אמריקה, קראון הייטס: היכל הרבי מליובאוויטש והיכל התניא של האדמו"ר הזקן (השאלות ב-content/chabad.js)
  PLACES.push({ id: "rebbe-hall", name: "היכל הרבי מליובאוויטש", icon: "🕍", color: "#1e3a8a", desc: "חייו, תורתו ומבצעיו של הרבי, רבי מנחם מענדל שניאורסון",
    free: true, bank: true, chabad: true, home: "#/town/crown-heights",
    guide: { name: "יוני", emoji: "🕊️", hello: "שלום עליכם! אני יוני, והגעתם ל-770 בברוקלין. כאן נלמד על הרבי מליובאוויטש: מאיפה בא, מה לימד, ואיך שלח שלוחים לכל העולם." } });
  PLACES.push({ id: "tanya-hall", name: "היכל התניא", icon: "📗", color: "#065f46", desc: "ספר התניא ותורתו של האדמו\"ר הזקן, מייסד חב\"ד",
    free: true, bank: true, chabad: true, home: "#/town/crown-heights",
    guide: { name: "אילי", emoji: "🦌", hello: "\"כי קרוב אליך הדבר מאד, בפיך ובלבבך לעשותו\". אני אילי, וכאן לומדים תניא ותורת האדמו\"ר הזקן, רבי שניאור זלמן מלאדי." } });

  window.TeireWorld = { PLACES, ITEMS, SKINS, HAIR, avatarSVG };
})();
