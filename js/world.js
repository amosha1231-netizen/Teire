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
      { id: "bow", name: "סרט לשיער", price: 30 },
      { id: "crown", name: "כתר תורה", price: 250 },
    ],
    shirt: [
      { id: "#3b82f6", name: "כחול", price: 0 },
      { id: "#ffffff", name: "לבן", price: 0 },
      { id: "#22c55e", name: "ירוק", price: 20 },
      { id: "#ef4444", name: "אדום", price: 20 },
      { id: "#a855f7", name: "סגול", price: 40 },
      { id: "#f59e0b", name: "זהב", price: 120 },
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

  // ציור הדמות כ-SVG. look = { gender, skin, hair, hat, shirt, extra }
  function avatarSVG(look, size) {
    const L = Object.assign({ gender: "boy", skin: SKINS[0], hair: HAIR[0], hat: "kippah", shirt: "#3b82f6", extra: "none" }, look);
    const s = size || 120;
    const girl = L.gender === "girl";
    const shirtStroke = L.shirt === "#ffffff" ? "#cbd5e1" : "rgba(0,0,0,.15)";
    let back = "", front = "", hat = "";

    if (L.extra === "backpack") back += `<rect x="22" y="98" width="76" height="46" rx="14" fill="#8b5a2b"/>`;
    if (girl) back += `<path d="M30 58 Q26 100 36 112 L84 112 Q94 100 90 58 Z" fill="${L.hair}"/>`;

    if (L.extra === "tzitzit") front += `<g stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M40 138 v16 M44 138 v14 M76 138 v14 M80 138 v16"/></g>`;
    if (L.extra === "glasses") front += `<g fill="none" stroke="#1f2937" stroke-width="2.5"><circle cx="50" cy="64" r="8"/><circle cx="70" cy="64" r="8"/><path d="M58 64 h4"/></g>`;
    if (L.extra === "book") front += `<g transform="rotate(-8 88 124)"><rect x="76" y="110" width="26" height="30" rx="3" fill="#1e3a5f"/><rect x="79" y="113" width="20" height="24" rx="2" fill="#c99a2e" opacity=".35"/><text x="89" y="130" font-size="11" text-anchor="middle" fill="#ffd67a" font-family="serif">ת</text></g>`;
    if (L.extra === "medal") front += `<path d="M54 96 L60 112 L66 96" fill="none" stroke="#2563eb" stroke-width="4"/><circle cx="60" cy="118" r="8" fill="#f5c542" stroke="#b7791f" stroke-width="2"/>`;

    const hairTop = girl
      ? `<path d="M34 56 Q36 30 60 30 Q84 30 86 56 Q74 44 60 46 Q46 44 34 56 Z" fill="${L.hair}"/>`
      : `<path d="M35 54 Q36 32 60 32 Q84 32 85 54 Q78 42 60 43 Q42 42 35 54 Z" fill="${L.hair}"/>`;

    if (L.hat === "kippah") hat = `<path d="M44 38 Q60 22 76 38 Z" fill="#1d4ed8"/>`;
    if (L.hat === "kippah-sruga") hat = `<path d="M44 38 Q60 22 76 38 Z" fill="#f8fafc" stroke="#16a34a" stroke-width="2.5" stroke-dasharray="3 2"/>`;
    if (L.hat === "cap") hat = `<path d="M36 44 Q38 24 60 24 Q82 24 84 44 Z" fill="#ef4444"/><path d="M80 42 h20 q2 4 -4 6 h-18 Z" fill="#b91c1c"/>`;
    if (L.hat === "black-hat") hat = `<rect x="40" y="18" width="40" height="22" rx="6" fill="#111827"/><rect x="28" y="36" width="64" height="7" rx="3.5" fill="#111827"/><rect x="40" y="31" width="40" height="4" fill="#374151"/>`;
    if (L.hat === "bow") hat = `<g fill="#ec4899"><path d="M62 34 l12 -8 v16 Z"/><path d="M62 34 l-12 -8 v16 Z"/><circle cx="62" cy="34" r="4"/></g>`;
    if (L.hat === "crown") hat = `<path d="M40 40 L42 20 L51 30 L60 16 L69 30 L78 20 L80 40 Z" fill="#f5c542" stroke="#b7791f" stroke-width="2"/><circle cx="60" cy="30" r="3" fill="#ef4444"/>`;

    return `<svg viewBox="0 0 120 160" width="${s}" height="${s * 160 / 120}" role="img" aria-label="הדמות שלי">
      ${back}
      <path d="M28 160 Q28 104 60 100 Q92 104 92 160 Z" fill="${L.shirt}" stroke="${shirtStroke}" stroke-width="2"/>
      <rect x="53" y="88" width="14" height="14" rx="5" fill="${L.skin}"/>
      <circle cx="60" cy="62" r="27" fill="${L.skin}"/>
      <circle cx="33" cy="64" r="5" fill="${L.skin}"/><circle cx="87" cy="64" r="5" fill="${L.skin}"/>
      ${hairTop}
      <circle cx="50" cy="64" r="3.6" fill="#1f2937"/><circle cx="70" cy="64" r="3.6" fill="#1f2937"/>
      <circle cx="51.2" cy="62.8" r="1.2" fill="#fff"/><circle cx="71.2" cy="62.8" r="1.2" fill="#fff"/>
      <circle cx="44" cy="73" r="4.5" fill="#f87171" opacity=".35"/><circle cx="76" cy="73" r="4.5" fill="#f87171" opacity=".35"/>
      <path d="M52 76 Q60 83 68 76" fill="none" stroke="#7c2d12" stroke-width="2.6" stroke-linecap="round"/>
      ${hat}${front}
    </svg>`;
  }

  // גדולי ישראל בגולה: המקומות כבר במפה, והשאלות יתווספו בהמשך (soon = נעול עד אז)
  [["vilna", "הגאון מוילנה", "🏰", "#1e40af"], ["volozhin", "ישיבת וולוז'ין", "📚", "#0f766e"], ["radin", "החפץ חיים", "📖", "#7c3aed"],
   ["mezhibozh", "הבעל שם טוב", "🌲", "#15803d"], ["breslov", "רבי נחמן מברסלב", "🎶", "#0369a1"], ["prague", "המהר\"ל מפראג", "🕍", "#9f1239"],
   ["baghdad", "הבן איש חי", "🌴", "#b45309"], ["morocco", "אור החיים הקדוש", "🏜️", "#be123c"], ["fustat", "הרמב\"ם", "🏺", "#a16207"]]
    .forEach(([id, name, icon, color]) => PLACES.push({ id, name, icon, color, desc: "בקרוב", free: true, bank: true, soon: true, gola: true,
      guide: { name: "ינשופי", emoji: "🦉", hello: `ברוכים הבאים! כאן נלמד על ${name}.` } }));

  // היכלות הפרשנים בהיכל פרשת השבוע (הרשימה ב-content/parasha.js)
  const PAR = window.TEIRE_PARASHA;
  if (PAR) PAR.COMMENTATORS.forEach(c => PLACES.push({
    id: "parasha-" + c.id, name: `היכל ${c.name}`, icon: c.icon, color: c.color, desc: `פרשת ${PAR.current.name} · ${c.desc}`,
    free: true, bank: true, home: "#/town/parasha",
    guide: { name: "מגילי", emoji: "📜", hello: `ברוכים הבאים להיכל ${c.name} (${c.full})! השבוע פרשת ${PAR.current.name}. קראו את הפסוק, ודייקו: מה ${c.name} אומר עליו?` },
  }));

  window.TeireWorld = { PLACES, ITEMS, SKINS, HAIR, avatarSVG };
})();
