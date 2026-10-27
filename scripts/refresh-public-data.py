"""Refresh public profile data and authenticated personal reports."""
import concurrent.futures
import datetime
import json
import re
import urllib.request
from pathlib import Path
from crowdin_contributions import enrich_crowdin

ROOT = Path(__file__).resolve().parents[1]
def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()
def request(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'ezn24-profile-public-data'})
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.read().decode()
def api(url):
    return json.loads(request(url))
def refresh(row):
    try:
        data = api(row['api'])
        if 'rootIds' not in row:
            updated = dict(row, percent=data['translated_percent'])
            if row.get('personalApi'):
                try:
                    personal = api(row['personalApi'])
                    count, total = personal['count'], data['total']
                    if not isinstance(count, int) or not 0 <= count <= total or total <= 0:
                        raise ValueError('Invalid personal participation counts')
                    updated.update(personalCount=count, personalTotal=total,
                                   personalPercent=100*count/total,
                                   personalStatus='available', personalCheckedAt=now())
                except Exception as error:
                    print(f"Retaining dated personal snapshot for {row['name']}: {error}")
            return updated
        nodes = api(row['api'].removesuffix('/progress'))
        roots = {item['data']['id'] for item in nodes['data'] if item['data'].get('parentId') == 0 and not item['data'].get('isScreenshot')}
        records = [item['data'] for item in data['data'] if item['data']['id'] in roots]
        if not roots or len(records) != len(roots):
            raise ValueError('Incomplete root-level progress')
        total = sum(item['total'] for item in records)
        if not total:
            raise ValueError('Empty translation corpus')
        translated = sum(item['translated'] for item in records)
        approved = sum(item['approved'] for item in records)
        return dict(row, rootIds=sorted(roots), total=total, translated=translated,
                    approvedWords=approved, percent=100*translated/total,
                    approved=100*approved/total)
    except Exception as error:
        print(f"Retaining prior data for {row['name']}: {error}")
        return None

snapshot_path = ROOT / 'localization-progress.json'
snapshot = json.loads(snapshot_path.read_text())
for platform in ('weblate', 'crowdin'):
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        rows = list(pool.map(refresh, snapshot[platform]))
    if all(row is not None for row in rows):
        snapshot[platform] = rows
        snapshot[platform+'CheckedAt'] = now()
snapshot['crowdin'] = enrich_crowdin(snapshot['crowdin'])
snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2)+'\n')
try:
    html = request('https://github.com/ezn24')
    start = html.index('js-pinned-items-reorder-container')
    # Limit collection to the actual pinned list, not the rest of the profile.
    end = html.index('</ol>', start)
    names = list(dict.fromkeys(re.findall(r'href="/ezn24/([^"/#?]+)"', html[start:end])))
    if names and len(names) <= 6:
        (ROOT/'pinned-repos.json').write_text(json.dumps({'username':'ezn24', 'checkedAt':now(), 'repositories':names}, indent=2)+'\n')
except Exception as error:
    print(f'Retaining prior pins: {error}')
