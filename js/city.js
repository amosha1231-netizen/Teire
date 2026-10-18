// העיר: מיקום הבניינים והאזורים. כל מספר הוא בפיקסלים בתוך עולם בגודל W x H.
(function () {
  const W = 1000, H = 1720;

  const REGIONS = [
    { name: "ארץ ישראל · עולם התנאים", y: 0, h: 640, bg: "linear-gradient(180deg,#bfe8a8,#a6db8c)" },
    { name: "שכונת החומש", y: 640, h: 420, bg: "linear-gradient(180deg,#f3e3b5,#ecd59a)" },
    { name: "נהר פרת", y: 1060, h: 90, bg: "linear-gradient(180deg,#7cc4f2,#4ea6e0)", river: true },
    { name: "בבל · עולם האמוראים", y: 1150, h: 570, bg: "linear-gradient(180deg,#f0c98f,#e3b073)" },
  ];

  // kind: sage = בית של חכמים, torah = תחנה מהמסע בתורה, link = מעבר לעמוד באתר
  const BUILDINGS = [
    { id: "yavne", kind: "sage", name: "כרם ביבנה", icon: "🍇", x: 200, y: 190, color: "#8b5cf6", desc: "רבי אליעזר ורבי יהושע", big: true },
    { id: "jerusalem", kind: "sage", name: "ירושלים", icon: "🏛️", x: 500, y: 300, color: "#eab308", desc: "בית המדרש של הלל ושמאי", big: true },
    { id: "bnei-brak", kind: "sage", name: "בני ברק", icon: "🌴", x: 800, y: 190, color: "#f97316", desc: "הישיבה של רבי עקיבא", big: true },
    { id: "meron", kind: "sage", name: "המערה", icon: "🔥", x: 810, y: 500, color: "#57534e", desc: "המערה של רבי שמעון בר יוחאי", big: true },
    { id: "souls", kind: "link", href: "#/souls", name: "היכל הנשמות", icon: "🕯️", x: 190, y: 500, color: "#fbbf24", desc: "הנשמות שאספתם" },
    { id: "mailbox", kind: "link", href: "#/suggest", name: "תיבת ההצעות", icon: "📮", x: 640, y: 560, color: "#ef4444", desc: "הציעו שאלה" },

    { id: "gan-eden", kind: "torah", x: 860, y: 770 },
    { id: "teiva", kind: "torah", x: 620, y: 770 },
    { id: "ohel", kind: "torah", x: 380, y: 770 },
    { id: "mitzrayim", kind: "torah", x: 140, y: 770 },
    { id: "sinai", kind: "torah", x: 140, y: 955 },
    { id: "midbar", kind: "torah", x: 380, y: 955 },
    { id: "beit-midrash", kind: "torah", x: 620, y: 955 },
    { id: "beit-knesset", kind: "torah", x: 860, y: 955 },

    { id: "sura", kind: "sage", name: "סורא", icon: "🏫", x: 220, y: 1290, color: "#9333ea", desc: "הישיבה של רב", big: true },
    { id: "nehardea", kind: "sage", name: "נהרדעא", icon: "🌙", x: 780, y: 1290, color: "#1d4ed8", desc: "העיר של שמואל", big: true },
    { id: "shop", kind: "link", href: "#/me", name: "השוק", icon: "🛍️", x: 500, y: 1430, color: "#ec4899", desc: "חנות הבגדים והאביזרים" },
    { id: "pumbedita", kind: "sage", name: "פומבדיתא", icon: "📖", x: 220, y: 1570, color: "#15803d", desc: "הישיבה של אביי", big: true },
    { id: "mechoza", kind: "sage", name: "מחוזא", icon: "⛵", x: 780, y: 1570, color: "#be123c", desc: "העיר של רבא", big: true },
  ];

  const START = { x: 500, y: 625 };
  window.TeireCity = { W, H, REGIONS, BUILDINGS, START, byId: id => BUILDINGS.find(b => b.id === id) };
})();
