'use strict';
const repo='https://github.com/ezn24/cardeck-neo';
const imageBase='https://raw.githubusercontent.com/ezn24/cardeck-neo/a60abd3bf1b0d217e867acc63d9ff0faf646448d/docs/screenshots/';
const words={
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
step1:['安裝 CarDeck Neo，首次啟動時閱讀並同意免責聲明。','安装 CarDeck Neo，首次启动时阅读并同意免责声明。','Install CarDeck Neo and read and accept the disclaimer on first launch.'],
step2:['啟動 Shizuku，並在 CarDeck Neo 首頁授權。','启动 Shizuku，并在 CarDeck Neo 首页授权。','Start Shizuku and grant access from CarDeck Neo.'],
step3:['開啟車機的無線 CarPlay 配對模式，在手機點選開始連線。','开启车机的无线 CarPlay 配对模式，在手机点击开始连接。','Enable wireless CarPlay pairing on the head unit and tap Start connection on your phone.'],
step4:['連線後車機會出現主畫面，可透過手機或車機設定調整。','连接后车机将显示主界面，可通过手机或车机设置调整。','The dashboard appears once connected; adjust settings from the phone or head unit.'],
safetyTitle:['使用前請注意','使用前请注意','Before you use it'],
safety:['請在停車時連線與調整設定。行駛途中可能斷線，請保留原廠導航作為備援。','请在停车时连接与调整设置。行驶途中可能断线，请保留原厂导航作为备用。','Connect and change settings while parked. The connection may drop while driving; keep factory navigation as a backup.'],
unofficial:['本專案與 Apple 或車廠無隸屬關係，未獲授權或認證，並非 MFi 產品。CarPlay 為 Apple 商標，僅用於說明相容性。','本项目与 Apple 或车厂无隶属关系，未获授权或认证，并非 MFi 产品。CarPlay 为 Apple 商标，仅用于说明兼容性。','This independent project is not affiliated with Apple or any car manufacturer, is not authorized or certified, and is not an MFi product. CarPlay is an Apple trademark used to describe compatibility.'],
disclaimer:['完整免責聲明','完整免责声明','Full disclaimer'],downloadTitle:['下載 CarDeck Neo。','下载 CarDeck Neo。','Download CarDeck Neo.'],
signed:['正式簽名 APK','正式签名 APK','Signed release APK'],details:['版本資訊','版本信息','Release information'],releases:['所有版本','所有版本','All releases'],issues:['問題回報','问题反馈','Report an issue'],credits:['基於 CarDeck 的獨立 UI 衍生專案 · MIT 授權','基于 CarDeck 的独立 UI 衍生项目 · MIT 授权','Independent UI fork of CarDeck · MIT license']
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
  if(releaseDate)document.getElementById('release-date').textContent=new Date(releaseDate).toLocaleDateString(lang,{year:'numeric',month:'long',day:'numeric'});
}
function theme(){const value=get('ezn24-theme','system');document.documentElement.dataset.theme=['dark','light','system'].includes(value)?value:'system'}
const menus=['theme','language'];
function closeMenus(){for(const key of menus){document.getElementById(key+'-menu').hidden=true;document.getElementById(key).setAttribute('aria-expanded','false')}}
for(const key of menus){
  const trigger=document.getElementById(key);trigger.setAttribute('aria-controls',key+'-menu');trigger.setAttribute('aria-expanded','false');
  trigger.addEventListener('click',()=>{const menu=document.getElementById(key+'-menu');const open=menu.hidden;closeMenus();menu.hidden=!open;trigger.setAttribute('aria-expanded',String(open))});
}
document.querySelectorAll('[data-theme-choice]').forEach(el=>el.addEventListener('click',()=>{save('ezn24-theme',el.dataset.themeChoice);theme();closeMenus();document.getElementById('theme').focus()}));
document.querySelectorAll('[data-lang-choice]').forEach(el=>el.addEventListener('click',()=>{save('ezn24-language',el.dataset.langChoice);renderLanguage();closeMenus();document.getElementById('language').focus()}));
document.addEventListener('click',e=>{if(!e.target.closest('.controls'))closeMenus()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus()});
window.addEventListener('languagechange',renderLanguage);
window.addEventListener('storage',()=>{theme();renderLanguage()});
document.querySelectorAll('[data-shot]').forEach(el=>el.addEventListener('click',()=>{
  document.querySelectorAll('[data-shot]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));
  document.getElementById('resolution-image').src=imageBase+el.dataset.shot;
  document.getElementById('resolution-caption').textContent=el.textContent.replace('×',' × ');
}));
function validDownload(value){
  try{const url=new URL(value);return url.origin==='https://github.com'&&url.pathname.startsWith('/ezn24/cardeck-neo/releases/download/')&&url.pathname.endsWith('.apk')}catch{return false}
}
async function updateRelease(){
  try{
    const response=await fetch('https://api.github.com/repos/ezn24/cardeck-neo/releases/latest',{signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('Release unavailable');
    const release=await response.json();
    if(typeof release.tag_name!=='string'||!Array.isArray(release.assets))throw Error('Invalid release');
    const apk=release.assets.find(a=>a.name.endsWith('-release.apk')&&validDownload(a.browser_download_url));
    document.querySelectorAll('.version').forEach(el=>el.textContent=release.tag_name);
    document.querySelectorAll('.download-link').forEach(el=>el.href=apk?.browser_download_url||repo+'/releases/latest');
    document.getElementById('release-notes').textContent=release.body||release.tag_name;
    releaseDate=release.published_at;
    renderLanguage();
  }catch{
    document.querySelectorAll('.download-link').forEach(el=>el.href=repo+'/releases/latest');
    document.getElementById('release-notes').textContent=repo+'/releases/latest';
  }
}
theme();renderLanguage();updateRelease();
