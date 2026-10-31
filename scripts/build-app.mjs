// בונה את התיקייה www שממנה Capacitor אורז את האפליקציה.
// מעתיק את קבצי האתר, שם את ספריית Supabase בתוך האפליקציה במקום מהאינטרנט, ומסתיר את לשונית "ניהול".
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const OUT = "www";
const FILES = ["index.html", "privacy.html", "style.css", "manifest.json", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
const DIRS = ["js", "content", "audio"];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT + "/vendor", { recursive: true });
for (const f of FILES) cpSync(f, `${OUT}/${f}`);
for (const d of DIRS) cpSync(d, `${OUT}/${d}`, { recursive: true });
cpSync("node_modules/@supabase/supabase-js/dist/umd/supabase.js", `${OUT}/vendor/supabase.js`);

let html = readFileSync("index.html", "utf8");
const cdn = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^"]+"><\/script>/;
const admin = /\s*<a href="#\/admin" data-tab="admin">.*?<\/a>/;
if (!cdn.test(html) || !admin.test(html)) throw new Error("index.html השתנה: צריך לעדכן את scripts/build-app.mjs");
html = html.replace(cdn, '<script src="vendor/supabase.js"></script>').replace(admin, "");
writeFileSync(`${OUT}/index.html`, html);
console.log("www מוכן");
