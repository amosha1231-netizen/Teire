// בודק אילו טקסטים בעברית בממשק עוד אין להם תרגום במילונים js/lang/en.js, fr.js, es.js.
// הרצה: node scripts/i18n-missing.mjs        (או: node scripts/i18n-missing.mjs fr  לשפה אחת)
// התוכן התורני (content/) לא נבדק: השאלות נשארות בעברית בכוונה.
import fs from "node:fs";
const HEB=/[א-ת]/;
function literals(src){
  const out=[];let i=0,n=src.length;
  function readTpl(){ // after `
    let s="";
    while(i<n){const c=src[i];
      if(c==="\\"){s+=src[i]+src[i+1];i+=2;continue}
      if(c==="`"){i++;return s}
      if(c==="$"&&src[i+1]==="{"){i+=2;let d=1;let inner="";
        while(i<n&&d>0){const ch=src[i];
          if(ch==="`"){i++;const t=readTpl();out.push(t);inner+="`"+t+"`";continue}
          if(ch==="'"||ch==='"'){const q=ch;i++;let t="";while(i<n&&src[i]!==q){if(src[i]==="\\"){t+=src[i+1];i+=2;continue}t+=src[i++]}i++;out.push(t);continue}
          if(ch==="{")d++;if(ch==="}")d--; if(d>0)inner+=ch;i++}
        s+="{n}";continue}
      s+=c;i++}
    return s}
  while(i<n){const c=src[i];
    if(c==="/"&&src[i+1]==="/"){while(i<n&&src[i]!=="\n")i++;continue}
    if(c==="/"&&src[i+1]==="*"){i=src.indexOf("*/",i)+2;continue}
    if(c==="'"||c==='"'){const q=c;i++;let t="";while(i<n&&src[i]!==q&&src[i]!=="\n"){if(src[i]==="\\"){t+=src[i+1];i+=2;continue}t+=src[i++]}i++;out.push(t);continue}
    if(c==="`"){i++;out.push(readTpl());continue}
    i++}
  return out}
const keys=new Map();
const FILES=["index.html",...fs.readdirSync("js").filter(f=>f.endsWith(".js")&&f!=="qrcode.js"&&f!=="i18n.js").map(f=>"js/"+f)];
function add(k,f){k=k.replace(/\s+/g," ").trim();if(!HEB.test(k))return;if(!keys.has(k))keys.set(k,f)}
for(const f of FILES){
  let src=fs.readFileSync(f,"utf8");
  let lits = f.endsWith(".html") ? [src.replace(/<script[\s\S]*?<\/script>|<!--[\s\S]*?-->/g,"")] : literals(src);
  for(const L of lits){
    for(const m of L.matchAll(/(?:placeholder|title|aria-label|alt)="([^"]*)"/g)) add(m[1],f);
    for(const p of L.split(/<[^>]*>/)) add(p,f);
  }
}
const want=process.argv[2]?[process.argv[2]]:["en","fr","es"];
let total=0;
for(const l of want){
  const win={}; new Function("window",fs.readFileSync(`js/lang/${l}.js`,"utf8"))(win);
  const dict=win.TEIRE_LANG||{};
  const miss=[...keys].filter(([k])=>dict[k]==null && !/^[א-ת]$/.test(k));
  total+=miss.length;
  console.log(`\n== ${l}: ${miss.length} missing`);
  for(const [k,f] of miss) console.log(`${f}\t${k}`);
}
process.exit(total?1:0);
