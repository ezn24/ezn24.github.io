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
let pinnedNames = ['ntfy-windows','fcitx5-android','Sponsor-Skip-Bilibili','Language-Selector-Neo','TransYou-Android','nhentai-downloader-web'];
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
  const eligible = repos.filter(r => !excluded.has(r.name) && !/gkd|gdk/i.test(r.name) && !r.archived && !r.disabled && !r.private && (filter === 'all' || (filter === 'fork' ? r.fork : !r.fork)));
  const byRecent=(a,b)=>(Date.parse(b.pushed_at)||0)-(Date.parse(a.pushed_at)||0);
  const featured=pinnedNames.map(name=>eligible.find(r=>r.name===name)).filter(Boolean);
  const featuredNames=new Set(featured.map(r=>r.name));
  const starred=eligible.filter(r=>!featuredNames.has(r.name)&&Number(r.stargazers_count)>0).sort((a,b)=>Number(b.stargazers_count)-Number(a.stargazers_count)||byRecent(a,b)).slice(0,3);
  const starredNames=new Set(starred.map(r=>r.name));
  const recent=eligible.filter(r=>!featuredNames.has(r.name)&&!starredNames.has(r.name)).sort(byRecent).slice(0,6);
  const list=[...featured,...starred,...recent];
  grid.innerHTML = list.length ? list.map((r,i) => {
    const url = 'https://github.com/' + ACCOUNT + '/' + encodeURIComponent(r.name);
    const symbol = /lang|trans|locale|zh_/i.test(r.name) ? '文 / A' : /android|dex|gym/i.test(r.name) ? '⌘' : /ntfy/i.test(r.name) ? '↗' : '{ }';
    const date = Date.parse(r.pushed_at);
    return `${i===0 && featured.length?'<h3 class="repo-group-label">GitHub 釘選專案</h3>':''}${i===featured.length && starred.length?'<h3 class="repo-group-label">最多星的專案</h3>':''}${i===featured.length+starred.length && recent.length?'<h3 class="repo-group-label">最近推送的專案</h3>':''}<article class="repo-card"><div class="repo-art ${i%2 ? 'blue' : ''}" aria-hidden="true"><span class="art-symbol">${symbol}</span><span class="art-label">${escapeHTML(r.language || 'OPEN SOURCE')} / ${String(i+1).padStart(2,'0')}</span></div><div class="repo-content"><div class="repo-top"><span>${r.fork ? 'FORK / 衍生開發' : 'PUBLIC / 獨立倉庫'}</span><span>↗</span></div><h3><a href="${url}">${escapeHTML(r.name)}</a></h3><p>${escapeHTML(r.description || '在 GitHub 查看專案內容與最新進度。')}</p><div class="repo-meta"><span>● ${escapeHTML(r.language || '未標示語言')}</span><span>☆ ${Number(r.stargazers_count)||0}</span><span>⑂ ${Number(r.forks_count)||0}</span></div><div class="repo-footer"><span>最近推送</span><span>${Number.isNaN(date) ? '—' : `<time datetime="${escapeHTML(r.pushed_at)}">${dateFormat.format(date)}</time>`}</span></div></div></article>`;
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
  return items.map(([name,slug])=>`<a class="translation-item" href="${base}${slug}/${base.includes('crowdin')?'zh-TW':''}"><span>${escapeHTML(name)}</span><small>${base.includes('crowdin')?'查看進度':'繁中在地化'}</small><span aria-hidden="true">↗</span></a>`).join('');
}
document.getElementById('weblate-projects').innerHTML=translationLinks(weblate,'https://hosted.weblate.org/projects/');
document.getElementById('crowdin-projects').innerHTML=translationLinks(crowdin,'https://crowdin.com/project/');

loadRepos();

// Motion follows the reference's technical, editorial rhythm.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
  }), {threshold:0.08});
  document.querySelectorAll('.section-heading,.translation-columns,.about-layout,.closing,.languages').forEach(el=>{el.classList.add('reveal-ready');observer.observe(el);});
}
// Translate generated labels while preserving repository content.
const uiObserver=new MutationObserver(()=>window.translateUI?.(grid));
uiObserver.observe(grid,{childList:true});
window.translateUI?.(document.getElementById('translations'));
document.addEventListener('ui-language-change',()=>{renderRepos();setRepoStatus(lastRepoStatus);window.translateUI?.(document.body);});

