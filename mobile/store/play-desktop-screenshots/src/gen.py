import os
D=os.path.dirname(os.path.abspath(__file__))
hues=['2E7DFF','8FA3C2','5B9BFF','7FC4A4','C7D2E3','9FB6FF','6B8FD6','B9C7E0','D4AF37','86B7FF']
dots='<div class="dots">'+''.join(f'<i style="background:#{h}"></i>' for h in hues)+'<b>10 desks · always free</b></div>'
def ph(imgs, cls):
    return ''.join(f'<div class="phone {c}"><img src="{i}.png"></div>' for i,c in zip(imgs,cls))
S=[
 ("01-overview","The AI news wire,","graded.","Every AI story summarized, scored and briefed twice a day.",dots,["signal","intel","story"],["lo","hi","lo"],420,800),
 ("02-graded","Every story,","scored for signal.","Freshness, sources and importance at a glance, so what matters rises first.","",["signal","story"],["hi","lo"],500,1000),
 ("03-brief","Your Daily Brief,","twice a day.","Morning and evening briefs, audited before they go out, plus a watchlist of what's next.","",["intel","watch"],["hi","lo"],500,1000),
 ("04-radar","10 desks.","One radar.","Swept every 30 minutes, primary sources first. Search every capture.",dots,["radar","story2"],["hi","lo"],500,1000),
]
t=open(os.path.join(D,"tpl.html")).read()
for out,a,b,sub,dd,imgs,cls,pw,w in S:
    h=t.replace("{{A}}",a).replace("{{B}}",b).replace("{{SUB}}",sub).replace("{{DOTS}}",dd).replace("{{PHONES}}",ph(imgs,cls)).replace("{{PW}}",str(pw)).replace("{{W}}",str(w)).replace("{{HS}}","104" if out=="01-overview" else "124")
    open(os.path.join(D,out+".html"),"w").write(h); print(out)
