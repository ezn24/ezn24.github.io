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


def main():
    previous = json.loads(SNAPSHOT.read_text())
    old = {repo['name']: repo for repo in previous['repos']}
    repos = list(pages(f'/users/{ACCOUNT}/repos', type='owner'))

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
