"""Publish the latest non-merge commit authored by ezn24 on each public repo's branches."""

import concurrent.futures
import datetime
import json
import os
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

ACCOUNT = 'ezn24'
SNAPSHOT = Path(__file__).resolve().parents[1] / 'repos-snapshot.json'
FIELDS = ('name', 'description', 'html_url', 'pushed_at', 'language',
          'fork', 'stargazers_count', 'forks_count', 'archived', 'disabled', 'private')


def api(path, **params):
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'ezn24-profile-data'}
    if token := os.environ.get('GH_TOKEN'):
        headers['Authorization'] = f'Bearer {token}'
    url = f'https://api.github.com{path}?{urlencode(params)}'
    with urlopen(Request(url, headers=headers), timeout=15) as response:
        return json.load(response), 'rel="next"' in response.headers.get('Link', '')


def pages(path, size=100, **params):
    page = 1
    while True:
        rows, more = api(path, per_page=size, page=page, **params)
        yield from rows
        if not more:
            break
        page += 1


def latest_commit(repo):
    path = '/repos/' + quote(repo['full_name'], safe='/')
    best = None
    try:
        branches = {branch['commit']['sha'] for branch in pages(path + '/branches')}
        for tip in branches:
            for commit in pages(path + '/commits', size=10, sha=tip, author=ACCOUNT):
                author = commit.get('author') or {}
                if author.get('login', '').casefold() != ACCOUNT or len(commit['parents']) > 1:
                    continue
                date = commit['commit']['author']['date']
                if best is None or date > best['date']:
                    best = {'date': date, 'sha': commit['sha']}
                break
    except HTTPError as error:
        if error.code != 409:
            raise
    return best


LOGOS = SNAPSHOT.with_name('repo-logos.json')
# Explicit project assets verified in each repository; avoid selecting toolbar icons.
LOGO_OVERRIDES = {
    "DroidCar": "docs/images/icon.svg",
    "ntfy-windows": "Assets/Icons/ntfy.png",
    "fcitx5-android": "app/src/fx/res/mipmap-xxxhdpi/ic_launcher.png",
    "Language-Selector-Neo": "app/src/main/ic_launcher-playstore.png",
    "Sponsor-Skip-Bilibili": "assets/graphics/icon.png",
    "ScrcpyDex": "assets/app_transparent.png",
    "cryptolyst": "src/app/favicon.ico"
}


def logo_score(path, size):
    p = path.casefold()
    filename = p.rsplit('/', 1)[-1]
    stem, _, ext = filename.rpartition('.')
    if ext not in ('png', 'svg', 'webp', 'ico', 'jpg', 'jpeg') or not 0 < size <= 2_000_000:
        return 0
    if any(x in p for x in ('/test/', '/tests/', '/node_modules/', '/screenshots/', '/plugin/', '/plugins/', '/vendor/', '/drawable-')):
        return 0
    if any(x in stem for x in ('debug', 'foreground', 'background', 'placeholder', 'badge', 'toast')):
        return 0
    if stem in ('logo', 'app-logo', 'app_logo', 'app-icon', 'app_icon', 'icon', 'ic_launcher-playstore'):
        return 100 - min(p.count('/'), 20)
    if stem == 'ic_launcher' and 'mipmap-xxxhdpi/' in p and p.startswith('app/'):
        return 75
    if stem == 'favicon':
        return 55 - min(p.count('/'), 20)
    return 0


def refresh_logos(repos):
    try:
        previous = json.loads(LOGOS.read_text()).get('logos', {})
    except (OSError, ValueError):
        previous = {}

    def inspect(repo):
        name, branch = repo['name'], repo['default_branch']
        if repo['private'] or repo['archived'] or repo['disabled'] or name in {'.github', 'Web', 'ezn24.github.io', ACCOUNT} or any(x in name.casefold() for x in ('gkd', 'gdk')):
            return name, None
        cached = previous.get(name, {})
        if cached.get('pushedAt') == repo['pushed_at'] and cached.get('branch') == branch:
            return name, cached
        try:
            data, _ = api('/repos/' + quote(repo['full_name'], safe='/') + '/git/trees/' + quote(branch, safe=''), recursive=1)
            paths = {x['path']: x for x in data['tree'] if x['type'] == 'blob'}
            override = LOGO_OVERRIDES.get(name)
            if override in paths:
                chosen = override
            else:
                candidates = [(logo_score(path, x.get('size', 0)), path) for path, x in paths.items()]
                chosen = max(candidates, default=(0, ''))[1] if any(score > 0 for score, _ in candidates) else None
            if data.get('truncated') and not chosen:
                return name, cached or None
            return name, {'branch': branch, 'path': chosen, 'pushedAt': repo['pushed_at']}
        except (OSError, ValueError, KeyError) as error:
            print(f'::warning::Logo discovery unavailable for {name}: {error}')
            return name, cached or None

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        entries = {name: value for name, value in pool.map(inspect, repos) if value is not None}
    LOGOS.write_text(json.dumps({'logos': entries}, ensure_ascii=False, indent=2) + '\\n')


def main():
    previous = json.loads(SNAPSHOT.read_text())
    old = {repo['name']: repo for repo in previous['repos']}
    repos = list(pages(f'/users/{ACCOUNT}/repos', type='owner'))
    refresh_logos(repos)

    def inspect(repo):
        row = {key: repo[key] for key in FIELDS}
        cached = old.get(row['name'], {})
        if row['archived'] or row['disabled'] or row['private'] or row['name'] in {
            '.github', 'Web', 'ezn24.github.io', ACCOUNT
        } or any(name in row['name'].casefold() for name in ('gkd', 'gdk')):
            return row
        if cached.get('activityScannedAtPush') == row['pushed_at'] and 'authoredCommit' in cached:
            return dict(row, authoredCommit=cached['authoredCommit'],
                        activityScannedAtPush=row['pushed_at'])
        try:
            commit = latest_commit(repo)
            return dict(row, authoredCommit=commit, activityScannedAtPush=row['pushed_at'])
        except (OSError, KeyError, ValueError) as error:
            print(f"::warning::GitHub activity unavailable for {row['name']}: {error}")
            if cached.get('authoredCommit'):
                row['authoredCommit'] = cached['authoredCommit']
            return row

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(inspect, repos))
    snapshot = {'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'repos': rows}
    SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')
    verified = [row for row in rows if row.get('authoredCommit')]
    print(f'GitHub: {len(verified)} of {len(rows)} public repositories have verified authored commits')


if __name__ == '__main__':
    main()
