# Renders the store screenshots from the raw captures in screens/ (iPhone 17
# Pro Max simulator, 1320x2868, status bar overridden to 9:41):
#   app-store/iphone-6.9|6.5|6.3|6.1/   App Store iPhone sets
#   play-screenshots/                   Play phone set (1080x1920)
#   play-desktop-screenshots/           Play Chromebook/large-screen set (2560x1440)
# Templates live in each set's src/tpl.html. Needs Google Chrome and Pillow.
#
#   python3 mobile/store/render_screens.py
import os, subprocess, tempfile
from PIL import Image

D = os.path.dirname(os.path.abspath(__file__))
SCREENS = os.path.join(D, 'screens')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

# (file, screen, headline, gold line, subline)
PHONE = [
    ('01-news', 'news', 'Every AI story,', 'by topic.', 'Busiest topics first, with the lead story and latest brief up top.'),
    ('02-story', 'story', 'Why it matters,', 'in plain English.', 'Clear summaries that credit and link the original source.'),
    ('03-brief', 'brief', 'Your Daily Brief,', 'twice a day.', 'Morning and evening briefs, audited before they go out.'),
    ('04-calendar', 'calendar', "Any day's brief,", 'one tap away.', 'Pick a date on the calendar to read past briefs.'),
    ('05-watchlist', 'watch', "Know what's", 'coming next.', 'Dated events and scheduled briefs, facts kept apart from forecasts.'),
]

# App Store iPhone sizes. 6.9" is rendered natively; the others are scaled
# from it and centre-cropped to their slightly different aspect ratios.
IPHONE = {'6.9': (1320, 2868), '6.5': (1284, 2778), '6.3': (1206, 2622), '6.1': (1179, 2556)}

hues = ['2E7DFF', '8FA3C2', '5B9BFF', '7FC4A4', 'C7D2E3', '9FB6FF', '6B8FD6', 'B9C7E0', 'D4AF37', '86B7FF']
DOTS = '<div class="dots">' + ''.join(f'<i style="background:#{h}"></i>' for h in hues) + '<b>10 desks · always free</b></div>'

# (file, headline, gold line, subline, dots, screens, offsets, phone width, copy width, headline size)
DESKTOP = [
    ('01-overview', 'The AI news wire,', 'graded.', 'Every AI story summarized, grouped by topic and briefed twice a day.', DOTS,
     ['brief', 'news', 'story'], ['lo', 'hi', 'lo'], 420, 800, 104),
    ('02-story', 'Why it matters,', 'in plain English.', 'Clear summaries that credit and link the original source.', '',
     ['news', 'story'], ['hi', 'lo'], 500, 1000, 124),
    ('03-brief', 'Your Daily Brief,', 'twice a day.', "Morning and evening briefs, audited before they go out, plus a watchlist of what's next.", '',
     ['brief', 'watch'], ['hi', 'lo'], 500, 1000, 124),
    ('04-calendar', "Any day's brief,", 'one tap away.', 'Pick a date on the calendar to read past briefs. Swept every 30 minutes, primary sources first.', DOTS,
     ['calendar', 'news'], ['hi', 'lo'], 500, 1000, 124),
]


def url(name):
    return 'file://' + os.path.join(SCREENS, name + '.png')


def shoot(html, w, h, out):
    with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False) as f:
        f.write(html)
    subprocess.run([CHROME, '--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1',
                    '--allow-file-access-from-files', '--virtual-time-budget=8000',
                    f'--window-size={w},{h}', '--screenshot=' + out, 'file://' + f.name],
                   check=True, capture_output=True)
    os.unlink(f.name)
    # Both stores reject alpha channels.
    Image.open(out).convert('RGB').save(out)


def fit(src, size, out):
    im = Image.open(src)
    w, h = size
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    l, t = (im.width - w) // 2, (im.height - h) // 2
    im.crop((l, t, l + w, t + h)).save(out)


def phone_set(tpl_path, out_dir, w, h):
    tpl = open(tpl_path).read()
    os.makedirs(out_dir, exist_ok=True)
    for out, img, a, b, sub in PHONE:
        html = tpl.replace('{{IMG}}', url(img)).replace('{{A}}', a).replace('{{B}}', b).replace('{{SUB}}', sub)
        shoot(html, w, h, os.path.join(out_dir, out + '.png'))
        print(os.path.relpath(out_dir, D), out)


app = os.path.join(D, 'app-store')
phone_set(os.path.join(app, 'iphone-6.9', 'src', 'tpl.html'), os.path.join(app, 'iphone-6.9'), *IPHONE['6.9'])
for size, wh in IPHONE.items():
    if size == '6.9':
        continue
    os.makedirs(os.path.join(app, 'iphone-' + size), exist_ok=True)
    for out, *_ in PHONE:
        fit(os.path.join(app, 'iphone-6.9', out + '.png'), wh, os.path.join(app, 'iphone-' + size, out + '.png'))
    print('app-store/iphone-' + size, 'scaled')

phone_set(os.path.join(D, 'play-screenshots', 'src', 'tpl.html'), os.path.join(D, 'play-screenshots'), 1080, 1920)

tpl = open(os.path.join(D, 'play-desktop-screenshots', 'src', 'tpl.html')).read()
for out, a, b, sub, dots, imgs, cls, pw, cw, hs in DESKTOP:
    phones = ''.join(f'<div class="phone {c}"><img src="{url(i)}"></div>' for i, c in zip(imgs, cls))
    html = (tpl.replace('{{A}}', a).replace('{{B}}', b).replace('{{SUB}}', sub).replace('{{DOTS}}', dots)
            .replace('{{PHONES}}', phones).replace('{{PW}}', str(pw)).replace('{{W}}', str(cw)).replace('{{HS}}', str(hs))
            .replace('src="mark.png"', 'src="file://' + os.path.join(D, 'mark.png') + '"'))
    shoot(html, 2560, 1440, os.path.join(D, 'play-desktop-screenshots', out + '.png'))
    print('play-desktop-screenshots', out)