// Custom button menus retain the existing theme and language change handlers.
const preferenceMenus=[];
function closePreferenceMenus(restore=false){preferenceMenus.forEach(({trigger,menu})=>{const wasOpen=!menu.hidden;menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(restore&&wasOpen)trigger.focus();});}
function buildPreferenceMenu(type,choices){
  const select=document.getElementById(type),trigger=document.getElementById(type+'-trigger'),menu=document.getElementById(type+'-menu');
  const preference={trigger,menu,render(){
    menu.replaceChildren(...choices.map(([value,label])=>{
      const button=document.createElement('button');button.type='button';button.role='menuitemradio';button.setAttribute('aria-checked',String(value===select.value));
      const indicator=document.createElement('span');indicator.className='choice-indicator';indicator.setAttribute('aria-hidden','true');button.append(indicator,document.createTextNode(label));
      button.addEventListener('click',()=>{select.value=value;select.dispatchEvent(new Event('change'));closePreferenceMenus();trigger.focus();preferenceMenus.forEach(item=>item.render());});return button;
    }));window.translateUI?.(menu);
  }};
  preferenceMenus.push(preference);preference.render();
  trigger.addEventListener('click',()=>{const open=menu.hidden;closePreferenceMenus();if(open){preference.render();menu.hidden=false;trigger.setAttribute('aria-expanded','true');menu.querySelector('[aria-checked=true]')?.focus();}});
  trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(menu.hidden)trigger.click();const items=menu.querySelectorAll('button');items[event.key==='ArrowUp'?items.length-1:0]?.focus();}});
  menu.addEventListener('keydown',event=>{const items=[...menu.querySelectorAll('button')];let index=items.indexOf(document.activeElement);if(event.key==='Escape'){event.preventDefault();closePreferenceMenus(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();index=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[index].focus();}});
}
buildPreferenceMenu('theme',[['system','跟隨系統'],['light','淺色'],['dark','深色']]);
buildPreferenceMenu('language',[['system','自動語言'],['zh-Hant','繁體中文'],['zh-Hans','简体中文'],['en','English']]);
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.control-dropdown'))closePreferenceMenus();});
document.addEventListener('focusin',event=>{if(!event.target.closest('.control-dropdown'))closePreferenceMenus();});
document.addEventListener('ui-language-change',()=>preferenceMenus.forEach(item=>item.render()));
window.addEventListener('storage',()=>preferenceMenus.forEach(item=>item.render()));
if('IntersectionObserver' in window){const navObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{const link=document.querySelector('.nav nav a[href="#'+entry.target.id+'"]');if(entry.isIntersecting)link?.setAttribute('aria-current','location');else link?.removeAttribute('aria-current');});},{rootMargin:'-15% 0px -65% 0px'});document.querySelectorAll('#projects,#translations,#about').forEach(section=>navObserver.observe(section));}

