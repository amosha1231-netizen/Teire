// באפליקציה באייפון הגובה של האיזור של השעון והמצלמה (safe area) מגיע לפעמים רק אחרי שהעמוד כבר צויר.
// בלי זה הסרגל העליון הופיע קודם גבוה מדי (מתחת לשעון) ואז קפץ למקום.
// הפתרון: זוכרים את הגובה מהפעם הקודמת ומשתמשים בו מיד. בפעם הראשונה ממתינים רגע (עד שנייה) לפני שמציגים את העמוד.
(function () {
  var de = document.documentElement;
  var cap = window.Capacitor;
  var inApp = !!(cap && (cap.isNativePlatform ? cap.isNativePlatform() : cap.getPlatform && cap.getPlatform() !== "web")) || navigator.standalone === true;
  if (!inApp) return;
  var KEY = "teire.sat", saved = 0;
  try { saved = parseFloat(localStorage.getItem(KEY)) || 0; } catch (e) { /* ignore */ }
  if (saved > 0) de.style.setProperty("--sat-fb", saved + "px");
  else de.classList.add("sa-wait");

  var probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position:fixed;top:0;left:0;width:1px;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none";
  de.appendChild(probe);
  var t0 = Date.now(), done = false;
  function finish(h) {
    if (done) return;
    done = true;
    if (h > 0) { try { localStorage.setItem(KEY, String(h)); } catch (e) { /* ignore */ } }
    de.style.removeProperty("--sat-fb"); // מעכשיו הגובה האמיתי עובד לבד (וגם מתעדכן כשמסובבים את הטלפון)
    de.classList.remove("sa-wait");
  }
  function check() {
    var h = probe.offsetHeight;
    // לרוחב אין איזור שעון למעלה, אז אין למה לחכות
    if (h > 0 || innerWidth > innerHeight || Date.now() - t0 > 1000) return finish(h);
    requestAnimationFrame(check);
  }
  requestAnimationFrame(check);
  setTimeout(function () { finish(probe.offsetHeight); }, 1200); // ליתר ביטחון, אם requestAnimationFrame לא רץ
})();
