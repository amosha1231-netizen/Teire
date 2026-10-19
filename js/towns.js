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

  const TOWNS = { jerusalem };
  window.Towns = { TOWNS, byId: id => TOWNS[id] };
})();
