"""Discover every contributed translation and reconcile surviving Git evidence."""
import concurrent.futures
import datetime
import json
import re
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

HOST = 'https://hosted.weblate.org'
ROOT = Path(__file__).resolve().parents[1]
QUERY = 'state:>=translated AND changed_by:ezn24'

def request(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'ezn24-profile-public-data'})
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.read().decode()

def api(url):
    return json.loads(request(url))

class ContributionsParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()
        self.next_url = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag != 'a':
            return
        href = attrs.get('href', '')
        if re.fullmatch(r'/projects/[^/]+/[^/]+/[^/]+/', href):
            self.paths.add(href)
        if 'next' in attrs.get('rel', '').split():
            self.next_url = urllib.parse.urljoin(HOST, href)

def discover(previous):
    # The landing profile previews only a subset. This is the complete list.
    url = HOST + '/user/ezn24/contributions/'
    paths = set()
    seen = set()
    while url:
        if url in seen or not url.startswith(HOST + '/user/ezn24/contributions/'):
            raise ValueError('Invalid contribution-list pagination')
        seen.add(url)
        parser = ContributionsParser()
        parser.feed(request(url))
        paths.update(parser.paths)
        url = parser.next_url
    if not paths:
        raise ValueError('No contributed translations found')
    known = {row['api']: row for row in previous}
    result = []
    for path in sorted(paths):
        endpoint = HOST + path.replace('/projects/', '/api/translations/', 1)
        result.append(dict(known.get(endpoint, {}), api=endpoint, url=HOST + path))
    return result

def all_units(endpoint):
    url = endpoint + 'units/?page_size=1000'
    result = []
    seen = set()
    while url:
        if url in seen or not url.startswith(endpoint + 'units/'):
            raise ValueError('Invalid units pagination')
        seen.add(url)
        data = api(url)
        result.extend(data['results'])
        url = data['next']
    return result

def reconcile(units, historical_contexts, changed_contexts):
    """Count each currently translated unit once, even when both sources match."""
    contexts = set(historical_contexts) | set(changed_contexts)
    return {unit['id'] for unit in units
            if unit['translated'] and unit['context'] in contexts}

def refresh_weblate(previous):
    evidence = json.loads((ROOT / 'weblate-history.json').read_text())
    try:
        rows = discover(previous)
    except Exception as error:
        print('::warning::Retaining Weblate list: ' + type(error).__name__)
        rows = previous
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    def refresh(row):
        try:
            data = api(row['api'])
            component = data['component']
            project = component['project']
            language = data['language']['code']
            name = project['name'] + ' — ' + component['name']
            if language != 'zh_Hant':
                name += ' · ' + language.replace('_', '-')
            history = evidence.get(row['api'])
            query = urllib.parse.urlencode({'q': QUERY, 'page_size': 1000 if history else 1})
            personal_api = row['api'] + 'units/?' + query
            personal_data = api(personal_api)
            count = personal_data['count']
            total = data['total']
            metric = 'share-of-current-strings-ever-edited'
            extra = {}
            if history:
                # Refactors can recreate units and erase their old change links.
                # Git contexts restore only keys still present in this component.
                units = all_units(row['api'])
                if len(units) != total:
                    raise ValueError('Incomplete current translation units')
                if personal_data['next']:
                    raise ValueError('Incomplete current personal units')
                contexts = {unit['context'] for unit in personal_data['results']}
                matched = reconcile(units, history['contexts'], contexts)
                extra = {'personalApiCount': count,
                         'personalHistoryRecovered': len(matched) - count,
                         'personalEvidenceUrl': history['evidenceUrl']}
                count = len(matched)
                metric = 'share-of-current-strings-with-git-history'
            if not isinstance(count, int) or not 0 <= count <= total or total <= 0:
                raise ValueError('Invalid participation counts')
            updated = dict(row, name=name, language=language, percent=data['translated_percent'],
                translated=data['translated'], total=total, personalApi=personal_api,
                personalCount=count, personalTotal=total, personalPercent=100*count/total,
                personalStatus='available', personalMetric=metric, personalCheckedAt=timestamp,
                **extra)
            print(f"Weblate {name}: own={count}, total={total}, share={100*count/total:.2f}%")
            return updated
        except Exception as error:
            print('::warning::Retaining Weblate snapshot for ' + row['api'] + ': ' + type(error).__name__)
            return row if 'name' in row else None

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        result = list(pool.map(refresh, rows))
    # Discovery never removes earlier dated entries just because an API fails.
    by_api = {row['api']: row for row in result if row is not None}
    for row in previous:
        by_api.setdefault(row['api'], row)
    return sorted(by_api.values(), key=lambda row: row['name'].casefold())
