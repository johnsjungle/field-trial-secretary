const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({crypto:require('node:crypto').webcrypto,secureShuffle:x=>[...x].reverse(),normalizeBreedCode:x=>x==='SD'?'DH':x,courseSizesForEntryCount:n=>n===4?[2,2]:[n]});
vm.runInContext(fs.readFileSync('app/bie.js','utf8'),ctx);
const dogs=Array.from({length:7},(_,i)=>({entryId:String(i),breed:i<3?(i===0?'SD':'DH'):'WH'}));
for(const limit of [1,2,3]) for(const sameBreedFirst of [true,false]){
 const before=JSON.stringify(dogs);const courses=ctx.buildBieCourses(dogs,{dogsPerCourse:limit,sameBreedFirst});
 assert(courses.every(c=>c.hounds.length<=limit && c.hounds.length>0));
 assert.equal(new Set(courses.flatMap(c=>c.hounds.map(h=>h.entryId))).size,7);
 if(sameBreedFirst)assert(courses.every(c=>new Set(c.hounds.map(h=>ctx.normalizeBreedCode(h.breed))).size===1));
 assert.equal(JSON.stringify(dogs),before);
 assert.deepEqual(Array.from(courses,c=>c.number),Array.from({length:courses.length},(_,i)=>i+1));
}
let trial={id:'active',scorebook:{bif:{eventType:'BIE',dogsPerCourse:2,draw:{courses:[{id:'old',number:1,hounds:[{entryId:'a',bifBlanketColor:'YELLOW'},{entryId:'b',bifBlanketColor:'PINK'}]}]},outcomes:{a:{score:80}}}}};
let writes=0,confirm=false,prompts=0;
Object.assign(ctx,{bifState:t=>t.scorebook.bif,readForm:()=>structuredClone(trial),upsertTrial:t=>{trial=t;writes++},saveTrials:()=>{},render:()=>{},showMessage:()=>{},bifMessage:{},manualDrawEditKey:'',auditDrawChange:d=>d,showTrialConfirm:async()=>{prompts++;return confirm},moveHoundWithinDraw:(draw,id,target)=>({draw:{...draw,courses:draw.courses.map(c=>({...c,hounds:c.id===target?[...c.hounds,{entryId:id}]:c.hounds.filter(h=>h.entryId!==id)}))},description:'moved'})});
const s=fs.readFileSync('app/script.js','utf8');vm.runInContext(s.slice(s.indexOf('async function moveManualBifDrawHound'),s.indexOf('function updateManualBifDrawBlanket')),ctx);
(async()=>{const original=JSON.stringify(trial.scorebook.bif.draw.courses[0]);await ctx.addEmptyBieCourse();assert.equal(trial.scorebook.bif.draw.courses.length,2);assert.equal(JSON.stringify(trial.scorebook.bif.draw.courses[0]),original);assert.equal(trial.scorebook.bif.outcomes.a.score,80);assert.equal(prompts,0);
const target=trial.scorebook.bif.draw.courses[1].id;const before=JSON.stringify(trial);await ctx.moveManualBifDrawHound('a',target);assert.equal(JSON.stringify(trial),before);assert.equal(prompts,1);
confirm=true;await ctx.moveManualBifDrawHound('a',target);assert.equal(trial.scorebook.bif.draw.courses[1].hounds.length,1);assert.equal(Object.keys(trial.scorebook.bif.outcomes).length,0);
trial.scorebook.bif.draw.courses[1].hounds.push({entryId:'c'});const full=JSON.stringify(trial);await ctx.moveManualBifDrawHound('b',target);assert.equal(JSON.stringify(trial),full);
trial.archivedAt='today';const saved=writes;await ctx.addEmptyBieCourse();assert.equal(writes,saved);
console.log('BIE course tests passed: limits, breed aliases, odd counts, uniqueness, no input mutation, empty-course preservation, cancel, confirmed move, full-course rejection, archived guard.');})().catch(e=>{console.error(e);process.exitCode=1});
