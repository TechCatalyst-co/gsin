import os
D=os.path.dirname(os.path.abspath(__file__)); t=open(os.path.join(D,'tpl.html')).read()
V={
 'header':dict(W=3840,H=1646,GW=2600,GH=1300,HT=150,HS=150,PM=0,PS=0,SUB='',CT=420,G=70,CW=660,MW=760,LIFT=60,L='intel',R='story'),
 'search':dict(W=3840,H=2560,GW=3000,GH=1900,HT=230,HS=230,PM=40,PS=84,SUB='<p>Every AI story summarized, scored and briefed twice a day.</p>',CT=780,G=90,CW=960,MW=1100,LIFT=80,L='intel',R='story'),
}
for k,v in V.items():
    h=t
    for a,b in v.items(): h=h.replace('{{%s}}'%a,str(b))
    open(os.path.join(D,k+'.html'),'w').write(h); print(k)
