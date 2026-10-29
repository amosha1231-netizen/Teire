// מפת ארץ ישראל: צורת הארץ, הימים והמקומות הקדושים. כל מספר הוא בפיקסלים בתוך עולם בגודל W x H.
(function () {
  const W = 1400, H = 2000;

  // צורת הארץ (מצפון לדרום, קו החוף במערב והירדן במזרח)
  const LAND = [[470, 95], [620, 62], [770, 40], [805, 120], [735, 290], [742, 430], [748, 700], [742, 1000], [728, 1300], [668, 1600], [600, 1940], [560, 1940], [430, 1500], [270, 1215], [200, 1135], [262, 1000], [330, 800], [372, 520], [392, 345], [425, 125]];
  const SINAI = [[150, 1460], [380, 1520], [470, 1640], [430, 1900], [330, 1960], [180, 1820], [110, 1640]];
  // ארצות הגולה: אירופה בצפון, וארצות המזרח בדרום
  const EUROPE = [[1060, 80], [1250, 40], [1360, 120], [1370, 420], [1340, 720], [1190, 790], [1070, 670], [1040, 330]];
  const MIZRACH = [[1070, 1100], [1250, 1060], [1360, 1150], [1350, 1500], [1250, 1620], [1100, 1590], [1050, 1350]];
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
    { id: "bnei-brak", name: "בני ברק", icon: "🌴", x: 405, y: 880, color: "#f97316", desc: "הישיבה של רבי עקיבא", torah: "mishna" },
    { id: "yavne", name: "יבנה", icon: "🍇", x: 300, y: 990, color: "#8b5cf6", desc: "כרם ביבנה: רבי אליעזר ורבי יהושע" },
    { id: "torah", name: "קריית התורה", icon: "🏙️", x: 705, y: 925, color: "#1e3a8a", desc: "כוללי הרבנים, אתגרים, היכל הפלפולים והספרייה" },
    { id: "parasha", name: "היכל פרשת השבוע", icon: "📜", x: 285, y: 1160, color: "#7c2d12", desc: "פרשת השבוע עם רש\"י, הרמב\"ן, בעל הטורים ועוד פרשנים" },
    { id: "jerusalem", name: "ירושלים", icon: "🏛️", x: 580, y: 1000, color: "#eab308", desc: "בית המדרש של הלל ושמאי, ואבן השתייה שממנה הושתת העולם", torah: "gan-eden", duel: true },
    { id: "shuk", name: "שוק מחנה יהודה", icon: "🛍️", x: 455, y: 1085, color: "#ec4899", desc: "חנות הבגדים והאביזרים", href: "#/me" },
    { id: "hebron", name: "חברון", icon: "🌳", x: 560, y: 1175, color: "#65a30d", desc: "מערת המכפלה", torah: "ohel" },
    { id: "mailbox", name: "תיבת ההצעות", icon: "📮", x: 400, y: 1250, color: "#ef4444", desc: "הציעו שאלה", href: "#/suggest" },
    { id: "beer-sheva", name: "באר שבע", icon: "💧", x: 470, y: 1390, color: "#0ea5e9", desc: "הבאר של אברהם אבינו, זירת דו-קרב", duel: true },
    { id: "sinai", name: "הר סיני", icon: "⛰️", x: 300, y: 1720, color: "#9a8bd6", desc: "מתן תורה והלוחות", torah: "sinai" },
    { id: "sura", name: "סורא", icon: "🏫", x: 880, y: 640, color: "#9333ea", desc: "הישיבה של רב" },
    { id: "nehardea", name: "נהרדעא", icon: "🌙", x: 900, y: 770, color: "#1d4ed8", desc: "העיר של שמואל" },
    { id: "pumbedita", name: "פומבדיתא", icon: "📖", x: 880, y: 900, color: "#15803d", desc: "הישיבה של אביי", torah: "gemara" },
    // גדולי ישראל בגולה. soon = השאלות עוד לא נכתבו, והמקום נעול
    { id: "vilna", name: "וילנה", icon: "🏰", x: 1150, y: 160, color: "#1e40af", desc: "הגאון מוילנה", torah: "vilna" },
    { id: "volozhin", name: "וולוז'ין", icon: "📚", x: 1290, y: 250, color: "#0f766e", desc: "ישיבת וולוז'ין של רבי חיים", torah: "volozhin" },
    { id: "radin", name: "ראדין", icon: "📖", x: 1140, y: 350, color: "#7c3aed", desc: "החפץ חיים", torah: "radin" },
    { id: "mezhibozh", name: "מז'יבוז'", icon: "🌲", x: 1285, y: 450, color: "#15803d", desc: "הבעל שם טוב", torah: "mezhibozh" },
    { id: "breslov", name: "ברסלב", icon: "🎶", x: 1150, y: 560, color: "#0369a1", desc: "רבי נחמן מברסלב", torah: "breslov" },
    { id: "prague", name: "פראג", icon: "🕍", x: 1270, y: 660, color: "#9f1239", desc: "המהר\"ל מפראג", torah: "prague" },
    { id: "baghdad", name: "בגדאד", icon: "🌴", x: 1170, y: 1190, color: "#b45309", desc: "הבן איש חי", torah: "baghdad" },
    { id: "morocco", name: "מרוקו", icon: "🏜️", x: 1275, y: 1340, color: "#be123c", desc: "אור החיים הקדוש", torah: "morocco" },
    { id: "fustat", name: "פוסטאט, מצרים", icon: "🏺", x: 1165, y: 1480, color: "#a16207", desc: "הרמב\"ם", torah: "fustat" },
    { id: "olama", name: "היכל עלמא", icon: "🌐", x: 640, y: 1330, color: "#7c3aed", desc: "משחקים חיים עם כל החדר", href: "#/olama" },
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
    { text: "אירופה", x: 1215, y: 75, cls: "land big" },
    { text: "ארצות המזרח", x: 1210, y: 1095, cls: "land" },
    { text: "ים כנרת", x: 712, y: 395, cls: "lake" },
    { text: "ים המלח", x: 705, y: 1230, cls: "lake" },
  ];

  const START = { x: 520, y: 1060 };
  window.TeireCity = { W, H, LAND, SINAI, BAVEL, EUROPE, MIZRACH, LOCATIONS, LABELS, START, byId: id => LOCATIONS.find(b => b.id === id) };
})();
