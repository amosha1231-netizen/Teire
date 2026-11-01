# יהלומים 💎: קנייה בכסף אמיתי

## איך זה עובד

- **מטבעות 🪙** נשארים כמו היום: מרוויחים אותם במשחק, והם נשמרים בטלפון.
- **יהלומים 💎** קונים רק בכסף, באפליקציה, דרך Apple או Google. ביהלומים קונים בגדים מיוחדים בעמוד "הדמות שלי".
- היהלומים והפריטים שנקנו בהם נשמרים **רק בשרת**. השחקן לא יכול לשנות אותם: השרת לבדו מוסיף יהלומים (אחרי שהחנות מאשרת תשלום), קובע את המחיר ומוריד יהלומים בקנייה.
- כל מכשיר מקבל חשבון שקט בשרת, בלי הרשמה ובלי שם או אימייל. אפשר למחוק אותו בעמוד "הדמות שלי".
- בדפדפן רואים את היהלומים, אבל קונים רק באפליקציה.

```
קנייה באפליקציה → Apple / Google → RevenueCat → השרת שלנו (Supabase) מוסיף יהלומים → האפליקציה מציגה
```

כל עוד `GEMS: false` ב-`js/config.js`, שום דבר מזה לא מופיע באתר.

## מה עמוס צריך לעשות (פעם אחת)

### 1. Supabase

1. SQL Editor → New query → מדביקים את כל `supabase/update-10.sql` → Run.
2. Authentication → Sign In / Providers → מפעילים **Allow anonymous sign-ins** → Save.

### 2. App Store Connect (Apple)

1. **Business** (בעבר Agreements, Tax, and Banking): מאשרים את **Paid Apps Agreement**, מוסיפים חשבון בנק, וממלאים את טופס המס (לתושב ישראל: W-8BEN). בלי זה אי אפשר למכור.
2. נרשמים ל-**App Store Small Business Program**, כדי ש-Apple תיקח 15% ולא 30%.
3. באפליקציה → Monetization → **In-App Purchases** → `+`, סוג **Consumable**, שלוש פעמים:

| Product ID (בדיוק כך) | שם | מחיר מוצע |
|---|---|---|
| `gems_100` | 100 יהלומים | ₪4.90 |
| `gems_550` | 550 יהלומים | ₪19.90 |
| `gems_1200` | 1200 יהלומים | ₪39.90 |

לכל אחד: שם ותיאור בעברית, וצילום מסך של עמוד היהלומים (לבודקים).

4. Users and Access → Integrations → **In-App Purchase** → יוצרים מפתח ומורידים את קובץ ה-`.p8` (בשביל RevenueCat).

### 3. RevenueCat (חינם עד 2,500$ הכנסה בחודש)

1. נרשמים ב-[revenuecat.com](https://www.revenuecat.com) ויוצרים Project.
2. מוסיפים אפליקציית **App Store**: Bundle ID `com.amosha1231.teire`, ומעלים את קובץ ה-`.p8` משלב 2.4.
3. **Products**: מוסיפים את `gems_100`, `gems_550`, `gems_1200`.
4. **Offerings**: ב-Offering בשם `default` מוסיפים שלוש חבילות (Packages), אחת לכל מוצר.
5. **Integrations → Webhooks** → Add:
   - URL: `https://tbpcsfysaeizblrgybcz.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization header: מחרוזת ארוכה ואקראית שאתם ממציאים (שומרים אותה לשלב הבא).
6. **Project settings → API keys**: מעתיקים את המפתח הציבורי של iOS (מתחיל ב-`appl_`). הוא ציבורי, ומותר לשלוח לי אותו.

### 4. השרת שמקבל את אישורי התשלום (Supabase Edge Function)

1. Supabase → Edge Functions → **Deploy a new function** → **Via Editor**.
2. שם: `revenuecat-webhook`. מדביקים את כל `supabase/functions/revenuecat-webhook/index.ts` → Deploy.
3. בהגדרות הפונקציה מכבים את **Verify JWT** (RevenueCat לא שולח כניסה של Supabase; הפונקציה בודקת את ה-Authorization בעצמה).
4. Edge Functions → **Secrets** → Add: שם `REVENUECAT_WEBHOOK_AUTH`, וערך: אותה מחרוזת משלב 3.5.

### 5. לשלוח לי

את מפתח ה-`appl_` משלב 3.6, ולהגיד שסיימתם. אני אדליק את `GEMS` ואכניס את המפתח.

## מה החבר עם ה-Mac עושה

1. `git pull`, `npm install`, `npm run ios` (כמו בעדכון רגיל).
2. ב-Xcode → target **App** → **Signing & Capabilities** → `+ Capability` → **In-App Purchase**.
3. להעלות גרסה חדשה (Archive → Upload).
4. בשליחה לבדיקה ב-App Store Connect: בגרסה, בחלק **In-App Purchases**, לסמן את שלושת המוצרים כדי שייבדקו יחד עם הגרסה.

לבדיקה לפני שליחה: App Store Connect → Users and Access → **Sandbox** → יוצרים בודק, ובאייפון נכנסים איתו ב-הגדרות → App Store → Sandbox Account. קנייה בבודק כזה לא עולה כסף.

## Google Play

אותו דבר עובד גם באנדרואיד: מוסיפים ב-RevenueCat אפליקציית Play Store, יוצרים את אותם שלושה מוצרים ב-Play Console, ושמים את מפתח ה-`goog_` ב-`REVENUECAT_ANDROID_KEY`. צריך קודם את אפליקציית האנדרואיד עצמה.

## הוספת פריט יהלומים חדש

1. ב-`js/world.js` מוסיפים פריט עם `gems: <מחיר>` במקום `price`.
2. ב-Supabase מוסיפים שורה לטבלה `gem_items` עם אותו מזהה (`slot:id`, למשל `shirt:#14b8a6`) ואותו מחיר. המחיר בשרת הוא הקובע.
