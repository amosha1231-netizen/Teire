import json,re,sys
import os
S=os.path.join(os.path.dirname(os.path.abspath(__file__)),'src')+'/'
files={'rashi':'Rashi on Genesis','ramban':'Ramban on Genesis','ibn':'Ibn Ezra on Genesis','sforno':'Sforno on Genesis','oh':'Or HaChaim on Genesis','bht':'Kitzur Baal HaTurim on Genesis'}
def load(f):
  t=json.load(open(S+f+'.json'))['text']
  return t[''] if isinstance(t,dict) else t
BOOK=os.environ.get('BOOK','Genesis')
files={k:v.replace('Genesis',BOOK) for k,v in files.items()}
tor=load(BOOK)
def clean(s): return re.sub(r'[\u0591-\u05BD\u05BF-\u05C7]','',re.sub(r'<[^>]+>','',s).replace('&nbsp;',' '))
which=sys.argv[1]; a,b=sys.argv[2].split(':'); c,d=sys.argv[3].split(':'); lim=int(sys.argv[4]) if len(sys.argv)>4 else 100000
a,b,c,d=map(int,(a,b,c,d))
T=load(files[which]) if which!='torah' else None
heb=lambda n: n
for ch in range(a,c+1):
  vs=tor[ch-1]
  for v in range(1,len(vs)+1):
    if (ch,v)<(a,b) or (ch,v)>(c,d): continue
    if which=='torah': print(f'{ch}:{v} {clean(vs[v-1])}'); continue
    try: cm=T[ch-1][v-1]
    except IndexError: continue
    if isinstance(cm,str): cm=[cm]
    cm=[clean(x) for x in cm if x and x.strip()]
    if not cm: continue
    print(f'== {ch}:{v}')
    for x in cm: print('  -',x[:lim])
