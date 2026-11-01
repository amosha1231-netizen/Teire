// הגדרות האתר.
// כל עוד SUPABASE_URL ריק, האתר עובד ב"מצב מקומי": השאלות וההצעות נשמרות רק בדפדפן הזה.
// כדי שכל המשתמשים יראו את אותן שאלות, מלאו כאן את הפרטים מ-Supabase (ראו README.md).
window.TEIRE_CONFIG = {
  SUPABASE_URL: "https://tbpcsfysaeizblrgybcz.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_HwFTpE3QqIGDa_2aulwfFg_RmRR59cP",
  // קוד מנהל למצב מקומי בלבד (לבדיקה על המחשב שלכם). במצב Supabase הכניסה היא עם אימייל וסיסמה.
  LOCAL_ADMIN_PIN: "1234",
  QUESTIONS_PER_MISSION: 5,
  // חשבונות שחקנים (שם משתמש וסיסמה). להפעיל רק אחרי שמריצים supabase/update-4.sql ב-Supabase.
  ACCOUNTS: false,
  // יהלומים 💎 שקונים בכסף אמיתי באפליקציה. להפעיל רק אחרי supabase/update-10.sql ואחרי שמפעילים
  // Anonymous sign-ins ב-Supabase (ראו docs/PURCHASES.md).
  GEMS: false,
  // המפתחות הציבוריים מ-RevenueCat (Project settings -> API keys). ריק = אין קנייה במכשיר הזה.
  REVENUECAT_IOS_KEY: "",
  REVENUECAT_ANDROID_KEY: "",
};
