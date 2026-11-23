// יכולות של אפליקציית האנדרואיד (mobile/): שיתוף, שמירת קבצים, הודעת "אין חיבור", קישורים לאתר,
// כפתור "חזרה" של הטלפון, שורת מצב, מסך פתיחה ורטט קל.
// בדפדפן רגיל (ובאפליקציית האייפון, שאין בה את התוספים האלה) הקובץ לא עושה כלום.
(function () {
  const UA_MARK = "TeireApp-Android";
  const SITE = "https://amosha1231-netizen.github.io/Teire/";
  const inApp = navigator.userAgent.indexOf(UA_MARK) >= 0;
  // Capacitor מוזרק לדף על ידי האפליקציה, לפעמים רגע אחרי שהדף התחיל להיטען, לכן קוראים אותו כל פעם מחדש
  const has = name => { const c = window.Capacitor; return !!(inApp && c && c.isPluginAvailable && c.isPluginAvailable(name) && c.Plugins && c.Plugins[name]); };
  const P = name => window.Capacitor.Plugins[name];

  // מסמנים את הדף מוקדם, כדי שה-CSS יסתיר מה שלא מתאים לאפליקציה (ניהול, קניות) עוד לפני שמשהו מופיע
  if (inApp) document.documentElement.classList.add("in-app", "in-android");

  const Native = {
    inApp,
    // שיתוף: חלון השיתוף של הטלפון באפליקציה, navigator.share או העתקה בדפדפן
    async share({ title, text, url } = {}) {
      if (has("Share")) {
        try { await P("Share").share({ title, text, url, dialogTitle: title }); return true; } catch (e) { return false; }
      }
      if (navigator.share) { try { await navigator.share({ title, text, url }); return true; } catch (e) { return false; } }
      try { await navigator.clipboard.writeText([text, url].filter(Boolean).join(" ")); return "copied"; } catch (e) { return false; }
    },
    // שמירת קובץ: ה-WebView של אנדרואיד לא מוריד קישורי blob:, אז כותבים את הקובץ לזיכרון הזמני ופותחים את חלון השיתוף
    async saveFile(name, blob) {
      if (has("Filesystem") && has("Share")) {
        const data = await new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = bad; r.readAsDataURL(blob); });
        const res = await P("Filesystem").writeFile({ path: name, data, directory: "CACHE" });
        await P("Share").share({ title: name, files: [res.uri], dialogTitle: name });
        return true;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      return true;
    },
    // רטט קל. בדפדפן: navigator.vibrate אם יש
    haptic(kind) {
      if (has("Haptics")) {
        const H = P("Haptics");
        if (kind === "error") return H.notification({ type: "ERROR" }).catch(() => {});
        if (kind === "success") return H.notification({ type: "SUCCESS" }).catch(() => {});
        return H.impact({ style: "LIGHT" }).catch(() => {});
      }
      if (navigator.vibrate) try { navigator.vibrate(kind === "error" ? [120, 60, 120] : 30); } catch (e) { /* ignore */ }
    },
  };
  window.TeireNative = Native;
  if (!inApp) return;

  // ---------- אין חיבור: פס קטן בראש המסך ----------
  function offlineBar(show) {
    let bar = document.getElementById("offline-bar");
    if (!show) { if (bar) bar.remove(); return; }
    if (bar) return;
    bar = document.createElement("div");
    bar.id = "offline-bar"; bar.className = "offline-bar"; bar.setAttribute("role", "status");
    bar.textContent = "📡 אין חיבור לאינטרנט. חלק מהדברים לא יעבדו עד שהחיבור יחזור.";
    document.body.appendChild(bar);
  }
  function start() {
    if (has("Network")) {
      P("Network").getStatus().then(s => offlineBar(!s.connected)).catch(() => {});
      P("Network").addListener("networkStatusChange", s => offlineBar(!s.connected));
    } else {
      window.addEventListener("offline", () => offlineBar(true));
      window.addEventListener("online", () => offlineBar(false));
    }

    // ---------- קישורים לאתר שנפתחים באפליקציה ----------
    if (has("App")) {
      const App = P("App");
      App.addListener("appUrlOpen", ev => {
        const url = ev && ev.url || "";
        if (url.indexOf(SITE.replace(/\/$/, "")) !== 0) return;
        const hash = url.split("#")[1];
        if (hash !== undefined) location.hash = hash; else location.hash = "#/";
      });
      // ---------- כפתור "חזרה" של הטלפון: אחורה בתוך המשחק, ובמסך הראשי יוצאים ----------
      App.addListener("backButton", ev => {
        const home = !location.hash || location.hash === "#" || location.hash === "#/";
        if (ev && ev.canGoBack && !home) history.back(); else App.minimizeApp().catch(() => App.exitApp());
      });
    }

    // ---------- שורת המצב ומסך הפתיחה ----------
    if (has("StatusBar")) {
      P("StatusBar").setBackgroundColor({ color: "#1e3a5f" }).catch(() => {});
      P("StatusBar").setStyle({ style: "DARK" }).catch(() => {});
    }
    if (has("SplashScreen")) P("SplashScreen").hide().catch(() => {});

    // ---------- רטט: navigator.vibrate של המשחק עובר לרטט של הטלפון ----------
    if (has("Haptics")) {
      try {
        navigator.vibrate = pattern => {
          const long = Array.isArray(pattern) ? pattern.length > 1 : pattern > 60;
          Native.haptic(long ? "error" : "light");
          return true;
        };
      } catch (e) { /* ignore */ }
    }
  }
  let tries = 0;
  function whenReady() {
    if (window.Capacitor || tries++ > 20) start(); else setTimeout(whenReady, 150);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", whenReady); else whenReady();
})();
