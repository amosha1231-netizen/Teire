// 54 פרשות התורה לפי סדר החומשים. id = השם שנשמר בשאלה (parasha), names = איך מופיע השם בלוח (גם שמות חלופיים).
// כשיש שתי פרשות בשבוע אחד (למשל מטות-מסעי), הלוח מחזיר את שתיהן.
(function () {
  const BOOKS = [
    { id: "bereishit", he: "בראשית" }, { id: "shemot", he: "שמות" }, { id: "vayikra", he: "ויקרא" },
    { id: "bamidbar", he: "במדבר" }, { id: "devarim", he: "דברים" },
  ];
  const P = (book, id, he, alt) => ({ id, name: he, book, names: [he, ...(alt || [])] });
  const PARASHOT = [
    P("bereishit", "bereishit", "בראשית"), P("bereishit", "noach", "נח"), P("bereishit", "lech-lecha", "לך לך"),
    P("bereishit", "vayera", "וירא"), P("bereishit", "chayei-sara", "חיי שרה"), P("bereishit", "toldot", "תולדות"),
    P("bereishit", "vayetzei", "ויצא"), P("bereishit", "vayishlach", "וישלח"), P("bereishit", "vayeshev", "וישב"),
    P("bereishit", "mikeitz", "מקץ"), P("bereishit", "vayigash", "ויגש"), P("bereishit", "vayechi", "ויחי"),
    P("shemot", "shemot", "שמות"), P("shemot", "vaera", "וארא"), P("shemot", "bo", "בא"),
    P("shemot", "beshalach", "בשלח"), P("shemot", "yitro", "יתרו"), P("shemot", "mishpatim", "משפטים"),
    P("shemot", "terumah", "תרומה"), P("shemot", "tetzaveh", "תצוה"), P("shemot", "ki-tisa", "כי תשא"),
    P("shemot", "vayakhel", "ויקהל"), P("shemot", "pekudei", "פקודי"),
    P("vayikra", "vayikra", "ויקרא"), P("vayikra", "tzav", "צו"), P("vayikra", "shemini", "שמיני"),
    P("vayikra", "tazria", "תזריע"), P("vayikra", "metzora", "מצורע"), P("vayikra", "acharei-mot", "אחרי מות", ["אחרי"]),
    P("vayikra", "kedoshim", "קדושים"), P("vayikra", "emor", "אמור"), P("vayikra", "behar", "בהר"),
    P("vayikra", "bechukotai", "בחקותי"),
    P("bamidbar", "bamidbar", "במדבר"), P("bamidbar", "naso", "נשא"), P("bamidbar", "behaalotecha", "בהעלותך"),
    P("bamidbar", "shelach", "שלח לך", ["שלח"]), P("bamidbar", "korach", "קורח"), P("bamidbar", "chukat", "חקת"),
    P("bamidbar", "balak", "בלק"), P("bamidbar", "pinchas", "פינחס"), P("bamidbar", "matot", "מטות"),
    P("bamidbar", "masei", "מסעי"),
    P("devarim", "devarim", "דברים"), P("devarim", "vaetchanan", "ואתחנן"), P("devarim", "eikev", "עקב"),
    P("devarim", "reeh", "ראה"), P("devarim", "shoftim", "שופטים"), P("devarim", "ki-teitzei", "כי תצא"),
    P("devarim", "ki-tavo", "כי תבוא"), P("devarim", "nitzavim", "נצבים"), P("devarim", "vayelech", "וילך"),
    P("devarim", "haazinu", "האזינו"), P("devarim", "vezot-habracha", "וזאת הברכה", ["זאת הברכה"]),
  ];
  window.TEIRE_PARASHOT = { BOOKS, PARASHOT, byId: id => PARASHOT.find(p => p.id === id) };
})();
