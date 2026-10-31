"""Generate small README images from the existing authenticated snapshot (no API calls)."""
import json
from collections import OrderedDict
from pathlib import Path
from urllib.parse import urlsplit
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT = 800, 410

def projects(snapshot, platform):
    if platform == 'crowdin':
        return [dict(name=row['name'].replace(' — ', ' / '), count=row['personalCount'],
                     total=row['personalTotal']) for row in snapshot[platform]
                if row.get('personalStatus') == 'available']
    grouped = OrderedDict()
    seen = set()
    for row in snapshot['weblate']:
        if row.get('personalStatus') != 'available':
            continue
        if row['api'] in seen:
            raise ValueError('Duplicate Weblate translation endpoint')
        seen.add(row['api'])
        slug = urlsplit(row['api']).path.split('/')[3]
        project = grouped.setdefault(slug, dict(name=row['name'].split(' — ')[0], count=0, total=0))
        project['count'] += row['personalCount']
        project['total'] += row['personalTotal']
    return list(grouped.values())

def render(snapshot, theme):
    height = max(HEIGHT, round(132 + 18.5 * max(len(projects(snapshot, p)) for p in ('weblate', 'crowdin'))))
    dark = theme == 'dark'
    bg, fg, muted, line = ('#0d1117', '#e6edf3', '#98a5b2', '#303a45') if dark else ('#ffffff', '#263238', '#62717d', '#d7dfe5')
    colors = {'weblate': '#2eccaa' if dark else '#1fa385', 'crowdin': '#ffffff' if dark else '#263238'}
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{height}" viewBox="0 0 {WIDTH} {height}" role="img" aria-labelledby="title desc">',
             '<title id="title">ezn24 localization contributions</title>',
             '<desc id="desc">Weblate projects combine components and languages using total contributed strings divided by total current strings. Crowdin percentages use all-time Traditional Chinese member reports. Proofreading is excluded.</desc>',
             f'<rect x=".5" y=".5" width="799" height="{height-1}" rx="6" fill="{bg}" stroke="{line}"/>',
             f'<path d="M400 16V{height-44}" stroke="{line}"/>']
    def text(x, y, value, size=11, color=fg, weight=400, anchor='start', mono=False):
        family = 'ui-monospace,Consolas,monospace' if mono else 'Inter,Arial,Noto Sans TC,sans-serif'
        parts.append(f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" font-family="{family}">{escape(str(value))}</text>')
    for column, platform in enumerate(('weblate', 'crowdin')):
        rows = projects(snapshot, platform)
        x, accent = column * 400, colors[platform]
        parts.append(f'<path d="M{x+18} 21v20" stroke="{accent}" stroke-width="3"/>')
        text(x+28, 36, platform.title(), 21, accent, 700)
        text(x+382, 34, f'{len(rows)} PROJECTS', 10, muted, anchor='end', mono=True)
        text(x+18, 58, '個人貢獻', 10, muted)
        text(x+310, 58, '字串', 10, muted, anchor='end')
        text(x+382, 58, '比例', 10, muted, anchor='end')
        for index, row in enumerate(rows):
            if not 0 <= row['count'] <= row['total'] or row['total'] <= 0:
                raise ValueError('Invalid project counts')
            y = 79 + 18.5 * index
            pct = 100 * row['count'] / row['total']
            label = '<0.1%' if 0 < pct < .1 else f'{pct:.1f}%'
            parts.append(f'<path d="M{x+18} {y+5}h364" stroke="{line}" stroke-opacity=".45"/>')
            text(x+18, y, row['name'], 11.3, fg)
            text(x+310, y, f"{row['count']:,}", 10.5, muted, anchor='end', mono=True)
            text(x+382, y, label, 10.5, accent, 600, anchor='end', mono=True)
        text(x+18, height-41, '元件／語言合併計算' if platform == 'weblate' else '歷年繁中翻譯占比', 10, muted)
    text(18, height-16, '共用網站統計快照 · 每 6 小時排程更新 · 不含審核', 10, muted)
    text(782, height-16, '完整清單 ↗', 10, muted, anchor='end')
    parts.append('</svg>')
    return '\n'.join(parts) + '\n'

def main():
    snapshot = json.loads((ROOT / 'localization-progress.json').read_text())
    destination = ROOT / 'assets'
    destination.mkdir(exist_ok=True)
    for theme in ('dark', 'light'):
        (destination / f'localization-{theme}.svg').write_text(render(snapshot, theme))
    print('Generated compact localization cards from the shared snapshot')

if __name__ == '__main__':
    main()
