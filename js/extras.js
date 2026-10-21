// הספרייה ללימוד (טקסטים מספריא), ואיסוף התוכן של קריית התורה מתיקיית content.
(function () {
  // ---------- ספרייה ללימוד (טקסטים מספריא) ----------
  const T = (he, en) => ({ he, en });
  const LIBRARY = {
    mishna: { name: "משנה", unit: "פרק", ref: (en, n) => en === "Pirkei Avot" ? `${en} ${n}` : `Mishnah ${en} ${n}`, books: [
      T("ברכות", "Berakhot"), T("פאה", "Peah"), T("שביעית", "Sheviit"), T("שבת", "Shabbat"), T("עירובין", "Eruvin"), T("פסחים", "Pesachim"),
      T("יומא", "Yoma"), T("סוכה", "Sukkah"), T("ביצה", "Beitzah"), T("ראש השנה", "Rosh Hashanah"), T("תענית", "Taanit"), T("מגילה", "Megillah"),
      T("חגיגה", "Chagigah"), T("כתובות", "Ketubot"), T("קידושין", "Kiddushin"), T("בבא קמא", "Bava Kamma"), T("בבא מציעא", "Bava Metzia"),
      T("בבא בתרא", "Bava Batra"), T("סנהדרין", "Sanhedrin"), T("אבות", "Pirkei Avot"), T("חולין", "Chullin"), T("מידות", "Middot"), T("ידים", "Yadayim"),
    ] },
    gemara: { name: "גמרא", unit: "דף", ref: (en, n) => `${en} ${n}`, books: [
      T("ברכות", "Berakhot"), T("שבת", "Shabbat"), T("עירובין", "Eruvin"), T("פסחים", "Pesachim"), T("יומא", "Yoma"), T("סוכה", "Sukkah"),
      T("ביצה", "Beitzah"), T("ראש השנה", "Rosh Hashanah"), T("תענית", "Taanit"), T("מגילה", "Megillah"), T("חגיגה", "Chagigah"),
      T("כתובות", "Ketubot"), T("גיטין", "Gittin"), T("קידושין", "Kiddushin"), T("בבא קמא", "Bava Kamma"), T("בבא מציעא", "Bava Metzia"),
      T("בבא בתרא", "Bava Batra"), T("סנהדרין", "Sanhedrin"), T("מכות", "Makkot"), T("עבודה זרה", "Avodah Zarah"), T("חולין", "Chullin"), T("נדה", "Niddah"),
    ] },
    sa: { name: "שולחן ערוך", unit: "סימן", ref: (en, n) => `Shulchan Arukh, ${en} ${n}`, books: [
      T("אורח חיים", "Orach Chayim"), T("יורה דעה", "Yoreh De'ah"), T("אבן העזר", "Even HaEzer"), T("חושן משפט", "Choshen Mishpat"),
    ] },
  };

  const { SPEAKERS, DEBATES } = window.TEIRE_DEBATES;
  window.TeireExtras = { SOURCES: window.TEIRE_CHALLENGES, SPEAKERS, DEBATES, LIBRARY };
})();
