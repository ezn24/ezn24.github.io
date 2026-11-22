'use strict';
const repo='https://github.com/ezn24/DroidCar';
const imageBase='https://raw.githubusercontent.com/ezn24/DroidCar/a59ed732ad3df2bd374a5ba46d7207e10b6d17a9/docs/screenshots/';
const words={
newFeatures:["更多車機整合功能。","更多车机集成功能。","More head-unit integrations."],
tested:["通話、儀表與旋鈕功能已在 WinPlay 或 ChairPlay 驗證，尚未實車測試。","通话、仪表与旋钮功能已在 WinPlay 或 ChairPlay 验证，尚未实车测试。","Calls, cluster and physical controls have been verified with WinPlay or ChairPlay; real-car testing is pending."],
releaseUnavailable:["暫時無法取得發佈資訊，請至 GitHub 查看最新版本。","暂时无法获取发布信息，请至 GitHub 查看最新版本。","Release information is unavailable. View the latest release on GitHub."],
callsTitle:["車機通話","車机通话","Calls on the head unit"],
callsText:["支援電話及 WhatsApp、Telegram、微信通話卡片，車機麥克風與通話音訊整合。","支持电话及 WhatsApp、Telegram、微信通话卡片，车机麦克风与通话音频集成。","Call cards for phone, WhatsApp, Telegram and WeChat, with car microphone and call audio integration."],
clusterTitle:["儀表與 HUD","仪表与 HUD","Instrument cluster & HUD"],
clusterText:["向相容儀表傳送轉向導航、車道指示與播放資訊；支援獨立的儀表副螢幕。","向兼容仪表传送转向导航、车道指示与播放信息；支持独立的仪表副屏幕。","Send turn guidance, lane information and media details to compatible clusters; support a separate cluster screen."],
controlsTitle:["旋鈕與多指觸控","旋钮与多指触控","Physical controls & multi-touch"],
controlsText:["支援車機旋鈕、搖桿與實體按鍵操作，相容車機可使用雙指縮放。","支持车机旋钮、摇杆与实体按键操作，兼容车机可使用双指缩放。","Use knobs, joysticks and physical buttons; pinch to zoom on compatible multi-touch head units."],

navExperience:['體驗','体验','Experience'],navSetup:['安裝','安装','Setup'],navDownload:['下載','下载','Download'],
system:['跟隨系統','跟随系统','System'],light:['淺色','浅色','Light'],dark:['深色','深色','Dark'],
tagline:['把熟悉的 Android 體驗，帶到你的車機。','把熟悉的 Android 体验，带到你的车机。','Bring your familiar Android experience to your car.'],
intro:['透過無線 CarPlay 連接相容車機，在車載啟動器中使用地圖、音樂與手機應用程式。無須 Root，需要 Shizuku。','通过无线 CarPlay 连接兼容车机，在车载启动器中使用地图、音乐与手机应用。无需 Root，需要 Shizuku。','Connect to a compatible head unit over wireless CarPlay. Use maps, music and your phone apps in a car launcher. No root required; Shizuku is required.'],
download:['下載最新版','下载最新版','Download latest'],source:['查看原始碼','查看源代码','View source'],actual:['實際車機介面','实际车机界面','Actual head-unit interface'],
experienceTitle:['為車載介面而設計。','为车载界面而设计。','Designed for your dashboard.'],
dashboardTitle:['地圖與音樂，並排呈現。','地图与音乐，并排呈现。','Maps and music, side by side.'],
dashboardText:['可直接拖曳、縮放地圖，並從主畫面切換至應用程式頁面。Dock 提供時間、訊號、電量和執行中的應用程式。','可直接拖动、缩放地图，并从主界面切换至应用页面。Dock 提供时间、信号、电量和运行中的应用。','Pan and zoom the map directly, then swipe to your apps. The Dock shows time, signal, battery and running apps.'],
layoutTitle:['適應不同車機尺寸。','适应不同车机尺寸。','Adapt to your display.'],
layoutText:['寬螢幕使用左右分割，較窄螢幕預設將 Dock 移到底部。選擇尺寸查看實際畫面。','宽屏使用左右分割，较窄屏幕默认将 Dock 移到底部。选择尺寸查看实际画面。','Wide screens use a split view; narrower screens default to a bottom Dock. Choose a resolution to see the actual layout.'],
phoneTitle:['手機端，保持簡潔。','手机端，保持简洁。','Simple controls on your phone.'],
phoneText:['連線、車機設定與診斷集中在三個分頁。跟隨系統深淺主題與主題色，支援繁體中文、簡體中文和英文。','连接、车机设置与诊断集中在三个标签页。跟随系统深浅主题与主题色，支持繁体中文、简体中文和英文。','Connect, Car and Diagnostics in three tabs. Follow your system theme and accent color, with Traditional Chinese, Simplified Chinese and English.'],
audio:['透過 Shizuku 擷取系統播放音訊','通过 Shizuku 捕获系统播放音频','Capture playback audio through Shizuku'],
wallpaper:['車機桌布、深淺主題自動切換','车机壁纸、深浅主题自动切换','Car wallpapers and automatic dark/light switching'],
notifications:['通知橫幅、輔助圓點與最近使用的應用程式','通知横幅、辅助圆点与最近使用的应用','Notification banners, assistive dot and recent apps'],
automation:['連線／斷線 Intent 自動化','连接／断开 Intent 自动化','Connect/disconnect Intent automation'],
geminiTitle:['Gemini 車機整合','Gemini 车机集成','Gemini on the head unit'],
geminiText:['實驗性功能，可在車機顯示 Gemini 介面並回應觸控。','实验性功能，可在车机显示 Gemini 界面并响应触控。','Experimental support for showing the Gemini interface on the head unit with touch input.'],
setupTitle:['準備好，開始連線。','准备好，开始连接。','Get ready to connect.'],
reqAndroid:['Android 手機；強制橫向需要 Android 14+。','Android 手机；强制横屏需要 Android 14+。','Android phone; force landscape requires Android 14+.'],
reqShizuku:['安裝、啟動並授權 Shizuku，無須 Root。','安装、启动并授权 Shizuku，无需 Root。','Install, start and authorize Shizuku. No root required.'],
shizukuLink:['Shizuku 官方網站','Shizuku 官方网站','Shizuku website'],
reqCar:['支援無線 CarPlay 的車機，已與手機透過藍牙配對。','支持无线 CarPlay 的车机，已与手机通过蓝牙配对。','A wireless CarPlay-compatible head unit paired with your phone via Bluetooth.'],
step1:['安裝 DroidCar，首次啟動時閱讀並同意免責聲明。','安装 DroidCar，首次启动时阅读并同意免责声明。','Install DroidCar and read and accept the disclaimer on first launch.'],
step2:['啟動 Shizuku，並在 DroidCar 首頁授權。','启动 Shizuku，并在 DroidCar 首页授权。','Start Shizuku and grant access from DroidCar.'],
step3:['開啟車機的無線 CarPlay 配對模式，在手機點選開始連線。','开启车机的无线 CarPlay 配对模式，在手机点击开始连接。','Enable wireless CarPlay pairing on the head unit and tap Start connection on your phone.'],
step4:['連線後車機會出現主畫面，可透過手機或車機設定調整。','连接后车机将显示主界面，可通过手机或车机设置调整。','The dashboard appears once connected; adjust settings from the phone or head unit.'],
safetyTitle:['使用前請注意','使用前请注意','Before you use it'],
safety:['請在停車時連線與調整設定。行駛途中可能斷線，請保留原廠導航作為備援。','请在停车时连接与调整设置。行驶途中可能断线，请保留原厂导航作为备用。','Connect and change settings while parked. The connection may drop while driving; keep factory navigation as a backup.'],
unofficial:['本專案與 Apple 或車廠無隸屬關係，未獲授權或認證，並非 MFi 產品。CarPlay 為 Apple 商標，僅用於說明相容性。','本项目与 Apple 或车厂无隶属关系，未获授权或认证，并非 MFi 产品。CarPlay 为 Apple 商标，仅用于说明兼容性。','This independent project is not affiliated with Apple or any car manufacturer, is not authorized or certified, and is not an MFi product. CarPlay is an Apple trademark used to describe compatibility.'],
disclaimer:['完整免責聲明','完整免责声明','Full disclaimer'],downloadTitle:['下載 DroidCar。','下载 DroidCar。','Download DroidCar.'],
signed:['正式簽名 APK','正式签名 APK','Signed release APK'],details:['版本資訊','版本信息','Release information'],releases:['所有版本','所有版本','All releases'],issues:['問題回報','问题反馈','Report an issue'],credits:['基於 CarDeck 的獨立 UI 衍生專案 · GPL-3.0 授權','基于 CarDeck 的独立 UI 衍生项目 · GPL-3.0 授权','Independent UI fork of CarDeck · GPL-3.0 license']
};
const get=(key,fallback)=>{try{return localStorage.getItem(key)||fallback}catch{return fallback}};
const save=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
let releaseDate=null;
function renderLanguage(){
  let lang=get('ezn24-language','system');
  if(!['zh-Hant','zh-Hans','en'].includes(lang)){
    const preferred=navigator.languages?.find(v=>/^(zh|en)/i.test(v))||'en';
    lang=/^zh/i.test(preferred)?(/Hans|CN|SG/i.test(preferred)?'zh-Hans':'zh-Hant'):'en';
  }
  document.documentElement.lang=lang;
  const index=['zh-Hant','zh-Hans','en'].indexOf(lang);
  document.querySelectorAll('[data-i]').forEach(el=>{if(words[el.dataset.i])el.textContent=words[el.dataset.i][index]});
  document.dispatchEvent(new Event('ui-language-change'));
  if(releaseDate)document.getElementById('release-date').textContent=new Date(releaseDate).toLocaleDateString(lang,{year:'numeric',month:'long',day:'numeric'});
}
function theme(){const value=get('ezn24-theme','system');document.documentElement.dataset.theme=['dark','light','system'].includes(value)?value:'system'}
document.getElementById('theme').value=get('ezn24-theme','system');
document.getElementById('language').value=get('ezn24-language','system');
for(const key of ['theme','language'])document.getElementById(key).addEventListener('change',e=>{save('ezn24-'+key,e.target.value);theme();renderLanguage();});
const preferenceMenus=[];
function closePreferenceMenus(restore=false){preferenceMenus.forEach(({trigger,menu})=>{const wasOpen=!menu.hidden;menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(restore&&wasOpen)trigger.focus();});}
function buildPreferenceMenu(type,choices){
  const select=document.getElementById(type),trigger=document.getElementById(type+'-trigger'),menu=document.getElementById(type+'-menu');
  const preference={trigger,menu,render(){
    menu.replaceChildren(...choices.map(([value,label])=>{
      const button=document.createElement('button');button.type='button';button.role='menuitemradio';button.setAttribute('aria-checked',String(value===select.value));
      const indicator=document.createElement('span');indicator.className='choice-indicator';indicator.setAttribute('aria-hidden','true');button.append(indicator,document.createTextNode(label));
      button.addEventListener('click',()=>{select.value=value;select.dispatchEvent(new Event('change'));closePreferenceMenus();trigger.focus();preferenceMenus.forEach(item=>item.render());});return button;
    }));menu.querySelectorAll('button').forEach((button,i)=>{const value=choices[i][0];const labels=type==='language'&&value==='system'?['自動語言','自动语言','Automatic']:words[value];if(labels)button.lastChild.textContent=labels[['zh-Hant','zh-Hans','en'].indexOf(document.documentElement.lang)]||choices[i][1];});
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
window.addEventListener('languagechange',renderLanguage);
window.addEventListener('storage',()=>{for(const key of ['theme','language'])document.getElementById(key).value=get('ezn24-'+key,'system');theme();renderLanguage();});
const frame=document.getElementById('resolution-frame');
const caption=document.getElementById('resolution-caption');
let shotRequest=0;
document.querySelectorAll('[data-shot]').forEach(button=>{
  if(!button.hasAttribute('aria-pressed'))button.setAttribute('aria-pressed','false');
  button.addEventListener('click',async()=>{
    const request=++shotRequest;
    const next=new Image();
    next.alt='Head unit resolution preview';
    next.src=imageBase+button.dataset.shot;
    try{await next.decode()}catch{return}
    if(request!==shotRequest)return;
    const current=document.getElementById('resolution-image');
    if(current.src===next.src)return;
    document.querySelectorAll('[data-shot]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    frame.querySelectorAll('.outgoing').forEach(el=>el.remove());
    current.removeAttribute('id');
    current.classList.add('outgoing');
    current.alt='';
    current.setAttribute('aria-hidden','true');
    next.id='resolution-image';
    next.width=next.naturalWidth;next.height=next.naturalHeight;
    frame.append(next);
    const [w,h]=button.dataset.shot.match(/(\d+)x(\d+)/).slice(1);
    frame.style.aspectRatio=w+'/'+h;
    caption.textContent=button.textContent.replace('×',' × ');
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||!next.animate){current.remove();return}
    next.animate([{opacity:0,transform:'scale(.985)'},{opacity:1,transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});
    const fade=current.animate([{opacity:1},{opacity:0}],{duration:400,easing:'ease'});
    fade.finished.then(()=>current.remove(),()=>current.remove());
  });
});
function validDownload(value){
  try{const url=new URL(value);return url.origin==='https://github.com'&&url.pathname.toLowerCase().startsWith('/ezn24/droidcar/releases/download/')&&url.pathname.endsWith('.apk')}catch{return false}
}
// Parse Markdown locally, then rebuild only safe, semantic markup. Never attach raw HTML.
function renderReleaseMarkdown(markdown,base){
  const target=document.getElementById('release-notes');
  if(!window.marked){target.textContent=markdown;return}
  try{
    const template=document.createElement('template');
    const parser=new marked.Marked({gfm:true});
    parser.use({renderer:{html(token){return String(token.text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}}});
    template.innerHTML=parser.parse(markdown);
    const allowed=new Set(['H1','H2','H3','H4','H5','H6','P','UL','OL','LI','STRONG','B','EM','I','DEL','S','CODE','PRE','BLOCKQUOTE','HR','BR','A','TABLE','THEAD','TBODY','TR','TH','TD']);
    const fragment=document.createDocumentFragment();
    function copy(node,parent){
      if(node.nodeType===Node.TEXT_NODE){parent.append(document.createTextNode(node.textContent));return}
      if(node.nodeType!==Node.ELEMENT_NODE)return;
      if(!allowed.has(node.tagName)){
        if(node.tagName==='IMG'){parent.append(document.createTextNode(node.getAttribute('alt')||''));return}
        for(const child of node.childNodes)copy(child,parent);
        return;
      }
      const el=document.createElement(node.tagName.toLowerCase());
      if(node.tagName==='A'){
        try{const url=new URL(node.getAttribute('href')||'',base||repo);if(['https:','http:'].includes(url.protocol)){el.href=url.href;el.rel='noopener noreferrer';}}catch{}
      }
      if(node.tagName==='OL'&&/^\d+$/.test(node.getAttribute('start')||''))el.start=Number(node.getAttribute('start'));
      for(const child of node.childNodes)copy(child,el);
      parent.append(el);
    }
    for(const child of template.content.childNodes)copy(child,fragment);
    target.replaceChildren(fragment);
  }catch{target.textContent=markdown}
}

async function updateRelease(){
  try{
    const response=await fetch('https://api.github.com/repos/ezn24/DroidCar/releases/latest',{signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('Release unavailable');
    const release=await response.json();
    if(typeof release.tag_name!=='string'||!Array.isArray(release.assets))throw Error('Invalid release');
    const apk=release.assets.find(a=>a.name.toLowerCase().endsWith('.apk')&&validDownload(a.browser_download_url));
    document.querySelectorAll('.version').forEach(el=>el.textContent=release.tag_name);
    document.querySelectorAll('.download-link').forEach(el=>el.href=apk?.browser_download_url||repo+'/releases/latest');
    renderReleaseMarkdown(release.body||release.tag_name,release.html_url);
    releaseDate=release.published_at;
    renderLanguage();
  }catch{
    document.querySelectorAll('.download-link').forEach(el=>el.href=repo+'/releases/latest');
    const notes=document.getElementById('release-notes');
    notes.replaceChildren();const link=document.createElement('a');link.href=repo+'/releases/latest';link.dataset.i='releaseUnavailable';notes.append(link);renderLanguage();
  }
}
theme();renderLanguage();updateRelease();

const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
if('IntersectionObserver' in window&&!reducedMotion.matches){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});document.querySelectorAll('.reveal-target').forEach(el=>{el.classList.add('reveal-ready');observer.observe(el);});}
if('IntersectionObserver' in window){const navObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{const link=document.querySelector('.nav nav a[href="#'+entry.target.id+'"]');if(entry.isIntersecting)link?.setAttribute('aria-current','location');else link?.removeAttribute('aria-current');}),{rootMargin:'-15% 0px -65% 0px'});document.querySelectorAll('#experience,#setup,#download').forEach(section=>navObserver.observe(section));}
