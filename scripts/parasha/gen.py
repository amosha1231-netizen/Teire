# בונה את רשומות השבוע מקובץ שאלות: ממלא פסוק מהתורה, מקום בעברית, מערבב תשובות, ובודק שהציטוט באמת מופיע בפרשן.
import json,re,sys,random,importlib.util
import os
S=os.path.join(os.path.dirname(os.path.abspath(__file__)),'src')+'/'
def load(f):
  t=json.load(open(S+f+'.json'))['text']; return t[''] if isinstance(t,dict) else t
BOOKS={'gen':('Genesis','בראשית'),'ex':('Exodus','שמות'),'lev':('Leviticus','ויקרא'),'num':('Numbers','במדבר'),'deut':('Deuteronomy','דברים')}
CFILE={'rashi':'Rashi on {}','ramban':'Ramban on {}','ibn-ezra':'Ibn Ezra on {}','sforno':'Sforno on {}','or-hachaim':'Or HaChaim on {}','baal-haturim':'Kitzur Baal HaTurim on {}'}
CNAME={'rashi':'רש"י','ramban':'רמב"ן','ibn-ezra':'אבן עזרא','sforno':'ספורנו','or-hachaim':'אור החיים','baal-haturim':'בעל הטורים'}
ORDER=['rashi','ramban','baal-haturim','ibn-ezra','sforno','or-hachaim']
def heb(n):
  out='';
  for v,l in [(400,'ת'),(300,'ש'),(200,'ר'),(100,'ק')]:
    while n>=v: out+=l; n-=v
  if n==15: return out+'טו'
  if n==16: return out+'טז'
  for v,l in [(90,'צ'),(80,'פ'),(70,'ע'),(60,'ס'),(50,'נ'),(40,'מ'),(30,'ל'),(20,'כ'),(10,'י')]:
    if n>=v: out+=l; n-=v; break
  if n: out+='אבגדהוזחט'[n-1]
  return out
def verse_text(t):
  t=re.sub(r'<[^>]+>','',t); t=re.sub(r'[֑-ֽ֯׀׃]','',t)  # בלי טעמים, מתג, פסק וסוף פסוק
  t=t.replace('־',' ').replace('׃','').replace('{פ}','').replace('{ס}','')
  t=re.sub(r'יְ?הֹ?וָ?ה','ה׳',t)  # שם ה'
  t=re.sub(r'\s*\{[^}]*\}\s*',' ',t)
  return re.sub(r'\s+',' ',t).strip()
norm=lambda s: re.sub(r'[^א-ת]','',re.sub(r'[֑-ׇ]','',s))
def js(s): return json.dumps(s,ensure_ascii=False)
def build(mod_path):
  spec=importlib.util.spec_from_file_location('m',mod_path); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
  en,he=BOOKS[m.BOOK]; tor=load(en); cache={}
  rnd=random.Random(m.ID); errs=[]; per={c:[] for c in ORDER}
  for q in m.Q:
    c=q['c']; ch,v=map(int,q['ref'].split(':'))
    f=CFILE[c].format(en)
    if f not in cache: cache[f]=load(f)
    try: cm=cache[f][ch-1][v-1]
    except Exception: cm=[]
    cm=' '.join(cm) if isinstance(cm,list) else (cm or '')
    for part in q['quote'].split('...'):
      if norm(part) and norm(part) not in norm(cm): errs.append(f"{c} {q['ref']}: ציטוט לא נמצא: {part}")
    verse=q.get('verse') or verse_text(tor[ch-1][v-1])
    ans=q['a'][:]; right=ans[0]; assert len(ans)==4, q
    rnd.shuffle(ans)
    per[c].append(dict(level=q['level'],verse=verse,ref=f"{he} {heb(ch)}, {heb(v)}",question=q['q'],answers=ans,correct=ans.index(right),
      source=f"{CNAME[c]} {he} {heb(ch)}, {heb(v)}",note=q['note'],quote=q['quote']))
  lines=[f'    {{ id: {js(m.ID)}, name: {js(m.NAME)}, ref: {js(m.REF)}, shabbat: {js(m.SHABBAT)}, q: {{']
  for c in ORDER:
    if not per[c]: continue
    key=c if re.fullmatch(r'[a-z]+',c) else js(c)
    lines.append(f'      {key}: [')
    for r in per[c]:
      lines.append(f'        {{ level: {r["level"]}, verse: {js(r["verse"])}, ref: {js(r["ref"])},')
      lines.append(f'          question: {js(r["question"])}, answers: {js(r["answers"])}, correct: {r["correct"]},')
      lines.append(f'          source: {js(r["source"])}, note: {js(r["note"])}, quote: {js(r["quote"])} }},')
    lines.append('      ],')
  lines.append('    } },')
  counts={c:len(v) for c,v in per.items()}
  return '\n'.join(lines),errs,counts
if __name__=='__main__':
  out=[]
  for p in sys.argv[1:]:
    s,errs,counts=build(p); print(p,counts,file=sys.stderr)
    for e in errs: print('  !!',e,file=sys.stderr)
    out.append(s)
  print('\n'.join(out))