async function loadLocalizationProgress(){
  let snapshot;
  try {const response=await fetch('./localization-progress.json?v=20261028-crowdin9',{signal:AbortSignal.timeout(8000)});if(!response.ok)return;snapshot=await response.json();}catch{return;}
  for(const platform of ['weblate','crowdin']){
    const container=document.getElementById(platform+'-projects');let displayedRows=snapshot[platform]||[];let checkedAt=snapshot[platform+'CheckedAt']||snapshot.checkedAt;let live=false;
    function show(){container.innerHTML=displayedRows.map(row=>{
      const valid=value=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(100,value)):null;
      const percent=valid(row.percent),personal=valid(row.personalPercent);
      const knownPersonal=row.personalStatus==='available'&&personal!==null&&Number.isInteger(row.personalCount)&&Number.isInteger(row.personalTotal)&&row.personalTotal>0;
      const personalLabel=knownPersonal?`${row.personalCount} / ${row.personalTotal} · ${personal.toFixed(1)}%`:'';
      const personalDate=row.personalCheckedAt?new Date(row.personalCheckedAt).toLocaleString(document.documentElement.lang):'';
      return `<div class="translation-progress"><a href="${escapeHTML(row.url)}"><span>${escapeHTML(row.name)}</span><span class="progress-value">${percent===null?'—':percent.toFixed(1)+'%'}</span><span class="progress-arrow" aria-hidden="true">↗</span></a>${percent===null?'<span class="progress-note">目前無公開統計</span>':`<progress max="100" value="${percent}" aria-label="${escapeHTML(row.name)} Traditional Chinese"></progress>`}${knownPersonal?`<div class="progress-detail personal-detail" title="${escapeHTML(personalDate)}"><span>我的參與</span><span>${personalLabel}</span></div><progress class="personal-progress" max="100" value="${personal}" aria-label="${escapeHTML(row.name)} personal participation"></progress>`:''}</div>`;
    }).join('')+`<p class="progress-note"><span>${live?'公開統計同步於':'統計快照'}</span> ${escapeHTML(new Date(checkedAt).toLocaleString(document.documentElement.lang))}</p>`;window.translateUI?.(container);observeProgressCards(container);}
    show();document.addEventListener('ui-language-change',show);
    const key='ezn24-localization-'+platform+'-v5-crowdin';let cached;try{cached=JSON.parse(localStorage.getItem(key))}catch{}
    if(cached&&Array.isArray(cached.rows)&&cached.rows.length>0&&cached.rows.length===displayedRows.length&&Date.now()-cached.time<6*60*60*1000){displayedRows=cached.rows;checkedAt=cached.time;live=true;show();continue;}
    Promise.all(displayedRows.map(async row=>{
      if(!row.api)return {...row,stale:true};
      try{const response=await fetch(row.api,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error();const data=await response.json();
        if(platform==='weblate'){
          if(typeof data.translated_percent!=='number')throw Error();
          let updated={...row,percent:data.translated_percent};
          if(row.personalApi){try{const personalResponse=await fetch(row.personalApi,{signal:AbortSignal.timeout(10000)});if(!personalResponse.ok)throw Error();const personalData=await personalResponse.json();if(!Number.isInteger(personalData.count)||!Number.isInteger(data.total)||data.total<=0||personalData.count<0||personalData.count>data.total)throw Error();updated={...updated,personalCount:personalData.count,personalTotal:data.total,personalPercent:100*personalData.count/data.total,personalStatus:'available',personalCheckedAt:new Date().toISOString()};}catch{/* Keep the timestamped personal snapshot. */}}
          return updated;
        }
        const roots=new Set(row.rootIds||[]);if(!roots.size)throw Error();
        const stats=data.data.map(item=>item.data).filter(item=>roots.has(item.id));if(stats.length!==roots.size)throw Error();
        const total=stats.reduce((sum,item)=>sum+item.total,0);if(!total)throw Error();
        return {...row,percent:100*stats.reduce((sum,item)=>sum+item.translated,0)/total,approved:100*stats.reduce((sum,item)=>sum+item.approved,0)/total};
      }catch{return {...row,stale:true};}
    })).then(rows=>{if(rows.length>0&&rows.every(row=>!row.stale)){displayedRows=rows;checkedAt=Date.now();live=true;show();try{localStorage.setItem(key,JSON.stringify({time:checkedAt,rows}))}catch{}}});
  }
}
loadLocalizationProgress();

fetch('./pinned-repos.json?v=20261028-full4').then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(Array.isArray(data.repositories)){pinnedNames=data.repositories;renderRepos();window.translateUI?.(grid);}}).catch(()=>{});
function observeProgressCards(container){
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('progress-enter');observer.unobserve(entry.target);}}),{threshold:.3});
  container.querySelectorAll('.translation-progress').forEach(card=>observer.observe(card));
}
