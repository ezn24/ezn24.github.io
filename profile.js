'use strict';
// No credentials are used in the browser. Only GitHub public repositories are requested.
const ACCOUNT = 'ezn24';
const CACHE_KEY = 'ezn24-repos-v1';
const TTL = 5 * 60 * 1000;
const excluded = new Set(['.github', 'Web', 'ezn24.github.io', 'ezn24']);
const themeSelect = document.getElementById('theme');
themeSelect.value = document.documentElement.dataset.theme;
themeSelect.addEventListener('change', () => {
  document.documentElement.dataset.theme = themeSelect.value;
  try { localStorage.setItem('ezn24-theme', themeSelect.value); } catch { /* private browsing */ }
});
window.addEventListener('storage', (e) => {
  if (e.key !== 'ezn24-theme') return;
  const value = ['light', 'dark', 'system'].includes(e.newValue) ? e.newValue : 'system';
  document.documentElement.dataset.theme = value;
  themeSelect.value = value;
});
// CSS prefers-color-scheme follows system changes immediately while in system mode.
let repos = [];
let filter = 'all';
let loading = false;
let retryAt = 0;
const grid = document.getElementById('repo-grid');
const status = document.getElementById('repo-status');
const refresh = document.getElementById('refresh');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const dateFormat = {format: date => new Intl.DateTimeFormat(document.documentElement.lang, {year:'numeric',month:'2-digit',day:'2-digit'}).format(date)};
let lastRepoStatus='';
function setRepoStatus(text){lastRepoStatus=text;status.textContent=window.uiStatus?window.uiStatus(text):text;}
function renderRepos() {
  const list = repos.filter(r => !excluded.has(r.name) && !r.archived && !r.disabled && !r.private && (filter === 'all' || (filter === 'fork' ? r.fork : !r.fork)))
    .sort((a,b) => (Date.parse(b.pushed_at) || 0) - (Date.parse(a.pushed_at) || 0)).slice(0,6);
  grid.innerHTML = list.length ? list.map((r,i) => {
    const url = 'https://github.com/' + ACCOUNT + '/' + encodeURIComponent(r.name);
    const symbol = /lang|trans|locale|zh_/i.test(r.name) ? '文 / A' : /android|dex|gym/i.test(r.name) ? '⌘' : /ntfy/i.test(r.name) ? '↗' : '{ }';
    const date = Date.parse(r.pushed_at);
    return `<article class="repo-card"><div class="repo-art ${i%2 ? 'blue' : ''}" aria-hidden="true"><span class="art-symbol">${symbol}</span><span class="art-label">${escapeHTML(r.language || 'OPEN SOURCE')} / ${String(i+1).padStart(2,'0')}</span></div><div class="repo-content"><div class="repo-top"><span>${r.fork ? 'FORK / 衍生開發' : 'PUBLIC / 獨立倉庫'}</span><span>↗</span></div><h3><a href="${url}">${escapeHTML(r.name)}</a></h3><p>${escapeHTML(r.description || '在 GitHub 查看專案內容與最新進度。')}</p><div class="repo-meta"><span>● ${escapeHTML(r.language || '未標示語言')}</span><span>☆ ${Number(r.stargazers_count)||0}</span><span>⑂ ${Number(r.forks_count)||0}</span></div><div class="repo-footer"><span>最近推送</span><span>${Number.isNaN(date) ? '—' : `<time datetime="${escapeHTML(r.pushed_at)}">${dateFormat.format(date)}</time>`}</span></div></div></article>`;
  }).join('') : '<p class="loading-card">這個分類目前沒有公開專案。</p>';
}
function readCache() {
  try { const data=JSON.parse(localStorage.getItem(CACHE_KEY)); return Array.isArray(data?.repos) && Number.isFinite(data.time) ? data : null; } catch { return null; }
}
async function fetchRepos() {
  let output=[];
  for(let page=1;page<=10;page++) {
    const response=await fetch(`https://api.github.com/users/${ACCOUNT}/repos?sort=pushed&direction=desc&per_page=100&page=${page}`, {headers:{Accept:'application/vnd.github+json'}, signal:AbortSignal.timeout(12000)});
    if(!response.ok) {
      if(response.status === 403 || response.status === 429) retryAt=Number(response.headers.get('x-ratelimit-reset'))*1000 || Date.now()+TTL;
      throw new Error(`GitHub ${response.status}`);
    }
    const batch=await response.json();
    if(!Array.isArray(batch)) throw new Error('Invalid GitHub response');
    output.push(...batch);
    if(batch.length<100) return output;
  }
  return output;
}
async function loadRepos(force=false) {
  if(loading || document.hidden) return;
  loading=true;refresh.disabled=true;grid.setAttribute('aria-busy','true');
  const cached=readCache();
  try {
    if(cached && !force && Date.now()-cached.time<TTL) {
      repos=cached.repos;renderRepos();
      setRepoStatus(`✓ GitHub 公開資料 · 快取於 ${new Date(cached.time).toLocaleString('zh-TW')} · 每 5 分鐘更新`);
      return;
    }
    if(Date.now()<retryAt) throw new Error('Rate limit cooldown');
    setRepoStatus('正在同步 GitHub 公開資料…');
    repos=await fetchRepos();
    const now=Date.now();
    try { localStorage.setItem(CACHE_KEY,JSON.stringify({time:now,repos})); } catch { /* storage unavailable */ }
    renderRepos();
    setRepoStatus(`✓ 已同步 GitHub · ${new Date(now).toLocaleString('zh-TW')} · 每 5 分鐘更新`);
  } catch(error) {
    if(cached) {
      repos=cached.repos;renderRepos();
      setRepoStatus(`暫時無法連線 GitHub，顯示 ${new Date(cached.time).toLocaleString('zh-TW')} 的快取資料。`);
    } else {
      try {
        const response=await fetch('./repos-snapshot.json',{signal:AbortSignal.timeout(8000)});
        if(!response.ok) throw new Error('Snapshot unavailable');
        const snapshot=await response.json();
        if(!Array.isArray(snapshot.repos)) throw new Error('Invalid snapshot');
        repos=snapshot.repos;renderRepos();
        setRepoStatus(`暫時無法連線 GitHub，顯示 ${dateFormat.format(new Date(snapshot.fetchedAt))} 的備份資料，並非即時狀態。`);
      } catch {
        setRepoStatus('無法取得專案資料，請稍後再試。');
        grid.innerHTML='<p class="loading-card">暫時無法載入。<a href="https://github.com/ezn24?tab=repositories">前往 GitHub 查看所有專案 ↗</a></p>';
      }
    }
  } finally {loading=false;refresh.disabled=false;grid.setAttribute('aria-busy','false');}
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => {item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button));});
  renderRepos();
}));
refresh.addEventListener('click',()=>loadRepos(true));
setInterval(()=>loadRepos(),TTL);
document.addEventListener('visibilitychange',()=>{if(!document.hidden) loadRepos();});
const weblate=[['Catima','catima'],['Aurora Store','aurora-store'],['FossWallet','fosswallet'],['MedTimer','medtimer'],['ntfy','ntfy'],['Tomato','tomato'],['Xed Editor','xed-editor']];
const crowdin=[['Bitwarden — Browser','bitwarden-browser'],['Bitwarden — Desktop','bitwarden-desktop'],['Bitwarden — Mobile','bitwarden-mobile'],['Bitwarden — Web','bitwarden-web'],['Canta','canta'],['CAPod','capod'],['Disco Launcher','groove-launcher'],['GitNex','gitnex'],['jtx Board','jtx-board'],['LabNex','labnex'],['Playnite','playnite'],['Streamyfin','streamyfin'],['Tacit Dynamics','foldersync'],['WeatherMaster','weathermaster']];
function translationLinks(items,base) {
  return items.map(([name,slug])=>`<a class="translation-item" href="${base}${slug}/"><span>${escapeHTML(name)}</span><small>繁中在地化</small><span aria-hidden="true">↗</span></a>`).join('');
}
document.getElementById('weblate-projects').innerHTML=translationLinks(weblate,'https://hosted.weblate.org/projects/');
document.getElementById('crowdin-projects').innerHTML=translationLinks(crowdin.slice(0,6),'https://crowdin.com/project/');
document.getElementById('crowdin-more').innerHTML=translationLinks(crowdin.slice(6),'https://crowdin.com/project/');
loadRepos();

// Motion follows the reference's technical, editorial rhythm.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
  }), {threshold:0.08});
  document.querySelectorAll('.section-heading,.translation-columns,.about-layout,.closing,.languages').forEach(el=>{el.classList.add('reveal-ready');observer.observe(el);});
}
let scrollQueued=false;
function updateScroll(){const extent=document.documentElement.scrollHeight-innerHeight;const progress=extent>0?Math.min(1,Math.max(0,scrollY/extent)):0;document.documentElement.style.setProperty('--progress',progress);document.getElementById('scroll-value').textContent=String(Math.round(progress*100)).padStart(3,'0');scrollQueued=false;}
addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll)}},{passive:true});
addEventListener('resize',updateScroll);updateScroll();
// Translate generated labels while preserving repository content.
const uiObserver=new MutationObserver(()=>window.translateUI?.(grid));
uiObserver.observe(grid,{childList:true});
window.translateUI?.(document.getElementById('translations'));
document.addEventListener('ui-language-change',()=>{renderRepos();setRepoStatus(lastRepoStatus);window.translateUI?.(document.body);});
