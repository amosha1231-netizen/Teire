# מסע בתורה לאנדרואיד

עטיפת Capacitor 8 שטוענת את האתר החי (`server.url` = https://amosha1231-netizen.github.io/Teire/).
כל שינוי באתר מגיע לאפליקציה מיד, בלי גרסה חדשה בחנות. גרסה חדשה צריך רק כשמשנים משהו בתיקייה הזו.

- שם החבילה: `com.amosha1231.teire`. **אי אפשר לשנות אותו אחרי ההעלאה הראשונה.**
- סימן באפליקציה: `TeireApp-Android` בסוף ה-User-Agent. `js/native.js` באתר מזהה אותו, מסתיר את לשונית "ניהול" ואת היהלומים (אין Play Billing), ומפעיל שיתוף, רטט, כפתור "חזרה", הודעת "אין חיבור" וקישורים לאתר.
- בלי אינטרנט נפתח `www/offline.html` עם כפתור "לנסות שוב".
- הרשאות: אינטרנט, מצב רשת ורטט בלבד. מיקום, מצלמה ומיקרופון מסומנים `required="false"`, ולא מבקשים אותם.

## בנייה
GitHub Actions (`.github/workflows/android.yml`) בונה בכל שינוי בתיקייה הזו:
- `teire-debug-apk-N`: APK להתקנה ישירה בטלפון.
- `teire-release-aab-N`: AAB לגוגל פליי, לא חתום. חותמים במחשב:
  `jarsigner -keystore teire-upload.keystore app-release.aab teire`
- `versionCode` = מספר הריצה, אז כל בנייה גבוהה מהקודמת.

כדי להוריד קבצים מ-Actions צריך להיות מחובר ל-GitHub.

## מפתח העלאה (פעם אחת, במחשב)
```
keytool -genkeypair -v -keystore teire-upload.keystore -alias teire -keyalg RSA -keysize 2048 -validity 10000
```
שומרים את הקובץ ואת הסיסמה בשני מקומות בטוחים. **לא מעלים אותו לגיט.** בלעדיו אי אפשר לעדכן את האפליקציה (אפשר רק לבקש מגוגל איפוס).

## קישורים שנפתחים באפליקציה (App Links)
גוגל בודקת את `/.well-known/assetlinks.json` בשורש הדומיין: `https://amosha1231-netizen.github.io/.well-known/assetlinks.json`.
האתר נמצא ב-`/Teire/`, ולכן הקובץ חייב לשבת במאגר נפרד בשם `amosha1231-netizen.github.io` (או בדומיין משלכם).
התבנית: `assetlinks.template.json`. בלי הקובץ האפליקציה עובדת רגיל, וקישורים פשוט נפתחים בדפדפן.

## אייקונים ומסך פתיחה
המקור ב-`resources/`. ליצירה מחדש: `npm run assets`. לחנות: `store/play-icon-512.png` ו-`store/feature-graphic-1024x500.png`.
