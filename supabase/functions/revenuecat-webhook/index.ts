// מקבל מ-RevenueCat הודעה על כל קנייה או החזר כספי, ומעדכן את היהלומים של השחקן בשרת.
// התקנה: ראו docs/PURCHASES.md. צריך שני סודות ב-Supabase -> Edge Functions -> Secrets:
//   REVENUECAT_WEBHOOK_AUTH  - אותה מחרוזת שכותבים ב-RevenueCat בשדה Authorization של ה-webhook
//   (SUPABASE_URL ו-SUPABASE_SERVICE_ROLE_KEY קיימים שם מראש)
import { createClient } from "jsr:@supabase/supabase-js@2";

// כמה יהלומים בכל חבילה. המזהים חייבים להיות זהים למוצרים ב-App Store Connect וב-Google Play.
const PACKS: Record<string, number> = { gems_100: 100, gems_550: 550, gems_1200: 1200 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async req => {
  if (req.headers.get("Authorization") !== Deno.env.get("REVENUECAT_WEBHOOK_AUTH")) return new Response("unauthorized", { status: 401 });
  const { event } = await req.json();
  const gems = event && PACKS[event.product_id];
  // מזהה השחקן ב-RevenueCat הוא מזהה המשתמש שלו ב-Supabase (ראו js/purchases.js).
  if (!gems || !UUID.test(event.app_user_id || "")) return new Response("ignored");

  let delta = 0;
  if (event.type === "INITIAL_PURCHASE" || event.type === "NON_RENEWING_PURCHASE") delta = gems;
  else if (event.type === "CANCELLATION" && event.cancel_reason === "CUSTOMER_SUPPORT") delta = -gems; // החזר כספי
  if (!delta) return new Response("ignored");

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await sb.rpc("credit_gems", {
    p_user: event.app_user_id,
    p_delta: delta,
    p_ext_id: `${event.type}:${event.transaction_id || event.id}`,
    p_reason: `${event.type} ${event.product_id} (${event.store})`,
  });
  if (error) return new Response(error.message, { status: 500 }); // RevenueCat ינסה שוב
  return new Response("ok");
});
