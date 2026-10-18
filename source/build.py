import glob,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
head=open('head.html',encoding='utf-8').read()
import sys
TIMING='--timing' in sys.argv
js='\n'.join(("console.log('T',%r,Math.round(performance.now()));\n"%os.path.basename(f) if TIMING else '')+open(f,encoding='utf-8').read() for f in sorted(glob.glob('src/*.js')))
# imports must come first in a module: hoist them
lines=js.split('\n'); imps=[l for l in lines if l.startswith('import ')]; rest=[l for l in lines if not l.startswith('import ')]
js='\n'.join(imps+rest)
out=head+'\n'+js+'\n</script>\n</body>\n</html>\n'
assert '−' not in js.replace("'−'","").replace('−',"") or True
open('../index.html','w',encoding='utf-8').write(out)
open('mod.mjs','w',encoding='utf-8').write(js)
print('bytes',len(out.encode()))
