(() => {
'use strict';
const topicRows=[
['Trials','Create, select, archive, or lock the working trial.','The active lock prevents work in the wrong event|Show Archived keeps finished trials available'],
['Event','Stores the identity used on entries, reports, and forms.','Choose AKC or ASFA before activity begins|Association locks after entries, draws, or running order exist'],
['Trial Type','Controls event options and stake grouping.','Blank split override uses association rules|An override applies only to this trial'],
['Location','Provides the site information used on paperwork.','Match the premium list|Short site names fit forms better'],
['Schedule','Sets event dates, times, and roll call.','Check AM and PM carefully|Review each day of a multi-day event'],
['Officials','Records officials printed on event documents.','Add reusable people in Admin first|Consistent names prevent duplicates'],
['Fields & Roll Call Lanes','Defines field and lane names used in assignments.','Short names fit working sheets|Multiple lanes can speed large check-ins'],
['Copy Trial Setup','Copies reusable setup without copying results.','Useful for a weekend cluster|Always verify dates, number, and judges'],
['Hound Database','Maintains reusable hound records.','Search before creating a record|Registration number is the best duplicate check'],
['Hounds In Database','Lists reusable hound records.','Search by name or registration|Breed abbreviations appear beside call names on some forms'],
['Trial Entries','Adds hounds with trial-specific class and details.','One hound can enter several selected trials|Correct entries before running order or draws'],
['Specialty Stakes','Pairs Kennel and Breeder entries and records Bench entries.','Pairs save automatically|Pair members must be the same breed'],
['Import Dogs','Imports many hounds and entries from a file.','Test new formats in a test trial|Review class names and breed codes'],
['Running Order & Assignments','Sets breed order and assigns judges and workers.','Paddock and field clerk are optional|Conflict indicators catch overlapping duties'],
['Printable Sheets','Creates working sheets for trial day.','Roll call can print one sheet per lane across all fields|Draw, judge, and record sheets show assigned fields on multi-field trials|Detailed roll call adds registration and owner information|The Trial Guide warns when sheets become stale'],
['Roll Call Check In','Records every hound’s day-of-event status.','Only present hounds enter the draw|Do not leave Not Checked entries'],
['Owner Separation','Keeps same-owner hounds apart when rules require it.','Letters can be adjusted manually|Review again after entry changes'],
['Initial Breed & Stake Groups','Previews grouping before colors are drawn.','Best place to spot a wrong breed or stake|AKC and ASFA grouping can differ'],
['Preliminary Draw','Randomizes preliminary courses and colors.','Entry changes can make a draw stale|Singles and LCI are handled separately'],
['Draw Order Sheet','Previews the posted preliminary order.','Reprint after rebuilding|Verify the active-trial badge'],
['Prelim Scoring','Records preliminary scores and builds finals.','Unlock only for corrections|Group draw buttons save time'],
['Finals Scoring','Records final scores, totals, and placements.','Ties can create runoff items|Print posting sheets when final'],
['Run Offs Scoring','Handles placement ties and Best of Breed.','Allowed outcomes may avoid a course|Redrawing changes posted colors'],
['BIF / BIE','Selects runners, compares multi-trial totals, runs optional breed pre-qualifiers, and records BIF or BIE.','Use the pre-qualifier when a breed has multiple representatives|Assign up to six BIE judges|Print the running confirmation before marking all runners|Uncontested breeds wait for the main elimination|Regenerate packets after changes'],
['Main Results','Collects placements and awards.','Use the ribbon report as a final cross-check|Return to scoring for unresolved results'],
['Score Report','Provides a consolidated scoring review.','Use it to find blank scores|Regenerate after corrections'],
['ASFA Secretary Report','Builds the ASFA Secretary Report and payment record.','Complete it before the record packet|The Trial Guide tracks print and payment'],
['AKC Secretary Report','Builds the AKC Event Secretary Report.','Verify event number and club|Regenerate after corrections'],
['ASFA Record Packet','Creates ASFA record sheets and the submission packet.','Check alignment before trial day|Regenerate after corrections'],
['AKC Submission Packet','Creates AKC score sheets and submission pages.','Regenerate after BIE changes|Unused repeated PDF rows should be blank'],
['Submit Paperwork','Records that final paperwork was sent.','Keep an archive copy|Mark submitted only after sending the corrected packet'],
['Archive Trial','Locks a finished trial and creates its record package.','Archived trials remain reviewable|Unlock only for documented corrections'],
['Judge Directory','Stores reusable judge information.','Consistent names prevent duplicates|Directory judges must also be added to Trial Judges'],
['Trial Judges','Chooses judges available to the selected trial.','Removing one can affect assignments|Reuse directory records'],
['Worker Database','Stores reusable workers and roles.','People can serve different roles|Consistent names improve conflict checks'],
['Trial Workers','Chooses workers available to the selected trial.','Adding someone does not assign a duty|Review conflicts after assignments'],
['Documents & Reports','Provides official forms, catalogs, and reports.','Verify the active trial|Preview before printing'],
['Official Forms','Adjusts information alignment on association PDFs.','Reset restores defaults|Make small changes and preview again'],
['Catalog Reports','Builds entry and final catalogs.','Final catalogs include awards|Specialty catalogs include Kennel, Breeder, and Bench'],
['Admin Test Data','Creates sample records for safe practice.','Test trials are marked|Practice printing and imports here'],
['Run Group Test Plan','Shows test groups, courses, and assignments.','Useful for uncommon group sizes|Compare it with printable sheets'],
['Delete Test Trials','Removes intentional test trials.','Live trials should not appear here|Back up before broad cleanup'],
['Recover Deleted Trials','Restores a recently deleted trial.','Safer than restoring the whole database|Verify identity and date first'],
['Backup & Transfer','Backs up, undoes, restores, and moves the program.','SQLite backup is preferred|Program Update preserves data; Transfer Installer is for a new computer'],
['Trial Readiness Checklist','Checks whether a trial is ready for trial day.','Run it before printing|Recheck after entry changes'],
['Updates & Versions','Checks for updates and shows the installed version.','Updates are separate from trial data|Offline use continues after installation']
];
const H=Object.fromEntries(topicRows.map(([name,summary,tips])=>[name,{summary,tips:tips.split('|')}]))
const stepRows=[
['Trials','Select or create a trial|Set it active|Lock it while working'],
['Event','Enter event identity|Choose AKC or ASFA|Save before entries'],
['Trial Type','Choose offered options|Review split settings|Save before drawing'],
['Location','Enter site details|Compare with premium|Save'],
['Schedule','Enter dates|Set roll call and start times|Verify each day'],
['Officials','Select officials|Confirm names and contacts|Save'],
['Fields & Roll Call Lanes','Add fields|Add lanes if used|Use names in assignments'],
['Copy Trial Setup','Choose a source trial|Create the copy|Correct dates, number, and officials'],
['Hound Database','Search first|Add or correct the record|Save it for reuse'],
['Hounds In Database','Search the list|Open a hound|Review or edit its record'],
['Trial Entries','Find the hound|Set class and entry details|Add it to selected trials'],
['Specialty Stakes','Mark eligible entries|Choose Kennel or Breeder partners|Review the catalog'],
['Import Dogs','Choose a file|Review matches and warnings|Commit verified rows'],
['Running Order & Assignments','Build from entries|Arrange groups|Assign people and resolve conflicts'],
['Printable Sheets','Choose roll-call grouping, sort, and detail|Review each previewed sheet|Print the current version'],
['Roll Call Check In','Review each entry|Mark a status|Confirm none remain Not Checked'],
['Owner Separation','Run the owner check|Review letters|Mark reviewed'],
['Initial Breed & Stake Groups','Review counts|Check split results|Correct entries before drawing'],
['Preliminary Draw','Finish roll call|Build and review courses|Print draw and judge sheets'],
['Draw Order Sheet','Build the draw|Check names and colors|Print for posting'],
['Prelim Scoring','Enter scores or outcomes|Verify and lock prelims|Draw finals'],
['Finals Scoring','Print judge sheets|Enter finals|Review placements and ties'],
['Run Offs Scoring','Review needed courses|Draw and print|Record the result'],
['BIF / BIE','Print the eligible-hound running confirmation|Mark all hounds running or not running at once|Set runner status and compare trial totals|Enable breed pre-qualifiers when needed|Assign up to six judges, draw, print, score, and advance winners'],
['Main Results','Review placements|Resolve warnings|Print the ribbon report'],
['Score Report','Complete scoring|Compare with judge sheets|Print or retain'],
['ASFA Secretary Report','Answer questions|Review totals and fees|Print and record payment'],
['AKC Secretary Report','Answer questions|Review totals|Print before the packet'],
['ASFA Record Packet','Finish report and payment|Generate and inspect pages|Print or save'],
['AKC Submission Packet','Finish the report|Generate and inspect pages|Print or save'],
['Submit Paperwork','Review the packet|Submit as directed|Mark submitted'],
['Archive Trial','Finish submission|Create the archive package|Archive the trial'],
['Judge Directory','Search for the judge|Enter details|Save'],
['Trial Judges','Choose directory judges|Add them to the trial|Use them in assignments'],
['Worker Database','Search for the worker|Enter contact and roles|Save'],
['Trial Workers','Choose database workers|Add them to the trial|Assign them in Running Order'],
['Documents & Reports','Choose a report area|Verify the active trial|Preview before printing'],
['Official Forms','Choose a template|Preview alignment|Adjust and preview again'],
['Catalog Reports','Select trials|Choose catalog type|Build and review'],
['Admin Test Data','Create a test trial|Practice the workflow|Remove test data when done'],
['Run Group Test Plan','Select a test trial|Review groups and duties|Compare with sheets'],
['Delete Test Trials','Review marked tests|Select records|Delete and verify'],
['Recover Deleted Trials','Find the trial|Verify identity|Restore and select it'],
['Backup & Transfer','Create a backup|Choose undo, restore, or transfer|Verify the result'],
['Trial Readiness Checklist','Select a trial|Review warnings|Open each linked area to correct it'],
['Updates & Versions','Check online|Review the offered version|Install and restart as directed']
];
const STEPS=Object.fromEntries(stepRows.map(([name,steps])=>[name,steps.split('|')]));
const problemRows=[
['I cannot switch to another trial','The current trial may be locked as active. Open Trials, unlock it, then activate the other trial.','setup','Trials','','locked active switch wrong event'],
['The association is locked or wrong','Association locks after entries, a draw, or running-order activity. Correct it before starting the workflow.','setup','Event','','akc asfa association disabled'],
['A hound appears twice','Search Hound Database by registration number. Keep the complete record and correct the entry using the duplicate.','admin','Hound Database','Hound DB','dog duplicate repeated'],
['A hound is missing from the trial','Confirm it was added to the selected trial, then review its roll-call status.','entries','Trial Entries','','dog hound missing entry'],
['My import did not recognize columns or dogs','Review the preview, column matches, registration numbers, classes, and breed abbreviations.','entries','Import Dogs','','spreadsheet csv excel import failed'],
['A breed or stake group looks wrong','Check breed, stake, and roll-call status. Review split settings, then rebuild.','rollcall','Initial Breed & Stake Groups','','split stakes breed group override flight'],
['Same-owner hounds could run together','Run the owner check, review letters, and mark separation reviewed before drawing.','rollcall','Owner Separation','','owner same together course'],
['Entries changed after I printed the draw','Review roll call, rebuild, and reprint draw and judge sheets before scoring.','rollcall','Preliminary Draw','','stale changed reprint redraw'],
['A judge is missing from assignments','Add the judge to Judge Directory, then add that person to Trial Judges.','admin','Judge Directory','Judges & Workers','judge dropdown assign'],
['A worker has conflicting assignments','Open Running Order and adjust the duties shown by the conflict indicator.','runplan','Running Order & Assignments','','worker judge conflict overlap'],
['Scores are locked','Use the matching Unlock control only for a verified correction, then recheck and lock again.','scoring','Prelim Scoring','Prelim Scoring','score disabled unlock'],
['A tie or BOB course is missing','Finish finals scoring, then open Run Offs and draw the unresolved item.','scoring','Run Offs Scoring','Run Offs Scoring','tie runoff bob best breed'],
['A BIF or BIE hound is missing','Confirm the BOB result, then mark that winner as running before drawing. For a Grand Prix, enable breed pre-qualifiers before the first draw.','scoring','BIF / BIE','BIF / BIE','runner missing winner qualifier grand prix'],
['A PDF has old or unexpected information','Verify the active trial, refresh, and generate a new packet. Inspect every page.','wrapup','ASFA Record Packet','ASFA Record Packet','pdf print cached stale wrong dog packet'],
['Text does not align on a form','Preview it in Official Forms, make a small adjustment, and preview again.','admin','Official Forms','Paperwork','pdf alignment shifted margin'],
['I accidentally changed or deleted something','Use Undo for the latest action, or Recover Deleted Trials for one trial. Back up before a broad restore.','admin','Backup & Transfer','Tools','undo mistake deleted recover'],
['I need to move to another computer','Use Transfer Installer for a new computer. Use Program Update only when already installed.','admin','Backup & Transfer','Tools','move transfer laptop data'],
['The update is not showing','Open Updates & Versions while online, check again, and verify the installed version.','admin','Updates & Versions','Updates & Versions','update github release'],
['A finished trial is read-only','Archived trials are locked. Unlock only for a documented correction.','wrapup','Archive Trial','Archive Trial','archive edit locked'],
['I want to practice safely','Create an Admin Test Trial and use the score tools to practice the workflow.','admin','Admin Test Data','Tools','practice tutorial sample demo']
];
const P=problemRows.map(([title,answer,tab,section,page,keywords])=>({title,answer,tab,section,page,keywords}));
const norm=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
const heading=s=>s?.querySelector('.section-heading h2,.section-heading h3,h2,h3')||null;
function help(label){if(H[label])return H[label];if(/Secretary Report$/.test(label))return H['ASFA Secretary Report'];if(/Record Packet$/.test(label))return H['ASFA Record Packet'];if(/Submission Packet$/.test(label))return H['AKC Submission Packet'];return null}
function fill(section,panel){const x=help(heading(section)?.textContent.trim());if(!x)return false;panel.replaceChildren();const intro=document.createElement('p');intro.className='section-info-summary';intro.textContent=x.summary;const steps=document.createElement('section'),stepsTitle=document.createElement('h3'),stepsList=document.createElement('ol');stepsTitle.textContent='How to use it';(STEPS[heading(section)?.textContent.trim()]||STEPS['ASFA Secretary Report']).forEach(v=>{const li=document.createElement('li');li.textContent=v;stepsList.append(li)});steps.append(stepsTitle,stepsList);const tips=document.createElement('section'),tipsTitle=document.createElement('h3'),tipsList=document.createElement('ul');tipsTitle.textContent='Tips & hidden features';x.tips.forEach(v=>{const li=document.createElement('li');li.textContent=v;tipsList.append(li)});tips.append(tipsTitle,tipsList);const grid=document.createElement('div');grid.className='section-info-grid';grid.append(steps,tips);panel.append(intro,grid);return true}
function closeOthers(current){document.querySelectorAll('.section-info-panel:not([hidden])').forEach(p=>{if(p===current)return;p.hidden=true;document.querySelector('[aria-controls="'+p.id+'"]')?.setAttribute('aria-expanded','false')})}
function enhance(section,i){if(section.dataset.helpEnhanced==='true')return;const h=heading(section),box=h?.closest('.section-heading'),x=help(h?.textContent.trim());if(!h||!x||box?.classList.contains('compact-heading'))return;const b=document.createElement('button'),p=document.createElement('div');b.type='button';b.className='section-info-toggle no-print';b.textContent='ⓘ Info';b.setAttribute('aria-expanded','false');p.className='section-info-panel no-print';p.id='sectionInfo'+i;p.hidden=true;b.setAttribute('aria-controls',p.id);b.setAttribute('aria-label','About '+h.textContent.trim());b.addEventListener('click',()=>{const opening=p.hidden;if(opening){fill(section,p);closeOthers(p)}p.hidden=!opening;b.setAttribute('aria-expanded',String(opening))});if(box){const holder=h.parentElement!==box?h.parentElement:box;holder.append(b);box.insertAdjacentElement('afterend',p)}else{h.insertAdjacentElement('afterend',b);b.insertAdjacentElement('afterend',p)}section.dataset.helpEnhanced='true'}
function enhanceAll(){document.querySelectorAll('.form-section,.status-panel').forEach(enhance)}
function matches(section,wanted){const label=heading(section)?.textContent.trim()||'';if(norm(label)===norm(wanted))return true;if(wanted==='ASFA Record Packet'&&/Record Packet|Submission Packet/.test(label))return true;if(wanted==='ASFA Secretary Report'&&/Secretary Report/.test(label))return true;return false}
function activate(x){const wanted=x.page||x.section,buttons=[...document.querySelectorAll('#subTabs .sub-tab-button')];(buttons.find(y=>norm(y.textContent)===norm(wanted))||buttons.find(y=>norm(y.textContent)===norm(x.section)))?.click()}
function reveal(x){document.querySelector(`.tab-button[data-tab-target="${x.tab}"]`)?.click();requestAnimationFrame(()=>{activate(x);requestAnimationFrame(()=>{enhanceAll();const sections=[...document.querySelectorAll(`.form-section[data-tab="${x.tab}"]`)],target=sections.find(s=>matches(s,x.section)&&!s.hidden)||sections.find(s=>matches(s,x.section));if(!target)return;target.hidden=false;target.scrollIntoView({behavior:'smooth',block:'start'});target.classList.add('help-target-highlight');setTimeout(()=>target.classList.remove('help-target-highlight'),2800);const button=target.querySelector('.section-info-toggle');if(button?.getAttribute('aria-expanded')!=='true')button?.click()})})}
function searchable(x){const y=help(x.section);return norm([x.title,x.answer,x.keywords,x.section,y?.summary,...(y?.tips||[])].filter(Boolean).join(' '))}
function renderResults(box,query){const words=norm(query).split(' ').filter(Boolean),found=P.map((problem,order)=>({problem,order,score:words.reduce((n,w)=>n+(searchable(problem).includes(w)?1:0),0)})).filter(x=>!words.length||x.score>0).sort((a,b)=>b.score-a.score||a.order-b.order).slice(0,words.length?8:6);box.replaceChildren();if(!found.length){const p=document.createElement('p');p.className='help-search-empty';p.textContent='No close match. Try a shorter phrase such as “print”, “missing dog”, “scores”, “backup”, or “split stakes”.';box.append(p);return}found.forEach(({problem})=>{const card=document.createElement('article'),title=document.createElement('strong'),answer=document.createElement('p'),button=document.createElement('button');card.className='help-result';title.textContent=problem.title;answer.textContent=problem.answer;button.type='button';button.className='secondary small';button.textContent='Go to this area';button.addEventListener('click',()=>reveal(problem));card.append(title,answer,button);box.append(card)})}
function buildFinder(){const pop=document.querySelector('.trial-guide-popover');if(!pop||document.getElementById('helpFinder'))return;const details=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div'),label=document.createElement('label'),input=document.createElement('input'),hint=document.createElement('p'),box=document.createElement('div');details.className='help-finder no-print';details.id='helpFinder';summary.textContent='Find help, tips & hidden features';body.className='help-finder-body';label.htmlFor='helpSearchInput';label.textContent='What are you trying to do or fix?';input.id='helpSearchInput';input.type='search';input.placeholder='Example: split stakes or missing judge';input.autocomplete='off';hint.className='help-search-hint';hint.textContent='Search by a symptom, task, menu name, or feature.';box.className='help-results';input.addEventListener('input',()=>renderResults(box,input.value));details.addEventListener('toggle',()=>{if(details.open){renderResults(box,input.value);setTimeout(()=>input.focus(),0)}});label.append(input);body.append(label,hint,box);details.append(summary,body);pop.append(details)}
function init(){buildFinder();enhanceAll();const main=document.querySelector('main');if(main)new MutationObserver(enhanceAll).observe(main,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
