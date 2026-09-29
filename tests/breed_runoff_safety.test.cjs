const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/script.js','utf8');
const block=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const context=vm.createContext({clean:v=>String(v||'').toUpperCase().replace(/[^A-Z0-9]+/g,'')});
for(const name of ['breedOptions','asfaJudgeSheetBreedCodes','asfaPremiumBreedAliases']){const start=source.indexOf('const '+name+' =');const end=source.indexOf(name==='breedOptions'?'];':'};',start)+2;vm.runInContext(source.slice(start,end),context);}
vm.runInContext(block('function normalizeBreedCode(','function normalizeImportedBreed(')+block('function breedDisplayCode(','function displayBreedCode('),context);
for(const alias of ['DH','SD','sd','Deerhound','Scottish Deerhound','Scottish Deerhounds']){assert.equal(context.normalizeBreedCode(alias),'DH');assert.equal(context.breedDisplayCode(alias),'SD');}
for(const [alias,code] of [['A','AH'],['B','BZ'],['G','GH'],['P','PH'],['S','SA'],['W','WH'],['PP','PPP'],['N','NBS'],["Cirneco dell’Etna",'CE']])assert.equal(context.normalizeBreedCode(alias),code);
for(const alias of ['Ibizan Hound','Ibizan Hounds','Ibizan Hound (IB)','IB - Ibizan Hound'])assert.equal(context.normalizeBreedCode(alias),'IB');
assert.equal(context.normalizeBreedCode('Custom breed'),'Custom breed');
vm.runInContext('for (const [code,name] of breedOptions.filter(([c])=>c && c!=="OTHER")) { if (normalizeBreedCode(name)!==code || normalizeBreedCode(breedDisplayCode(code))!==code) throw Error(name); }',context);
vm.runInContext('for (const [code,name] of breedOptions.filter(([c])=>c && c!=="OTHER")) { if (normalizeBreedCode(name+"s")!==code || normalizeBreedCode(name+" ("+code+")")!==code) throw Error(name); }',context);
Object.assign(context,{lciDivisions:[],lciStakes:[]});
vm.runInContext(block('function normalizeImportedLciParts(','function matchImportedHound(')+block('function normalizeLciHoundShape(','function runGroupBreedForEntry('),context);
assert.deepEqual({...context.normalizeLciHoundShape({id:'existing',breed:'Ibizan Hounds'})},{id:'existing',breed:'IB'});
let trial,items,prompts=0,writes=0,draws=0,accept=false,changeDuringPrompt=false;
Object.assign(context,{runoffMessage:{},showMessage:()=>{},readForm:()=>structuredClone(trial),collectRunoffItems:()=>items,drawnRunoffForItem:(t,i)=>(t.preliminaryDraw.groups.find(g=>g.id===i.groupId)?.runoffs||[]).find(r=>r.key===i.tie.key),showTrialConfirm:async options=>{prompts++;assert.equal(options.focusSecondary,true);assert.match(options.message,/posted/);if(changeDuringPrompt)trial.entries.push({id:'changed'});return accept;},createRunoffDrawFromRows:(rows,tie)=>({key:tie.key,id:'new'+(++draws),courses:[{hounds:[{entryId:'a',tieBreakBlanketColor:'YELLOW'}]}]}),createBobRunoffDraw:()=>null,runoffKeyForTie:tie=>tie.key,upsertTrial:t=>{trial=structuredClone(t);writes++;},saveTrials:()=>{},render:()=>{}});
vm.runInContext(block('function runoffItemAlreadyDrawn(','async function drawSingleRunoff('),context);
const reset=existing=>{trial={id:'trial',entries:[],preliminaryDraw:{groups:[{id:'g',runoffs:existing?[{key:'tie',id:'posted',courses:[{hounds:[{entryId:'a',tieBreakBlanketColor:'PINK',tieBreakScore:'80'}]}]}]:[]}]},bobRunoffs:[],runoffOrder:[]};items=[{id:'tie-item',type:'tie',groupId:'g',breed:'DH',tie:{key:'tie',rows:[]}}];prompts=writes=draws=0;accept=changeDuringPrompt=false;};
(async()=>{reset(false);await context.redrawAllRunoffs();assert.equal(prompts,0);assert.equal(draws,1);assert.equal(writes,1);
reset(true);let before=JSON.stringify(trial);await context.redrawAllRunoffs();assert.equal(prompts,1);assert.equal(draws,0);assert.equal(JSON.stringify(trial),before);
reset(true);assert.equal(context.drawRunoffsForBreed('SD'),0);assert.equal(draws,0);assert.equal(writes,0);
reset(true);accept=true;await context.redrawAllRunoffs();assert.equal(draws,1);assert.equal(writes,1);
reset(true);accept=true;changeDuringPrompt=true;await context.redrawAllRunoffs();assert.equal(writes,0);assert.equal(draws,0);assert.equal(trial.entries.length,1);
reset(false);trial.archivedAt='today';await context.redrawAllRunoffs();assert.equal(draws,0);
console.log('Breed alias round trips and runoff first-draw, cancel, confirm, stale-state, archived, and automatic-preservation checks passed.');})().catch(e=>{console.error(e);process.exitCode=1});