import sys, os
D = os.path.dirname(os.path.abspath(__file__))
shots = [
 ("01-signal","signal","Every AI story,", "graded.","Scored for signal and freshness, so what matters rises first."),
 ("02-story","story","Why it matters,","in plain English.","Clear summaries that credit and link the original source."),
 ("03-brief","intel","Your Daily Brief,","twice a day.","Morning and evening briefs, audited before they go out."),
 ("04-radar","radar","10 desks.","One radar.","Swept every 30 minutes, primary sources first."),
 ("05-watchlist","watch","Know what's","coming next.","Dated events and scheduled briefs, facts kept apart from forecasts."),
]
tpl = open(os.path.join(D,"tpl.html")).read()
for out, img, a, b, sub in shots:
    open(os.path.join(D,out+".html"),"w").write(tpl.replace("{{IMG}}",img+".png").replace("{{A}}",a).replace("{{B}}",b).replace("{{SUB}}",sub))
    print(out)
