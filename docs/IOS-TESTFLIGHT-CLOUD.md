# העלאה ל-TestFlight בלי Mac (בנייה בענן)

הבנייה רצה על מחשב Mac בענן של GitHub, דרך `.github/workflows/ios-testflight.yml`. אין צורך במק, ב-Xcode או בתעודות חתימה: החתימה אוטומטית בעזרת מפתח App Store Connect API.

- Bundle ID: `com.amosha1231.teire` (קבוע, אותו מזהה כמו באנדרואיד)
- Team ID: `3HZ7Y98XYW`
- שם האפליקציה בטלפון: מסע בתורה
- מספר הבילד = מספר הריצה ב-GitHub Actions (או מספר שמזינים ידנית)

## פעם ראשונה

### 1. רישום App ID
1. [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers/list) → `+`.
2. App IDs → Continue → App → Continue.
3. Description: `Teire`. Bundle ID: **Explicit** → `com.amosha1231.teire`.
4. Capabilities: לא צריך לסמן כלום (In-App Purchase מסומן אוטומטית). Continue → Register.

### 2. רשומת אפליקציה ב-App Store Connect
1. [appstoreconnect.apple.com/apps](https://appstoreconnect.apple.com/apps) → `+` → New App.
2. Platforms: iOS. Name: `מסע בתורה` (אם תפוס, למשל `מסע בתורה - חידון`). Primary language: Hebrew.
3. Bundle ID: בוחרים `com.amosha1231.teire` מהרשימה. SKU: `teire-ios`. User Access: Full Access → Create.

### 3. מפתח API ושלושה סודות
1. App Store Connect → Users and Access → Integrations → App Store Connect API → Team Keys → `+`, תפקיד **Admin**. מורידים את קובץ ה-`.p8` (אפשר להוריד רק פעם אחת).
2. בריפו: Settings → Secrets and variables → Actions → New repository secret, שלושה סודות:
   - `ASC_KEY_ID`: ה-Key ID של המפתח
   - `ASC_ISSUER_ID`: ה-Issuer ID שמופיע מעל הטבלה
   - `ASC_KEY_P8`: כל הטקסט של קובץ ה-`.p8`, כולל שורות BEGIN ו-END (גם אם השורות נשברו בהדבקה, ה-workflow מסדר את זה)

## כל העלאה
GitHub → Actions → **iOS to TestFlight** → Run workflow. אחרי כ-15 דקות הבילד מופיע ב-App Store Connect → TestFlight, ואחרי עוד 5 עד 30 דקות של עיבוד אפשר להתקין אותו מאפליקציית TestFlight באייפון.

- בודקים פנימיים (Internal Testing, עד 100 משתמשים מהצוות): בלי בדיקה של Apple.
- בודקים חיצוניים (External Testing): הבילד הראשון עובר Beta App Review. שימו לב לסגירה בשבת: הבודקים של Apple יכולים לקבל את מסך השבת, לכן כדאי לכתוב בהערות לבודק שהאפליקציה סגורה בשבת ובחג לפי המיקום.

## אם משהו נכשל
- `Missing ASC_KEY_ID / ASC_KEY_P8`: הסודות לא נוספו או נכתבו עם שם אחר.
- `No profiles for 'com.amosha1231.teire'` או `bundle identifier is not available`: ה-App ID לא נרשם (שלב 1), או נרשם בצוות אחר.
- `The bundle version must be higher`: מריצים שוב, או מזינים build number גבוה מהבילד האחרון.
- `No suitable application records were found`: לא נוצרה רשומת אפליקציה (שלב 2).
