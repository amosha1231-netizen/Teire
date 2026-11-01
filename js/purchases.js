// קניית יהלומים בכסף אמיתי דרך Apple / Google, בעזרת RevenueCat. עובד רק בתוך האפליקציה (לא בדפדפן).
// הקנייה עצמה לא נותנת יהלומים בטלפון: RevenueCat מודיע לשרת (supabase/functions/revenuecat-webhook),
// והשרת מוסיף אותם. כאן רק מחכים שהיתרה בשרת תעלה.
(function () {
  const cfg = window.TEIRE_CONFIG;
  const cap = window.Capacitor;
  const platform = cap && cap.isNativePlatform && cap.isNativePlatform() ? cap.getPlatform() : "web";
  const key = platform === "ios" ? cfg.REVENUECAT_IOS_KEY : platform === "android" ? cfg.REVENUECAT_ANDROID_KEY : "";
  const Purchases = key && cap.registerPlugin ? cap.registerPlugin("Purchases") : null;
  let ready = null;

  // מזהה השחקן ב-RevenueCat = מזהה המשתמש שלו ב-Supabase, כך שהשרת יודע למי לתת את היהלומים.
  function setup() {
    if (!ready) ready = window.TeireDB.gems.userId().then(appUserID => Purchases.configure({ apiKey: key, appUserID }));
    return ready.catch(e => { ready = null; throw e; });
  }

  window.TeirePurchases = {
    available: () => !!(Purchases && window.TeireDB.gems),
    // החבילות למכירה, עם המחיר במטבע המקומי כמו שהחנות מציגה.
    async packages() {
      await setup();
      const { current } = await Purchases.getOfferings();
      return ((current && current.availablePackages) || []).map(p => ({ pkg: p, id: p.product.identifier, title: p.product.title, price: p.product.priceString }));
    },
    // מחזיר false אם השחקן ביטל בחלון של החנות.
    async buy(p) {
      await setup();
      try {
        await Purchases.purchasePackage({ aPackage: p.pkg });
        return true;
      } catch (e) {
        if (e && (e.userCancelled || /cancel/i.test(e.message || ""))) return false;
        throw e;
      }
    },
  };
})();
