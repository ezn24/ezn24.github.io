"""Authenticated Crowdin reports. Persist only ezn24 counts and aggregate totals."""
import concurrent.futures
import datetime
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

API = 'https://api.crowdin.com/api/v2'
USER_ID = 17236708
USERNAME = 'ezn24'

class ReportError(Exception):
    pass

def api(token, path, payload=None):
    url = API + path
    headers = {'Authorization': 'Bearer ' + token, 'Accept': 'application/json'}
    body = None
    if payload is not None:
        body = json.dumps(payload).encode()
        headers['Content-Type'] = 'application/json'
    request = urllib.request.Request(url, data=body, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)['data']
    except urllib.error.HTTPError as error:
        # Never log response bodies, authorization headers or signed URLs.
        raise ReportError('HTTP ' + str(error.code) + ' at ' + path) from None

def report_rows(data):
    """Find documented member records, including nested JSON export wrappers."""
    if isinstance(data, list):
        for item in data:
            yield from report_rows(item)
    elif isinstance(data, dict):
        identity = data.get('user') or data.get('_user') or {}
        if 'translated' in data and (isinstance(identity, dict) and identity or 'username' in data or 'userId' in data):
            yield data
            return
        for item in data.values():
            if isinstance(item, (list, dict)):
                yield from report_rows(item)

def summarize(data):
    members = list(report_rows(data))
    if not members:
        raise ReportError('Report contains no recognized contributor records')
    total = 0
    own = None
    for member in members:
        count = member['translated']
        if isinstance(count, str):
            count = int(count.replace(',', '').replace(' ', ''))
        if not isinstance(count, (int, float)) or isinstance(count, bool) or count < 0 or int(count) != count:
            raise ReportError('Invalid translated string count')
        count = int(count)
        total += count
        identity = member.get('user') or member.get('_user') or member
        username = str(identity.get('username', identity.get('login', ''))).lower()
        user_id = identity.get('id', member.get('userId'))
        if username == USERNAME or str(user_id) == str(USER_ID):
            if own is not None:
                raise ReportError('Duplicate personal member record')
            own = count
    if own is None:
        raise ReportError('ezn24 was not present in the language report')
    if total <= 0:
        raise ReportError('Report has no translated strings')
    return own, total

def fetch_report(token, project_id, language_id='zh-TW'):
    path = '/projects/' + str(project_id) + '/reports'
    schema = {
        'unit': 'strings', 'format': 'json',
        'dateFrom': '2000-01-01T00:00:00+00:00',
        'dateTo': datetime.datetime.now(datetime.timezone.utc).isoformat()}
    if language_id is not None:
        schema['languageId'] = language_id
    generated = api(token, path, {'name': 'top-members', 'schema': schema})
    identifier = generated['identifier']
    report_path = path + '/' + urllib.parse.quote(identifier, safe='')
    deadline = time.monotonic() + 100
    while time.monotonic() < deadline:
        status = api(token, report_path)
        if status['status'] == 'finished':
            download = api(token, report_path + '/download')
            url = download['url']
            if urllib.parse.urlsplit(url).scheme != 'https':
                raise ReportError('Report download is not HTTPS')
            # Download URLs are time-limited. Never send the API token to them.
            with urllib.request.urlopen(url, timeout=30) as response:
                return json.load(response)
        if status['status'] in ('failed', 'canceled'):
            raise ReportError('Crowdin report generation ' + status['status'])
        time.sleep(2)
    raise ReportError('Timed out waiting for report')

def enrich_crowdin(rows):
    token = os.environ.get('CROWDIN_TOKEN', '').strip()
    if not token:
        raise ReportError('CROWDIN_TOKEN is missing from the refresh step environment')
    successes = []
    errors = []
    def fetch(row):
        updated = dict(row)
        try:
            own, total = summarize(fetch_report(token, row['projectId']))
            updated.update(personalCount=own, personalTotal=total, personalPercent=100*own/total,
                personalStatus='available', personalMetric='share-of-reported-translation-activity',
                personalCheckedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
            print(f"Crowdin {row['slug']}: own={own}, total={total}, share={100*own/total:.2f}%")
            successes.append(row['slug'])
            # Audit whether a language filter hides additional personal work.
            # Keep it separate: other languages cannot inflate the zh-TW ratio.
            try:
                all_own, _ = summarize(fetch_report(token, row['projectId'], None))
                updated['personalAllLanguagesCount'] = all_own
                updated['personalLanguageAuditAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                print(f"Crowdin language audit {row['slug']}: zh-TW={own}, all={all_own}")
            except (ReportError, KeyError, ValueError, urllib.error.URLError):
                print(f"::warning::Crowdin language audit unavailable for {row['slug']}")
        except (ReportError, KeyError, ValueError, urllib.error.URLError) as error:
            safe_error = str(error) if isinstance(error, ReportError) else type(error).__name__
            print(f"::warning::Crowdin {row['slug']}: {safe_error}")
            errors.append(row['slug'])
        return updated
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        result = list(pool.map(fetch, rows))
    print(f'Crowdin personal reports: {len(successes)}/{len(rows)} successful')
    if not successes:
        raise ReportError('No Crowdin personal reports could be read; see per-project HTTP statuses above')
    return result
