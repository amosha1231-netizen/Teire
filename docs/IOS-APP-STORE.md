# העלאת "מסע בתורה" ל-App Store

ההוראות האלה מיועדות למי שמעלה את האפליקציה מ-Mac. כל ההכנות בקוד כבר נעשו: פרויקט האייפון נמצא בתיקייה `ios`, כולל אייקון, מסך פתיחה, מזהה האפליקציה והרשאת המיקום. צריך רק לבנות, לחתום ולהעלות.

זמן משוער לפעם הראשונה: 3 עד 4 שעות, שרובן הורדה של Xcode.

## מה צריך לפני שמתחילים

1. **Mac עם macOS עדכני.** Xcode החדש דורש macOS עדכני, ו-Apple מקבלת רק אפליקציות שנבנו ב-Xcode עדכני. אם ה-Mac ישן מדי ולא מאפשר להתקין את Xcode האחרון מה-App Store, הוא לא יתאים.
2. **Xcode** מה-App Store של ה-Mac (חינם, בערך 15GB). אחרי ההתקנה פותחים אותו פעם אחת ומאשרים את ההתקנה של הרכיבים הנוספים, כולל iOS.
3. **Node.js 22 ומעלה** מ-[nodejs.org](https://nodejs.org) (גרסת LTS).
4. **חשבון Apple Developer של עמוס** (99$ לשנה) שכבר אושר. ההרשמה ב-[developer.apple.com/programs](https://developer.apple.com/programs) ויכולה לקחת עד יומיים. בלי חשבון מאושר אי אפשר להעלות.

לגבי הכניסה לחשבון: הדרך הפשוטה היא שעמוס יהיה זמין בטלפון בזמן ההתקנה, כי Xcode ו-App Store Connect שולחים קוד אימות לאייפון שלו. אפשרות אחרת: עמוס מזמין את החבר ב-App Store Connect תחת Users and Access, בתפקיד Admin.

## שלב 1: הורדת הקוד ופתיחה ב-Xcode

פותחים את Terminal ומריצים:

```bash
git clone https://github.com/amosha1231-netizen/Teire.git
cd Teire
npm install
npm run ios
```

הפקודה האחרונה בונה את קבצי האפליקציה ופותחת את Xcode. אם Terminal מציע להתקין את Command Line Tools, מאשרים ומריצים שוב.

## שלב 2: חתימה ב-Xcode

1. Xcode → Settings → Accounts → `+` → Apple ID, ונכנסים עם ה-Apple ID של עמוס.
2. ברשימה משמאל לוחצים על **App** (הכחול למעלה), ואז על ה-target שנקרא **App**, ואז הלשונית **Signing & Capabilities**.
3. מסמנים **Automatically manage signing**, ובוחרים ב-**Team** את הצוות של עמוס.
4. ה-Bundle Identifier צריך להיות `com.amosha1231.teire`. **לא לשנות אותו**: אחרי ההעלאה הראשונה אי אפשר להחליף אותו.

## שלב 3: בדיקה

למעלה בחלון בוחרים סימולטור, למשל iPhone 17 Pro Max, ולוחצים ▶. כדאי לעבור על המפה, משימה אחת ודו-קרב עם בוט. אפשר גם לחבר אייפון בכבל ולהריץ עליו.

תוך כדי, מצלמים מסכים לחנות: בסימולטור לוחצים ⌘S, והתמונה נשמרת בשולחן העבודה. צריך לפחות 3 צילומים בגודל של iPhone גדול (6.9 אינץ'). כדאי: המפה, שאלה, הדמות, דו-קרב.

## שלב 4: יצירת האפליקציה ב-App Store Connect

נכנסים ל-[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Apps → `+` → New App:

| שדה | מה לכתוב |
|---|---|
| Platform | iOS |
| Name | מסע בתורה (אם תפוס, למשל "מסע בתורה - חידון") |
| Primary Language | Hebrew |
| Bundle ID | com.amosha1231.teire (אם לא מופיע, להריץ פעם אחת את שלב 5 ולחזור) |
| SKU | teire001 |
| User Access | Full Access |

## שלב 5: העלאת הגרסה

1. ב-Xcode, למעלה במקום הסימולטור, בוחרים **Any iOS Device (arm64)**.
2. Product → **Archive**. זה לוקח כמה דקות.
3. בחלון Organizer שנפתח: **Distribute App** → **App Store Connect** → **Upload**, ומאשרים את ברירות המחדל.
4. אחרי 15 עד 30 דקות הגרסה מופיעה ב-App Store Connect, בלשונית TestFlight. אפשר להתקין אותה באייפון של עמוס דרך אפליקציית TestFlight ולבדוק לפני השליחה.

## שלב 6: מילוי פרטי החנות

ב-App Store Connect, בגרסה 1.0:

- **צילומי מסך:** אלה משלב 3.
- **Promotional Text / Description / Keywords:** תיאור קצר בעברית. מילות מפתח לדוגמה: `תורה,גמרא,חידון,פרשת שבוע,משנה,לימוד,ילדים,טריוויה`.
- **Support URL:** `https://amosha1231-netizen.github.io/Teire/`
- **Privacy Policy URL:** `https://amosha1231-netizen.github.io/Teire/privacy.html`
- **Category:** Education. קטגוריה שנייה: Games → Trivia.
- **Age Rating:** עונים "None" כמעט על הכול. על תוכן שמשתמשים יוצרים: יש הצעת שאלות, אבל כל שאלה עוברת אישור מנהל לפני פרסום, ואין צ'אט חופשי. לא לסמן את קטגוריית Kids.
- **App Privacy:** אין מעקב (Tracking: No). המידע שנאסף:
  - Other User Content (שאלות שמשתמשים מציעים): App Functionality, לא מקושר לזהות.
  - Gameplay Content (כינוי וניקוד בטבלת המובילים, אם השחקן בוחר להצטרף): App Functionality, לא מקושר לזהות.
  - מיקום לא נאסף, כי הוא נשאר במכשיר.
- **Pricing and Availability:** חינם (Free).
- **Build:** בוחרים את הגרסה שהועלתה בשלב 5.
- **App Review Information:** לא צריך משתמש וסיסמה. בהערות לבודקים מדביקים:

> The app does not require an account. Note: the app is closed on Shabbat and Jewish holidays (Friday sunset to Saturday night, by default Jerusalem time) and shows a "Shabbat Shalom" screen during that window. If you see this screen, please review again after Saturday night Israel time, or tap "המיקום לא נכון?" to use your own location. Duels can be played against a bot when no other player is online.

כדאי לשלוח לבדיקה בין יום ראשון לחמישי, כדי שהבודק לא יגיע לאפליקציה כשהיא סגורה בשבת.

## שלב 7: שליחה

**Add for Review** → **Submit**. הבדיקה של Apple לוקחת בדרך כלל יום עד שלושה ימים, והתשובה מגיעה במייל לעמוס.

## עדכון גרסה בעתיד

השאלות והתוכן נמצאים בתוך האפליקציה, ולכן תיקון בתוכן (בתיקייה `content`) מגיע לאייפון רק בגרסה חדשה. שאלות שגולשים הציעו ומנהל אישר מגיעות מהשרת, ומופיעות גם בלי עדכון.

```bash
cd Teire
git pull
npm install
npm run ios
```

ב-Xcode, בלשונית General של ה-target, מעלים את **Version** (למשל 1.1) ואת **Build** (למשל 2). ואז שוב שלב 5 ושלב 7.

## אם משהו לא עובד

- **"No account for team" או שגיאת חתימה:** לבדוק שהחשבון של עמוס אושר ב-Apple Developer Program, ושנבחר Team בשלב 2.
- **Xcode לא מוצא את חבילות Capacitor:** File → Packages → Reset Package Caches, ואז שוב Archive.
- **`npm` לא מוכר:** להתקין את Node.js ולפתוח Terminal חדש.
- **מסך לבן באפליקציה:** להריץ שוב `npm run ios` (הפקודה מעתיקה את קבצי האתר לפרויקט).
