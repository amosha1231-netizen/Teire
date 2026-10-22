// עולמות פנימיים: לוחצים על עיר במפת הארץ ונכנסים לתוכה, ובתוכה הולכים בין המקומות הקדושים.
// כל מקום (spot): href = מעבר לעמוד באתר, info = כרטיס מידע עם קישורים. ax/ay = נקודת הגעה אם שונה מהרגיל.
// blocked = אזורים שהדמות לא נכנסת אליהם (עוקפת אותם).
(function () {
  const jerusalem = {
    id: "jerusalem", name: "ירושלים", W: 1000, H: 1150,
    start: { x: 215, y: 560 },
    // הר הבית: לפי רוב הפוסקים לא עולים אליו בזמן הזה, אז הדמות מתפללת מהכותל ולא נכנסת
    blocked: [{ x1: 585, y1: 318, x2: 785, y2: 622 }],
    spots: [
      { id: "kotel", name: "הכותל המערבי", icon: "🧱", x: 515, y: 455, color: "#b08d57", href: "#/kotel" },
      { id: "mikdash", name: "מקום המקדש", icon: "✨", x: 685, y: 470, ax: 535, ay: 585, color: "#eab308", area: true,
        info: {
          title: "✨ מקום בית המקדש",
          text: "כאן עמדו בית המקדש הראשון והשני, ובמקום הזה נמצאת אבן השתייה, שממנה הושתת העולם (יומא נד, ב). רוב גדולי הפוסקים אוסרים לעלות להר הבית בזמן הזה, ולכן מתפללים מול הכותל, ומחכים שייבנה בית המקדש במהרה בימינו.",
          links: [["🏛️ שאלות על בית המקדש", "#/place/mikdash"], ["🌳 משימת אבן השתייה: בריאת העולם", "#/place/gan-eden"]],
        } },
      { id: "beit-midrash", name: "בית המדרש של הלל ושמאי", icon: "🏛️", x: 405, y: 600, color: "#eab308", href: "#/b/jerusalem", sagesOf: "jerusalem" },
      { id: "hurva", name: "בית הכנסת החורבה", icon: "🕍", x: 380, y: 400, color: "#2563eb",
        info: {
          title: "🕍 בית הכנסת החורבה",
          text: "בית הכנסת הגדול של הרובע היהודי. תלמידי הגר\"א בנו אותו מחדש במאה ה-19, הוא נחרב במלחמת העצמאות (תש\"ח), ונבנה שוב בשנת תש\"ע (2010).",
          links: [["🎯 משימת בית הכנסת: ברכות, תפילה וחגים", "#/place/beit-knesset"]],
        } },
      { id: "arena", name: "זירת שער יפו", icon: "⚔️", x: 150, y: 450, color: "#0891b2", href: "#/duel/jerusalem", duel: true },
      { id: "david", name: "קבר דוד המלך", icon: "👑", x: 330, y: 880, color: "#7c3aed", href: "#/place/david" },
      { id: "shiloach", name: "עיר דוד והשילוח", icon: "💧", x: 660, y: 845, color: "#0ea5e9",
        info: {
          title: "💧 עיר דוד ומעיין השילוח",
          text: "כאן הייתה ירושלים בימי דוד המלך. ממעיין השילוח שאבו מים לניסוך המים בחג הסוכות, ושמחו בשמחת בית השואבה: \"מי שלא ראה שמחת בית השואבה, לא ראה שמחה מימיו\" (סוכה נא, א).",
          links: [["👑 משימת דוד המלך", "#/place/david"]],
        } },
      { id: "zeitim", name: "הר הזיתים", icon: "🫒", x: 910, y: 430, color: "#4d7c0f",
        info: {
          title: "🫒 הר הזיתים",
          text: "מול הר הבית, מעבר לנחל קדרון. כאן נמצא בית הקברות היהודי החשוב ביותר, ועליו אמר הנביא: \"ועמדו רגליו ביום ההוא על הר הזיתים אשר על פני ירושלים מקדם\" (זכריה יד, ד).",
          links: [],
        } },
      { id: "torah-city", name: "לקריית התורה", icon: "🏙️", x: 870, y: 1060, color: "#1e3a8a", href: "#/town/torah" },
      { id: "shuk", name: "שוק מחנה יהודה", icon: "🛍️", x: 120, y: 190, color: "#ec4899", href: "#/me" },
      { id: "exit", name: "למפת ארץ ישראל", icon: "🗺️", x: 120, y: 1040, color: "#16a34a", href: "#/", exit: true },
    ],
    // הרקע: חומות העיר העתיקה, הר הבית, הכותל, נחל קדרון וההרים מסביב
    svg(W, H) {
      const stones = [];
      for (let y = 478; y < 610; y += 13) for (let x = 0; x < 3; x++) stones.push(`<rect x="${560 + x * 8 + (y % 26 ? 4 : 0)}" y="${y}" width="8" height="13" fill="none" stroke="#b49a63" stroke-width="1"/>`);
      return `<svg class="map-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <defs>
          <radialGradient id="glow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stop-color="#fff7c2" stop-opacity=".95"/><stop offset=".6" stop-color="#ffe27a" stop-opacity=".45"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/>
          </radialGradient>
          <pattern id="tiles" width="36" height="36" patternUnits="userSpaceOnUse">
            <rect width="36" height="36" fill="#efe1bf"/><path d="M0 18h36M18 0v18M0 36h0M9 18v18M27 18v18" stroke="#e0cd9f" stroke-width="2"/>
          </pattern>
        </defs>
        <rect width="${W}" height="${H}" fill="#cfe3a0"/>
        <!-- הרים: הר הזיתים במזרח והר ציון בדרום-מערב -->
        <ellipse cx="930" cy="470" rx="150" ry="330" fill="#b9d58a"/>
        <ellipse cx="320" cy="905" rx="190" ry="120" fill="#d9cf98"/>
        <ellipse cx="655" cy="870" rx="120" ry="150" fill="#dccb92"/>
        <!-- נחל קדרון -->
        <path d="M835 120 C 820 350, 850 560, 815 760 S 760 1000, 790 1150" fill="none" stroke="#86b86a" stroke-width="40" stroke-linecap="round"/>
        <path d="M835 120 C 820 350, 850 560, 815 760 S 760 1000, 790 1150" fill="none" stroke="#6aa64f" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 22"/>
        <!-- דרכים -->
        <path d="M120 230 C 160 360, 160 470, 235 540" fill="none" stroke="#e7d7ad" stroke-width="30" stroke-linecap="round"/>
        <path d="M235 560 C 240 700, 280 820, 320 950 L 140 1060" fill="none" stroke="#e7d7ad" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M560 760 C 600 800, 640 820, 660 900" fill="none" stroke="#e7d7ad" stroke-width="26" stroke-linecap="round"/>
        <!-- העיר העתיקה -->
        <rect x="250" y="300" width="550" height="480" fill="url(#tiles)"/>
        <path d="M300 520 H 560 M410 320 V 760 M300 680 H 560" stroke="#f8efd8" stroke-width="22" stroke-linecap="round"/>
        <rect x="250" y="300" width="550" height="480" fill="none" stroke="#c9ad74" stroke-width="18"/>
        <rect x="250" y="300" width="550" height="480" fill="none" stroke="#e2cc98" stroke-width="18" stroke-dasharray="14 10"/>
        <!-- שער יפו ושער ציון -->
        <rect x="236" y="500" width="30" height="48" rx="4" fill="#a8895a"/><path d="M243 548 v-22 a8 8 0 0 1 16 0 v22z" fill="#5b4320"/>
        <rect x="370" y="766" width="48" height="30" rx="4" fill="#a8895a"/><path d="M382 796 v-12 a12 10 0 0 1 24 0 v12z" fill="#5b4320"/>
        <!-- הר הבית: רחבה מוגבהת עם אור, ובית המקדש מצויר בקווים כמו חזון -->
        <rect x="585" y="318" width="200" height="304" rx="6" fill="#e9d9ab" stroke="#c9ad74" stroke-width="6"/>
        <ellipse cx="685" cy="460" rx="140" ry="150" fill="url(#glow)" class="mikdash-glow"/>
        <g fill="none" stroke="#d4a017" stroke-width="3" stroke-dasharray="8 6" opacity=".85">
          <rect x="640" y="400" width="90" height="120" rx="4"/>
          <rect x="620" y="515" width="130" height="18" rx="3"/>
          <path d="M655 400 V 375 H 715 V 400"/>
        </g>
        <!-- הכותל והרחבה שלפניו -->
        <rect x="460" y="472" width="118" height="150" fill="#f6eed8"/>
        <rect x="558" y="470" width="28" height="145" fill="#dcc690"/>
        ${stones.join("")}
        <circle cx="568" cy="500" r="5" fill="#7aa34f"/><circle cx="578" cy="560" r="4" fill="#7aa34f"/>
        <path d="M470 600 H 556" stroke="#c7b07a" stroke-width="4" stroke-dasharray="6 4"/>
      </svg>`;
    },
    labels: [
      { text: "העיר העתיקה", x: 300, y: 330, cls: "land" },
      { text: "הר הבית", x: 685, y: 340, cls: "land" },
      { text: "נחל קדרון", x: 840, y: 650, cls: "land small" },
      { text: "הר ציון", x: 230, y: 960, cls: "land" },
    ],
    decorations: [
      ["🫒", 880, 250], ["🫒", 960, 320], ["🫒", 900, 560], ["🫒", 960, 640], ["🪨", 930, 720], ["🌳", 140, 640],
      ["🌳", 520, 880], ["🌲", 70, 380], ["🌳", 200, 1120], ["🌿", 470, 1000], ["🐑", 560, 1060], ["🌳", 880, 960],
      ["🕊️", 640, 360], ["🕯️", 330, 620], ["🌳", 120, 800], ["🌸", 240, 1010], ["🐐", 980, 860],
    ],
  };

  const hebron = {
    id: "hebron", name: "חברון", W: 1000, H: 1000,
    start: { x: 170, y: 880 },
    blocked: [],
    spots: [
      { id: "machpela", name: "מערת המכפלה", icon: "🕯️", x: 640, y: 380, color: "#a16207",
        info: {
          title: "🕯️ מערת המכפלה",
          text: "כאן קבורים אברהם ושרה, יצחק ורבקה, יעקב ולאה (בראשית מט, לא). אברהם קנה את המערה מעפרון החתי בארבע מאות שקל כסף (בראשית כג, טז). לכן נקראת חברון \"קרית ארבע\": ארבעה זוגות קבורים בה, כי לפי חז\"ל גם אדם וחוה קבורים כאן (עירובין נג, א).",
          links: [["⛺ משימת האבות והאמהות", "#/place/ohel"]],
        } },
      { id: "mamre", name: "אלוני ממרא", icon: "🌳", x: 300, y: 330, color: "#65a30d",
        info: {
          title: "🌳 אלוני ממרא",
          text: "\"וירא אליו ה' באלוני ממרא, והוא יושב פתח האהל כחום היום\" (בראשית יח, א). כאן הכניס אברהם אבינו את שלושת המלאכים לאוהל שלו, ורץ להביא להם לחם, חמאה וחלב ובן בקר.",
          links: [["⛺ משימת האבות והאמהות", "#/place/ohel"]],
        } },
      { id: "tel", name: "תל חברון: ישי ורות", icon: "🌾", x: 330, y: 620, color: "#ca8a04",
        info: {
          title: "🌾 תל חברון",
          text: "כאן עמדה חברון העתיקה, שבה מלך דוד שבע שנים וששה חודשים לפני שעלה לירושלים (שמואל ב ה, ה). לפי המסורת קבורים כאן ישי, אביו של דוד, ורות המואביה.",
          links: [["👑 משימת דוד המלך", "#/place/david"]],
        } },
      { id: "exit", name: "למפת ארץ ישראל", icon: "🗺️", x: 120, y: 940, color: "#16a34a", href: "#/", exit: true },
    ],
    svg(W, H) {
      const vines = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) vines.push(`<circle cx="${720 + c * 52}" cy="${640 + r * 60}" r="13" fill="#5b8c32"/><circle cx="${720 + c * 52}" cy="${650 + r * 60}" r="6" fill="#6b2a7a"/>`);
      return `<svg class="map-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <rect width="${W}" height="${H}" fill="#d7e3a2"/>
        <ellipse cx="300" cy="300" rx="260" ry="200" fill="#c4d98f"/>
        <ellipse cx="330" cy="640" rx="200" ry="130" fill="#e3d29a"/>
        <rect x="690" y="600" width="290" height="270" rx="30" fill="#c8dc96"/>
        ${vines.join("")}
        <path d="M120 930 C 250 800, 300 700, 420 560 S 560 460, 640 470" fill="none" stroke="#eadcb4" stroke-width="34" stroke-linecap="round"/>
        <path d="M420 560 C 380 470, 330 420, 300 400" fill="none" stroke="#eadcb4" stroke-width="26" stroke-linecap="round"/>
        <!-- המבנה של מערת המכפלה: חומה גבוהה מאבנים גדולות -->
        <rect x="520" y="300" width="250" height="170" fill="#d8c28d" stroke="#b39a5f" stroke-width="6"/>
        <path d="M520 330 H 770 M520 360 H 770 M520 390 H 770 M520 420 H 770" stroke="#c4ab72" stroke-width="3"/>
        <g fill="#b39a5f">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${528 + i * 31}" y="285" width="16" height="18"/>`).join("")}</g>
      </svg>`;
    },
    labels: [
      { text: "כרמי חברון", x: 830, y: 590, cls: "land" },
      { text: "קרית ארבע היא חברון", x: 640, y: 520, cls: "land small" },
    ],
    decorations: [
      ["🌳", 200, 230], ["🌳", 420, 260], ["🌳", 250, 450], ["🫒", 120, 560], ["🐑", 520, 700], ["🐑", 560, 760],
      ["🐪", 860, 300], ["🌿", 470, 880], ["🌳", 900, 150], ["⛺", 180, 360], ["🪨", 760, 960],
    ],
  };

  const tzfat = {
    id: "tzfat", name: "צפת", W: 1000, H: 1050,
    start: { x: 520, y: 930 },
    blocked: [],
    spots: [
      { id: "ari", name: "בית הכנסת האר\"י", icon: "🕍", x: 500, y: 330, color: "#2563eb",
        info: {
          title: "🕍 בית הכנסת האר\"י",
          text: "על שם האר\"י הקדוש, רבי יצחק לוריא, גדול המקובלים, שלימד בצפת לפני כ-450 שנה. הוא חי בצפת רק כשנתיים, ותורתו מאירה עד היום.",
          links: [["🎯 משימת בית הכנסת: ברכות, תפילה וחגים", "#/place/beit-knesset"]],
        } },
      { id: "karo", name: "בית הכנסת של מרן", icon: "📘", x: 720, y: 470, color: "#1d4ed8",
        info: {
          title: "📘 בית הכנסת של רבי יוסף קארו",
          text: "בצפת כתב מרן רבי יוסף קארו את ה\"בית יוסף\" ואת ה\"שולחן ערוך\", ספר ההלכה שכל ישראל לומדים ופוסקים לפיו.",
          links: [["📜 מסע במשנה", "#/place/mishna"]],
        } },
      { id: "abuhav", name: "בית הכנסת אבוהב", icon: "📜", x: 290, y: 500, color: "#0ea5e9",
        info: {
          title: "📜 בית הכנסת אבוהב",
          text: "בית כנסת עתיק בעיר העתיקה של צפת, על שם רבי יצחק אבוהב, מחכמי ספרד.",
          links: [],
        } },
      { id: "lecha", name: "שדה קבלת שבת", icon: "🌅", x: 830, y: 230, color: "#f59e0b",
        info: {
          title: "🌅 לכה דודי",
          text: "בצפת חיבר רבי שלמה אלקבץ את הפיוט \"לכה דודי\". המקובלים יצאו לשדות בערב שבת לקבל את השבת כמו שמקבלים כלה, ומכאן התפשט מנהג קבלת שבת לכל העולם.",
          links: [],
        } },
      { id: "cemetery", name: "בית העלמין העתיק", icon: "🕯️", x: 180, y: 760, color: "#3b82f6",
        info: {
          title: "🕯️ בית העלמין העתיק",
          text: "על מדרון ההר קבורים גדולי צפת: האר\"י הקדוש, רבי יוסף קארו, הרמ\"ק (רבי משה קורדובירו), רבי שלמה אלקבץ ועוד צדיקים רבים.",
          links: [],
        } },
      { id: "meron-road", name: "הדרך למירון", icon: "🔥", x: 120, y: 260, color: "#ea580c", href: "#/town/meron" },
      { id: "exit", name: "למפת ארץ ישראל", icon: "🗺️", x: 870, y: 980, color: "#16a34a", href: "#/", exit: true },
    ],
    svg(W, H) {
      const houses = [];
      for (let i = 0; i < 26; i++) {
        const x = 230 + (i * 137) % 560, y = 260 + ((i * 89) % 520);
        if (this.spots.some(sp => Math.abs(sp.x - x - 23) < 85 && Math.abs(sp.y - y) < 90)) continue; // לא מסתירים את המקומות
        houses.push(`<rect x="${x}" y="${y}" width="46" height="36" rx="4" fill="#f3ecdc" stroke="#d6cbb0" stroke-width="2"/><rect x="${x + 17}" y="${y + 14}" width="12" height="22" rx="5" fill="#3b82f6"/>`);
      }
      const graves = [];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) graves.push(`<rect x="${70 + c * 34 + r * 6}" y="${640 + r * 46}" width="22" height="12" rx="3" fill="#60a5fa"/>`);
      return `<svg class="map-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <rect width="${W}" height="${H}" fill="#b9d58a"/>
        <!-- ההר של צפת והמצודה בראשו -->
        <ellipse cx="520" cy="520" rx="420" ry="400" fill="#cfe0a0"/>
        <ellipse cx="520" cy="470" rx="300" ry="290" fill="#dfe8b5"/>
        <circle cx="520" cy="170" r="70" fill="#c9b98b"/><circle cx="520" cy="170" r="50" fill="#d9cba0"/>
        <path d="M120 950 C 300 880, 420 800, 470 640 S 560 420, 520 240" fill="none" stroke="#e9dfc4" stroke-width="30" stroke-linecap="round"/>
        <path d="M230 520 H 800 M300 380 C 400 420, 620 420, 760 380 M260 650 C 420 690, 640 690, 780 640" fill="none" stroke="#efe6cf" stroke-width="20" stroke-linecap="round"/>
        ${houses.join("")}
        <path d="M40 620 L 300 600 L 330 900 L 30 920 Z" fill="#d5dcb0"/>
        ${graves.join("")}
      </svg>`;
    },
    labels: [
      { text: "המצודה", x: 520, y: 170, cls: "land small" },
      { text: "העיר העתיקה", x: 520, y: 600, cls: "land" },
      { text: "הרי הגליל", x: 860, y: 760, cls: "land" },
    ],
    decorations: [
      ["🌲", 860, 400], ["🌲", 920, 520], ["🌲", 100, 420], ["🌲", 840, 860], ["🌳", 650, 900], ["🕊️", 560, 300],
      ["🌲", 380, 120], ["🌲", 680, 110], ["🕯️", 470, 470], ["🌸", 760, 300], ["🌲", 960, 220],
    ],
  };

  const tiberias = {
    id: "tiberias", name: "טבריה", W: 1000, H: 1000,
    start: { x: 160, y: 880 },
    // הכנרת: הדמות הולכת על החוף ולא נכנסת למים
    blocked: [{ x1: 700, y1: 0, x2: 1000, y2: 1000 }],
    spots: [
      { id: "arena", name: "זירת הדו-קרב", icon: "⚔️", x: 560, y: 520, color: "#0891b2", href: "#/duel/tiberias", duel: true },
      { id: "rambam", name: "קבר הרמב\"ם", icon: "📗", x: 330, y: 300, color: "#15803d",
        info: {
          title: "📗 קבר הרמב\"ם",
          text: "רבנו משה בן מימון, שכתב את \"משנה תורה\" (היד החזקה) ואת \"מורה הנבוכים\". הוא נפטר במצרים, ולפי המסורת הביאו אותו לקבורה בטבריה. אמרו עליו: \"ממשה עד משה לא קם כמשה\".",
          links: [["📖 מסע בגמרא", "#/place/gemara"]],
        } },
      { id: "meir", name: "רבי מאיר בעל הנס", icon: "🕯️", x: 590, y: 820, color: "#1d4ed8",
        info: {
          title: "🕯️ רבי מאיר בעל הנס",
          text: "רבי מאיר, תלמידו של רבי עקיבא, מגדולי התנאים. \"סתם משנה רבי מאיר\" (סנהדרין פו, א): משנה בלי שם בעל הדעה היא בדרך כלל לפי רבי מאיר.",
          links: [["📜 מסע במשנה", "#/place/mishna"]],
        } },
      { id: "akiva", name: "קבר רבי עקיבא", icon: "🌴", x: 200, y: 520, color: "#f97316",
        info: {
          title: "🌴 קבר רבי עקיבא",
          text: "לפי המסורת רבי עקיבא קבור על ההר שמעל טבריה. הוא התחיל ללמוד בגיל ארבעים והיו לו עשרים וארבעה אלף תלמידים.",
          links: [["🌴 לבית המדרש של רבי עקיבא בבני ברק", "#/b/bnei-brak"]],
        } },
      { id: "sanhedrin", name: "מקום הסנהדרין", icon: "⚖️", x: 470, y: 180, color: "#7c3aed",
        info: {
          title: "⚖️ הסנהדרין בטבריה",
          text: "אחרי החורבן גלתה הסנהדרין עשר גלויות, והמקום האחרון שלה היה טבריה (ראש השנה לא, א-ב). בטבריה לימד רבי יוחנן, ושם נערך רוב התלמוד הירושלמי.",
          links: [],
        } },
      { id: "exit", name: "למפת ארץ ישראל", icon: "🗺️", x: 110, y: 950, color: "#16a34a", href: "#/", exit: true },
    ],
    svg(W, H) {
      return `<svg class="map-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <defs><pattern id="lake" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 20 q10 -8 20 0 t20 0" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="3" stroke-linecap="round"/></pattern></defs>
        <rect width="${W}" height="${H}" fill="#cfe3a0"/>
        <ellipse cx="160" cy="420" rx="230" ry="300" fill="#bcd58c"/>
        <path d="M700 0 C 660 200, 690 420, 660 600 S 690 860, 700 1000 H 1000 V 0 Z" fill="#f2e2a8"/>
        <path d="M735 0 C 700 200, 730 420, 700 600 S 730 860, 740 1000 H 1000 V 0 Z" fill="#3fa0e0"/>
        <path d="M735 0 C 700 200, 730 420, 700 600 S 730 860, 740 1000 H 1000 V 0 Z" fill="url(#lake)" class="waves"/>
        <path d="M110 950 C 250 820, 380 700, 520 600 S 620 400, 560 150" fill="none" stroke="#eadcb4" stroke-width="30" stroke-linecap="round"/>
        <path d="M520 600 C 560 700, 600 760, 600 850" fill="none" stroke="#eadcb4" stroke-width="24" stroke-linecap="round"/>
        <path d="M230 560 C 300 420, 320 350, 340 330" fill="none" stroke="#eadcb4" stroke-width="22" stroke-linecap="round"/>
        <path d="M640 120 V 900" stroke="#e7d6a6" stroke-width="16" stroke-dasharray="2 18" stroke-linecap="round"/>
      </svg>`;
    },
    labels: [
      { text: "ים כנרת", x: 860, y: 500, cls: "sea" },
      { text: "הטיילת", x: 610, y: 330, cls: "land small" },
    ],
    decorations: [
      ["⛵", 860, 250], ["🐟", 820, 700], ["⛵", 900, 860], ["🌴", 640, 420], ["🌴", 650, 700], ["🌴", 120, 300],
      ["🌳", 380, 450], ["🌿", 300, 760], ["🪨", 90, 640], ["🌴", 450, 900], ["🐟", 950, 120],
    ],
  };

  const meron = {
    id: "meron", name: "מירון", W: 1000, H: 950,
    start: { x: 180, y: 860 },
    blocked: [],
    spots: [
      { id: "rashbi", name: "ציון רשב\"י", icon: "🔥", x: 560, y: 330, color: "#ea580c", href: "#/b/meron", sagesOf: "meron" },
      { id: "hadlaka", name: "מתחם ההדלקה", icon: "🎆", x: 800, y: 260, color: "#f59e0b",
        info: {
          title: "🎆 ל\"ג בעומר במירון",
          text: "בל\"ג בעומר, יום ההילולא של רבי שמעון בר יוחאי, עולים רבים למירון, מדליקים מדורות ושרים \"בר יוחאי נמשחת אשריך\". רבי שמעון ובנו רבי אלעזר קבורים יחד במקום הזה.",
          links: [["🔥 לרבי שמעון: עיבור נשמה ולימוד", "#/b/meron"]],
        } },
      { id: "hillel", name: "קברי הלל ושמאי", icon: "📜", x: 300, y: 520, color: "#eab308",
        info: {
          title: "📜 קברי הלל ושמאי",
          text: "לפי המסורת, במורד ההר ליד מירון קבורים הלל הזקן ושמאי הזקן ותלמידיהם. בית הלל ובית שמאי נחלקו בהרבה דברים, אבל \"אלו ואלו דברי אלוקים חיים\" (עירובין יג, ב).",
          links: [["🏛️ לבית המדרש של הלל ושמאי בירושלים", "#/b/jerusalem"]],
        } },
      { id: "mearah", name: "מערת רשב\"י", icon: "🪨", x: 780, y: 620, color: "#78716c",
        info: {
          title: "🪨 שתים עשרה שנה במערה",
          text: "רבי שמעון ובנו ברחו מהרומאים והתחבאו במערה שתים עשרה שנה. נברא להם נס: עץ חרוב ומעיין מים, והם למדו תורה כל היום (שבת לג, ב). לפי המסורת המערה הייתה בפקיעין, לא רחוק ממירון.",
          links: [["📖 מסע בגמרא", "#/place/gemara"]],
        } },
      { id: "tzfat-road", name: "הדרך לצפת", icon: "🕯️", x: 880, y: 860, color: "#2563eb", href: "#/town/tzfat" },
      { id: "exit", name: "למפת ארץ ישראל", icon: "🗺️", x: 110, y: 900, color: "#16a34a", href: "#/", exit: true },
    ],
    svg(W, H) {
      const fires = [[760, 200], [840, 210], [800, 170]].map(([x, y]) => `<g class="fire"><path d="M${x - 14} ${y + 20} Q ${x} ${y - 30} ${x + 14} ${y + 20} Z" fill="#f97316"/><path d="M${x - 7} ${y + 20} Q ${x} ${y - 6} ${x + 7} ${y + 20} Z" fill="#fde047"/></g>`).join("");
      return `<svg class="map-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <rect width="${W}" height="${H}" fill="#b9d58a"/>
        <ellipse cx="560" cy="330" rx="420" ry="300" fill="#a9cb7a"/>
        <ellipse cx="560" cy="300" rx="260" ry="190" fill="#c9dd9a"/>
        <path d="M110 900 C 260 800, 330 650, 420 520 S 520 420, 560 400" fill="none" stroke="#eadcb4" stroke-width="30" stroke-linecap="round"/>
        <path d="M560 400 C 700 420, 800 560, 880 860" fill="none" stroke="#eadcb4" stroke-width="26" stroke-linecap="round"/>
        <path d="M620 320 C 700 300, 760 280, 800 280" fill="none" stroke="#eadcb4" stroke-width="22" stroke-linecap="round"/>
        <circle cx="800" cy="220" r="62" fill="#e7d3a0"/>
        ${fires}
        <path d="M740 640 a40 34 0 0 1 80 0 z" fill="#57534e"/>
      </svg>`;
    },
    labels: [
      { text: "הר מירון", x: 560, y: 130, cls: "land" },
    ],
    decorations: [
      ["🌲", 300, 200], ["🌲", 380, 120], ["🌳", 200, 380], ["🌲", 950, 420], ["🌲", 680, 520], ["🌳", 460, 700],
      ["🐐", 640, 760], ["🌲", 120, 600], ["🌿", 960, 700], ["🌲", 920, 120], ["🌳", 400, 860],
    ],
  };

  // קריית התורה: הכוללים של הרבנים, האתגרים, חדר הוויכוח והספרייה
  const torah = {
    id: "torah", name: "קריית התורה", W: 1000, H: 1000,
    start: { x: 500, y: 900 },
    blocked: [],
    spots: [
      { id: "k-ovadia", name: "כולל הרב עובדיה יוסף", icon: "📘", x: 200, y: 180, color: "#1e3a8a", href: "#/place/kollel-ovadia" },
      { id: "k-yitzhak", name: "כולל הרב יצחק יוסף", icon: "📗", x: 420, y: 150, color: "#155e75", href: "#/place/kollel-yitzhak" },
      { id: "k-david", name: "כולל הרב דוד יוסף", icon: "📙", x: 640, y: 150, color: "#3730a3", href: "#/place/kollel-david" },
      { id: "k-orlezion", name: "כולל האור לציון", icon: "📕", x: 860, y: 180, color: "#065f46", href: "#/place/kollel-orlezion" },
      { id: "k-yigal", name: "כולל הרב יגאל כהן", icon: "📒", x: 860, y: 420, color: "#9a3412", href: "#/place/kollel-yigal" },
      { id: "library", name: "ספריית הלימוד", icon: "📚", x: 180, y: 430, color: "#7c2d12", href: "#/learn" },
      { id: "debate", name: "חדר הוויכוח", icon: "🎭", x: 500, y: 430, color: "#111827", href: "#/debate" },
      { id: "swipe", name: "אתגר המקורות", icon: "⚡", x: 220, y: 680, color: "#db2777", href: "#/swipe" },
      { id: "race", name: "מרוץ המקורות", icon: "🏎️", x: 780, y: 680, color: "#dc2626", href: "#/race" },
      { id: "exit", name: "למפת ארץ ישראל", icon: "🗺️", x: 120, y: 930, color: "#16a34a", href: "#/", exit: true },
    ],
    svg(W, H) {
      return `<svg class="map-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <rect width="${W}" height="${H}" fill="#cfe3a0"/>
        <rect x="60" y="60" width="880" height="300" rx="30" fill="#efe1bf"/>
        <path d="M80 270 H 920 M500 270 V 900 M120 560 H 880" stroke="#f8efd8" stroke-width="34" stroke-linecap="round"/>
        <circle cx="500" cy="560" r="70" fill="#bfdbfe" stroke="#f8efd8" stroke-width="14"/>
        <circle cx="500" cy="560" r="30" fill="#93c5fd"/>
        <!-- מסלול המרוץ -->
        <rect x="690" y="610" width="180" height="250" rx="40" fill="none" stroke="#6b7280" stroke-width="26"/>
        <rect x="690" y="610" width="180" height="250" rx="40" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="14 12"/>
      </svg>`;
    },
    labels: [
      { text: "שדרת הכוללים", x: 500, y: 330, cls: "land small" },
    ],
    decorations: [
      ["🌳", 330, 520], ["🌳", 670, 520], ["⛲", 500, 560], ["🌲", 60, 600], ["🌳", 950, 560], ["🌷", 380, 820],
      ["🌳", 620, 820], ["🕊️", 300, 80], ["🌲", 950, 900], ["🌿", 100, 820],
    ],
  };

  // היכל פרשת השבוע: חדר לכל פרשן, חדר השלמת הפסוק, ובאמצע ספר התורה עם הפרשה של השבוע.
  // שם הפרשה נקבע בכל פתיחה (אחרי שנקבע הלוח), לכן spots ו-labels הם getters.
  const PAR = window.TEIRE_PARASHA;
  const SEATS = [[170, 260], [400, 170], [600, 170], [830, 260], [190, 560], [810, 560]];
  const parasha = {
    id: "parasha", name: "היכל פרשת השבוע", W: 1000, H: 1000,
    start: { x: 500, y: 880 },
    blocked: [],
    get spots() {
      const pname = PAR && PAR.current.name;
      return [
        ...(PAR ? PAR.COMMENTATORS : []).map((c, i) => ({ id: "h-" + c.id, name: `היכל ${c.name}`, icon: c.icon, x: SEATS[i][0], y: SEATS[i][1], color: c.color, href: `#/place/parasha-${c.id}` })),
        { id: "verse", name: "היכל השלמת הפסוק", icon: "🔤", x: 500, y: 790, color: "#0f172a", href: "#/place/verse-hall" },
        { id: "sefer", name: pname ? `פרשת ${pname}` : "פרשת השבוע", icon: "📖", x: 500, y: 470, color: "#a16207",
          info: {
            title: pname ? `📖 פרשת השבוע: ${pname}` : "📖 פרשת השבוע",
            text: pname ? `השבוע קוראים את פרשת ${pname}. בכל היכל מופיע פסוק מהפרשה, וצריך לדייק מה הפרשן אומר עליו. בהיכל השלמת הפסוק משלימים מילה חסרה מכל התורה.` : "",
            links: (PAR ? PAR.COMMENTATORS : []).map(c => [`${c.icon} היכל ${c.name}`, `#/place/parasha-${c.id}`]),
          } },
        { id: "exit", name: "למפת ארץ ישראל", icon: "🗺️", x: 120, y: 930, color: "#16a34a", href: "#/", exit: true },
      ];
    },
    svg(W, H) {
      const cols = [230, 360, 640, 770].map(x => `<rect x="${x - 14}" y="330" width="28" height="420" rx="8" fill="#f5e6c8" stroke="#d6b77a" stroke-width="3"/>`).join("");
      return `<svg class="map-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <rect width="${W}" height="${H}" fill="#e7d3a8"/>
        <rect x="40" y="40" width="920" height="920" rx="40" fill="#f3e5c4" stroke="#c9a467" stroke-width="10"/>
        <path d="M500 960 V 560" stroke="#b91c1c" stroke-width="90" opacity=".55"/>
        <path d="M500 960 V 560" stroke="#fbbf24" stroke-width="6" stroke-dasharray="2 18" opacity=".7"/>
        <circle cx="500" cy="470" r="120" fill="#fde68a" opacity=".55"/>
        <circle cx="500" cy="470" r="80" fill="#fcd34d" opacity=".5"/>
        ${cols}
        <path d="M120 120 Q 500 20 880 120" fill="none" stroke="#c9a467" stroke-width="8"/>
      </svg>`;
    },
    get labels() {
      const pname = PAR && PAR.current.name;
      return [{ text: pname ? `פרשת ${pname}` : "", x: 500, y: 600, cls: "land small" }];
    },
    decorations: [["🕯️", 300, 470], ["🕯️", 700, 470], ["📚", 90, 420], ["📚", 910, 420], ["🪔", 500, 90], ["🌿", 90, 760], ["🌿", 910, 760]],
  };

  const TOWNS = { jerusalem, hebron, tzfat, tiberias, meron, torah, parasha };
  window.Towns = { TOWNS, byId: id => TOWNS[id] };
})();
