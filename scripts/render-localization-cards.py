"""Generate small README images from the existing authenticated snapshot (no API calls)."""
import json
from collections import OrderedDict
from pathlib import Path
from urllib.parse import urlsplit
from xml.sax.saxutils import escape
import xml.etree.ElementTree as ET

ET.register_namespace('', 'http://www.w3.org/2000/svg')

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

def logo(platform, dark, x, y, width, height):
    """Embed the official vector artwork; no external image fetches in README."""
    name = platform + ('-white.svg' if dark else '-dark.svg')
    root = ET.parse(ROOT / 'assets' / 'platform-logos' / name).getroot()
    allowed = {'svg', 'g', 'path', 'defs', 'linearGradient', 'radialGradient',
               'stop', 'clipPath', 'rect', 'circle', 'polygon', 'polyline', 'line', 'use'}
    for parent in list(root.iter()):
        for child in list(parent):
            if child.tag.rsplit('}', 1)[-1] not in allowed:
                parent.remove(child)
    viewbox = [float(value) for value in root.get('viewBox').split()]
    scale = min(width / viewbox[2], height / viewbox[3])
    tx = x - viewbox[0] * scale
    ty = y + (height - viewbox[3] * scale) / 2 - viewbox[1] * scale
    group = ET.Element('{http://www.w3.org/2000/svg}g', {
        'transform': f'translate({tx},{ty}) scale({scale})',
        'fill': root.get('fill', 'black')})
    definitions = ET.SubElement(group, '{http://www.w3.org/2000/svg}defs')
    for child in root:
        if child.tag.rsplit('}', 1)[-1] in {'linearGradient', 'radialGradient', 'clipPath'}:
            definitions.append(child)
        else:
            group.append(child)
    return ET.tostring(group, encoding='unicode')


def render(snapshot, theme):
    panel_height = max(390, 120 + 18 * max(len(projects(snapshot, p)) for p in ('weblate', 'crowdin')))
    height = panel_height + 30
    dark = theme == 'dark'
    bg, fg, muted, line, stripe = ('#0d1117', '#e6edf3', '#9da9b5', '#30363d', '#161b22') if dark else ('#ffffff', '#263238', '#63717d', '#d6dfe6', '#f5f7f9')
    colors = {'weblate': '#2eccaa' if dark else '#1fa385', 'crowdin': '#ffffff' if dark else '#263238'}
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{height}" viewBox="0 0 {WIDTH} {height}" role="img" aria-labelledby="title desc">',
             f'<rect width="{WIDTH}" height="{height}" fill="{bg}"/>',
             '<title id="title">在地化貢獻 (Localization contributions) — ezn24</title>',
             '<desc id="desc">Weblate: current contributed strings across all components and languages. Crowdin: all-time Traditional Chinese translation share. Proofreading excluded. Full bilingual list of participating projects.</desc>']
    def text(x, y, value, size=11, color=fg, weight=400, anchor='start', mono=False):
        family = 'ui-monospace,Consolas,monospace' if mono else 'Inter,Arial,Noto Sans CJK TC,Noto Sans TC,sans-serif'
        parts.append(f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" font-family="{family}">{escape(str(value))}</text>')
    for column, platform in enumerate(('weblate', 'crowdin')):
        rows = projects(snapshot, platform)
        x, accent = column * 408, colors[platform]
        parts.append(f'<rect x="{x+.5}" y=".5" width="391" height="{panel_height-1}" rx="12" fill="{bg}" stroke="{line}"/>')
        parts.append(logo(platform, dark, x+18, 16, 128, 32))
        text(x+374, 30, f'{len(rows)} 個專案', 10, muted, anchor='end')
        text(x+374, 43, 'Projects', 9, muted, anchor='end')
        text(x+18, 65, '參與項目', 10, muted)
        text(x+18, 77, 'Projects', 8.5, muted)
        text(x+289, 65, '字串', 10, muted, anchor='end')
        text(x+289, 77, 'Strings', 8.5, muted, anchor='end')
        text(x+374, 65, '占比', 10, muted, anchor='end')
        text(x+374, 77, 'Share', 8.5, muted, anchor='end')
        for index, row in enumerate(rows):
            if not 0 <= row['count'] <= row['total'] or row['total'] <= 0:
                raise ValueError('Invalid project counts')
            y = 94 + 18 * index
            pct = 100 * row['count'] / row['total']
            label = '<0.1%' if 0 < pct < .1 else f'{pct:.1f}%'
            if index % 2 == 0:
                parts.append(f'<rect x="{x+9}" y="{y-13}" width="374" height="18" rx="4" fill="{stripe}"/>')
            text(x+18, y, row['name'], 11.1, fg)
            text(x+289, y, f"{row['count']:,}", 10.5, muted, anchor='end', mono=True)
            text(x+374, y, label, 10.5, accent, 600, anchor='end', mono=True)
        text(x+18, panel_height-24, '現存字串・元件與語言合計' if platform == 'weblate' else '歷年繁中翻譯貢獻占比', 9.5, muted)
        text(x+18, panel_height-11, 'Current strings · all components & languages' if platform == 'weblate' else 'All-time Traditional Chinese translation share', 8.5, muted)
    text(1, height-10, '每 6 小時更新 (Updated every 6h)', 9.5, muted)
    text(799, height-10, '完整明細 (Full details) ↗', 9.5, muted, anchor='end')
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
