const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app/script.js', 'utf8');
const hound = id => ({entryId:id});
let trial = {id:'trial',preliminaryDraw:{groups:[
    {id:'tie',courses:[{hounds:[hound('a')]}],runoffs:[{courses:[{hounds:[{...hound('a'),tieBreakScore:'75'}]}]}]},
    {id:'unrelated',courses:[{hounds:[hound('b')]}]},
]}};
let request;
let message;
let fail = false;
const context = vm.createContext({
    readForm:()=>structuredClone(trial), upsertTrial:t=>{trial=t;}, saveTrials:()=>{},
    saveToSQLite:async()=>{}, isLocalServerMode:()=>true, rulesForTrial:()=>({association:'AKC'}),
    getAsfaRecordLayout:()=>({}),getAsfaEntryLayout:()=>({}),getAsfaLciEntryLayout:()=>({}),
    window:{open:()=>({location:'',close:()=>{}})},URL:{createObjectURL:()=> 'blob:test'},
    document:{getElementById:()=>({})},runoffMessage:{},
    clean:x=>String(x||'').toUpperCase(),markTrialGuidePrinted:()=>{},
    showMessage:(_,text,tone)=>{message={text,tone};},
    fetch:async(_,options)=>{request=JSON.parse(options.body);return {ok:!fail,json:async()=>({error:'PDF failed'}),blob:async()=>({})};},
});
vm.runInContext(source.slice(source.indexOf('function runoffRecordSheetSnapshots('),source.indexOf('async function printBieRecordSheets(')),context);
(async()=>{
    const drawBefore=JSON.stringify(trial.preliminaryDraw);
    await context.printUpdatedRunoffRecordSheets();
    assert.deepEqual(request.groupIds,['tie']);
    assert.equal(JSON.stringify(trial.preliminaryDraw),drawBefore,'printing preserves scoring and draws');
    assert.equal(context.updatedRunoffRecordGroupIds(trial).length,0);
    request=null;
    await context.printUpdatedRunoffRecordSheets();
    assert.equal(request,null,'unchanged sheets must not request another PDF');
    assert.match(message.text,/No updated/);
    trial.preliminaryDraw.groups[0].runoffs[0].courses[0].hounds[0].tieBreakScore='76';
    fail=true;
    await context.printUpdatedRunoffRecordSheets();
    assert.equal(context.updatedRunoffRecordGroupIds(trial).length,1,'failed PDF must remain pending');
    assert.match(message.text,/PDF failed/);
    fail=false;
    await context.printUpdatedRunoffRecordSheets();
    assert.equal(context.updatedRunoffRecordGroupIds(trial).length,0);
    console.log('Updated runoff sheets: selected groups only, successful-print tracking, unchanged omission, failure retry, and score/draw preservation passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
