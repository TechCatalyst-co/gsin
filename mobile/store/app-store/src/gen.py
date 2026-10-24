# Renders the App Store header (21:9) and search results (3:2) images from
# tpl.html and the screens in this folder (2.0.1 simulator captures, status
# bar cropped). Writes ../header-3840x1646.png and ../search-results-3840x2560.png.
import os, subprocess
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__)); t=open(os.path.join(D,'tpl.html')).read()
CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
H1='The AI news wire, <span>graded.</span>'
V={
 'header':dict(OUT='header-3840x1646.png',W=3840,H=1646,GW=2600,GH=1300,HT=150,HS=150,PM=0,PS=0,SUB='',CT=420,G=70,CW=660,MW=760,LIFT=60,H1=H1,L='brief',C='news',R='watch'),
 'search':dict(OUT='search-results-3840x2560.png',W=3840,H=2560,GW=3000,GH=1900,HT=230,HS=230,PM=40,PS=84,SUB='<p>Every AI story, grouped by topic and briefed twice a day.</p>',CT=780,G=90,CW=960,MW=1100,LIFT=80,H1=H1,L='brief',C='news',R='watch'),
}
for k,v in V.items():
    h=t
    for a,b in v.items(): h=h.replace('{{%s}}'%a,str(b))
    html=os.path.join(D,k+'.html'); open(html,'w').write(h)
    out=os.path.join(D,'..',v['OUT'])
    subprocess.run([CHROME,'--headless=new','--hide-scrollbars','--force-device-scale-factor=1',
        '--virtual-time-budget=8000','--window-size=%d,%d'%(v['W'],v['H']),'--screenshot='+out,'file://'+html],
        check=True,capture_output=True)
    # Apple rejects alpha channels: flatten to RGB.
    Image.open(out).convert('RGB').save(out)
    print(k, Image.open(out).size)
