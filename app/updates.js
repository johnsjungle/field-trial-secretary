let versionBrowserStarted=false, versionBrowserIndex=null, versionBrowserOnline=false;
function compareReleaseVersions(a,b) {
    const parse=v=>/^\d+\.\d+\.\d+$/.test(String(v)) ? String(v).split('.').map(Number) : null;
    const aa=parse(a),bb=parse(b);if(!aa || !bb) throw new Error('Invalid version number.');
    for(let i=0;i<3;i++) if(aa[i]!==bb[i]) return aa[i]>bb[i]?1:-1;
    return 0;
}
function safeReleaseUrl(value) {
    try {const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password && ['github.com','drive.google.com','docs.google.com','drive.usercontent.google.com'].includes(u.hostname) ? u.href : '';}catch{return '';}
}
function validateVersionIndex(value) {
    if(!value || value.schemaVersion!==1 || !Array.isArray(value.versions) || value.versions.length>200) throw new Error('Unsupported version list.');
    const seen=new Set();
    value.versions.forEach(v=>{compareReleaseVersions(v.version,v.version);if(seen.has(v.version)||!['available','pending'].includes(v.status)||!['stable','beta'].includes(v.channel))throw new Error('Invalid release entry.');seen.add(v.version);});
    return value;
}
function versionLink(label,url) {
    const safe=safeReleaseUrl(url);if(!safe)return null;
    const a=document.createElement('a');a.textContent=label;a.href=safe;a.target='_blank';a.rel='noopener noreferrer';a.className='version-download-link';return a;
}
function renderVersionBrowser() {
    document.getElementById('installedVersionText').textContent=`Installed: v${appVersionInfo.version} (${appVersionInfo.channel || 'local'})`;
    const list=document.getElementById('availableVersions'),folder=document.getElementById('versionFolderLink');list.replaceChildren();folder.replaceChildren();
    if(!versionBrowserIndex)return;
    const folderLink=versionLink('Open installer folder on Google Drive',versionBrowserIndex.downloadFolderUrl);if(folderLink)folder.appendChild(folderLink);
    const beta=document.getElementById('includeBetaVersions').checked;
    const versions=versionBrowserIndex.versions.filter(v=>beta || v.channel==='stable').slice().sort((a,b)=>compareReleaseVersions(b.version,a.version));
    for(const release of versions){
        const card=document.createElement('article');card.className='version-card';
        const title=document.createElement('h3');title.textContent=`v${release.version} · ${release.channel}${release.version===appVersionInfo.version?' · Installed':''}${release.status==='pending'?' · Downloads pending':''}`;
        const date=document.createElement('p');date.textContent=release.date || '';
        const summary=document.createElement('p');summary.textContent=release.summary || '';
        const links=document.createElement('div');links.className='button-row';
        for(const [label,url] of [['README',release.readmeUrl],['Release notes',release.notesUrl]]){const link=versionLink(label,url);if(link)links.appendChild(link);}
        if(release.status==='available'){
            for(const [key,label] of [['windows','Download Windows'],['appleSilicon','Download Mac — Apple Silicon'],['intel','Download Mac — Intel']]){const link=versionLink(label,release.downloads?.[key]);if(link)links.appendChild(link);}
            const legacy=versionLink('Release downloads',release.releaseUrl);if(legacy)links.appendChild(legacy);
        }
        card.append(title,date,summary,links);list.appendChild(card);
    }
    const latest=versions.find(v=>v.status==='available');
    const newer=latest && compareReleaseVersions(latest.version,appVersionInfo.version)>0;
    document.getElementById('versionCheckMessage').textContent=(versionBrowserOnline?'Online list checked. ':'Bundled list — check online for current availability. ')+(newer?`Update available: v${latest.version}.`:'No newer available release is listed for this selection.');
}
async function initializeVersionBrowser(){
    if(versionBrowserStarted){renderVersionBrowser();return;}versionBrowserStarted=true;
    document.getElementById('checkVersionsButton').addEventListener('click',checkAvailableVersions);
    document.getElementById('includeBetaVersions').addEventListener('change',renderVersionBrowser);
    try {const r=await fetch('version-index.json');if(!r.ok)throw new Error();versionBrowserIndex=validateVersionIndex(await r.json());renderVersionBrowser();}
    catch {document.getElementById('versionCheckMessage').textContent='Bundled list unavailable. Click Check for Updates to try online.';}
}
async function checkAvailableVersions(){
    const button=document.getElementById('checkVersionsButton');button.disabled=true;
    document.getElementById('versionCheckMessage').textContent='Checking for updates…';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
        const url=new URL(appVersionInfo.latestVersionUrl);
        if(url.protocol!=='https:' || url.hostname!=='raw.githubusercontent.com' || !url.pathname.startsWith('/johnsjungle/field-trial-secretary/'))throw new Error();
        const response=await fetch(url.href,{cache:'no-store',signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
        if(!response.ok)throw new Error();
        const text=await response.text();if(text.length>1000000)throw new Error();
        versionBrowserIndex=validateVersionIndex(JSON.parse(text));versionBrowserOnline=true;renderVersionBrowser();
    }catch{versionBrowserOnline=false;renderVersionBrowser();document.getElementById('versionCheckMessage').textContent='Could not check online. Check your internet connection and try again. The last loaded version list remains below.';}
    finally{clearTimeout(timer);button.disabled=false;}
}
