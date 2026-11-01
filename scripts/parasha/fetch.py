# מוריד מספריא (העותק הציבורי ב-Google Cloud) את התורה ואת ששת הפרשנים לחומש אחד, לתיקייה src/ (לא נשמרת בגיט).
# שימוש: python3 scripts/parasha/fetch.py Genesis   (או Exodus, Leviticus, Numbers, Deuteronomy)
import os, sys, urllib.parse, urllib.request
BASE = 'https://storage.googleapis.com/sefaria-export/json/Tanakh/'
book = sys.argv[1] if len(sys.argv) > 1 else 'Genesis'
FILES = {
  book: f'Torah/{book}/Hebrew/Tanach with Nikkud.json',
  f'Rashi on {book}': f'Rishonim on Tanakh/Rashi/Torah/Rashi on {book}/Hebrew/merged.json',
  f'Ramban on {book}': f'Rishonim on Tanakh/Ramban/Torah/Ramban on {book}/Hebrew/merged.json',
  f'Ibn Ezra on {book}': f'Rishonim on Tanakh/Ibn Ezra/Torah/Ibn Ezra on {book}/Hebrew/merged.json',
  f'Sforno on {book}': f'Rishonim on Tanakh/Sforno/Torah/Sforno on {book}/Hebrew/merged.json',
  f'Or HaChaim on {book}': f'Acharonim on Tanakh/Or HaChaim/Torah/Or HaChaim on {book}/Hebrew/merged.json',
  # בעל הטורים המודפס בחומשים הוא "קיצור בעל הטורים"
  f'Kitzur Baal HaTurim on {book}': f"Rishonim on Tanakh/Kitzur Ba'al HaTurim/Torah/Kitzur Ba'al HaTurim on {book}/Hebrew/merged.json",
}
out = os.path.join(os.path.dirname(__file__), 'src'); os.makedirs(out, exist_ok=True)
for name, path in FILES.items():
  dest = os.path.join(out, name + '.json')
  if os.path.exists(dest): continue
  print('downloading', name)
  urllib.request.urlretrieve(BASE + urllib.parse.quote(path), dest)
