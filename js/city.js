// מפת ארץ ישראל: צורת הארץ, הימים והמקומות הקדושים. כל מספר הוא בפיקסלים בתוך עולם בגודל W x H.
(function () {
  const W = 1000, H = 2000;

  // צורת הארץ (מצפון לדרום, קו החוף במערב והירדן במזרח)
  const LAND = [[470, 95], [620, 62], [770, 40], [805, 120], [735, 290], [742, 430], [748, 700], [742, 1000], [728, 1300], [668, 1600], [600, 1940], [560, 1940], [430, 1500], [270, 1215], [200, 1135], [262, 1000], [330, 800], [372, 520], [392, 345], [425, 125]];
  const SINAI = [[150, 1460], [380, 1520], [470, 1640], [430, 1900], [330, 1960], [180, 1820], [110, 1640]];
  const BAVEL = [[810, 560], [950, 520], [985, 700], [970, 1040], [880, 1100], [815, 960], [800, 720]];

  // kind: sage = חכמים ומחלוקות, torah = משימה מהמסע בתורה, duel = זירת דו-קרב, href = מעבר לעמוד באתר
  const LOCATIONS = [
    { id: "meron", name: "מירון", icon: "🔥", x: 560, y: 250, color: "#ea580c", desc: "המערה של רבי שמעון בר יוחאי" },
    { id: "tzfat", name: "צפת", icon: "🕯️", x: 668, y: 205, color: "#2563eb", desc: "עיר המקובלים", torah: "beit-knesset" },
    { id: "tzipori", name: "ציפורי", icon: "📚", x: 500, y: 405, color: "#5a7fc4", desc: "כאן ישב רבי יהודה הנשיא, שערך את המשנה", torah: "beit-midrash" },
    { id: "tiberias", name: "טבריה", icon: "⚔️", x: 640, y: 450, color: "#0891b2", desc: "זירת דו-קרב על שפת הכנרת", duel: true },
    { id: "souls", name: "היכל הנשמות", icon: "✨", x: 470, y: 580, color: "#fbbf24", desc: "הנשמות שאספתם", href: "#/souls" },
    { id: "shechem", name: "שכם", icon: "🌾", x: 575, y: 700, color: "#e2895a", desc: "קבר יוסף הצדיק", torah: "mitzrayim" },
    { id: "shilo", name: "שילה", icon: "🏕️", x: 610, y: 815, color: "#d9a95b", desc: "כאן עמד המשכן", torah: "midbar" },
    { id: "yafo", name: "יפו", icon: "⛵", x: 330, y: 790, color: "#5fb6e8", desc: "עיר נמל עתיקה על חוף הים", torah: "teiva" },
    { id: "bnei-brak", name: "בני ברק", icon: "🌴", x: 405, y: 880, color: "#f97316", desc: "הישיבה של רבי עקיבא" },
    { id: "yavne", name: "יבנה", icon: "🍇", x: 300, y: 990, color: "#8b5cf6", desc: "כרם ביבנה: רבי אליעזר ורבי יהושע" },
    { id: "jerusalem", name: "ירושלים", icon: "🏛️", x: 580, y: 1000, color: "#eab308", desc: "בית המדרש של הלל ושמאי, ואבן השתייה שממנה הושתת העולם", torah: "gan-eden", duel: true },
    { id: "shuk", name: "שוק מחנה יהודה", icon: "🛍️", x: 455, y: 1085, color: "#ec4899", desc: "חנות הבגדים והאביזרים", href: "#/me" },
    { id: "hebron", name: "חברון", icon: "🌳", x: 560, y: 1175, color: "#65a30d", desc: "מערת המכפלה", torah: "ohel" },
    { id: "mailbox", name: "תיבת ההצעות", icon: "📮", x: 400, y: 1250, color: "#ef4444", desc: "הציעו שאלה", href: "#/suggest" },
    { id: "beer-sheva", name: "באר שבע", icon: "💧", x: 470, y: 1390, color: "#0ea5e9", desc: "הבאר של אברהם אבינו, זירת דו-קרב", duel: true },
    { id: "sinai", name: "הר סיני", icon: "⛰️", x: 300, y: 1720, color: "#9a8bd6", desc: "מתן תורה והלוחות", torah: "sinai" },
    { id: "sura", name: "סורא", icon: "🏫", x: 880, y: 640, color: "#9333ea", desc: "הישיבה של רב" },
    { id: "nehardea", name: "נהרדעא", icon: "🌙", x: 900, y: 770, color: "#1d4ed8", desc: "העיר של שמואל" },
    { id: "pumbedita", name: "פומבדיתא", icon: "📖", x: 880, y: 900, color: "#15803d", desc: "הישיבה של אביי" },
    { id: "mechoza", name: "מחוזא", icon: "🏙️", x: 900, y: 1020, color: "#be123c", desc: "העיר של רבא, זירת דו-קרב", duel: true },
  ];

  const LABELS = [
    { text: "הים התיכון", x: 150, y: 620, cls: "sea" },
    { text: "הגליל", x: 610, y: 330, cls: "land" },
    { text: "השומרון", x: 500, y: 760, cls: "land" },
    { text: "יהודה", x: 640, y: 1120, cls: "land" },
    { text: "הנגב", x: 560, y: 1560, cls: "land" },
    { text: "מדבר סיני", x: 300, y: 1600, cls: "land" },
    { text: "בבל", x: 900, y: 560, cls: "land big" },
    { text: "ים כנרת", x: 712, y: 395, cls: "lake" },
    { text: "ים המלח", x: 705, y: 1230, cls: "lake" },
  ];

  const START = { x: 520, y: 1060 };
  window.TeireCity = { W, H, LAND, SINAI, BAVEL, LOCATIONS, LABELS, START, byId: id => LOCATIONS.find(b => b.id === id) };
})();
