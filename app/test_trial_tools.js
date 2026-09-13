/* Test-trial helpers never modify master hound records. */
function populateTestSpecialties(source, options) {
    let entries=source.map(e=>({...e}));
    for(const kind of ['Kennel','Breeder']) {
        if(!options[kind]) continue;
        const byBreed=new Map();
        entries.forEach(e=>{const breed=normalizeBreedCode(e.breed);if(!byBreed.has(breed))byBreed.set(breed,[]);byBreed.get(breed).push(e.id);});
        let pair=0;
        for(const ids of byBreed.values()) {
            const remaining=[...ids];
            while(remaining.length>1) {
                const id=remaining.shift();
                let matched=false;
                for(let i=0;i<remaining.length;i++) {
                    const partner=remaining[i],name=`Test ${kind} ${pair+1}`;
                    const flagged=entries.map(e=>e.id===id || e.id===partner ? {...e,['additional'+kind]:true,['specialty'+kind+'Name']:name} : e);
                    try {entries=specialtyPairEntries(flagged,kind,id,partner);remaining.splice(i,1);pair++;matched=true;break;} catch { /* Try a distinct hound. */ }
                }
            }
        }
    }
    if(options.Bench) entries=entries.map((e,i)=>({...e,additionalBench:i%2===0 || Boolean(e.additionalBench)}));
    return entries;
}

function populateAdminBifScores() {
    const trial=readForm();
    if(!trial?.testTrial || trial.archivedAt) {showMessage(adminTestMessage,'Score population requires an editable Test Trial.', 'warning');return;}
    const bif=bifState(trial);
    if(!bif.draw || bif.draw.manualDraft) {showMessage(adminTestMessage,'Draw BIF/BIE or finish manual setup before populating scores.', 'warning');return;}
    const judgeSlots=Array.from({length:bif.eventType==='BIE'?6:2},(_,index)=>({key:'judge'+(index+1),name:bif['judge'+(index+1)]})).filter(slot=>slot.name);
    if(!judgeSlots.length) {showMessage(adminTestMessage,'Assign a BIF/BIE judge first.', 'warning');return;}
    const tie=currentBifTieRunoff(bif);
    const isTie=!bif.elimination && Boolean(tie.draw);
    const draw=isTie ? tie.draw : bif.draw;
    let count=0;
    for(const course of draw.courses || []) {
        (course.hounds || []).forEach((hound,index)=>{
            const score=Math.max(1,Math.min(95,Number(rulesForTrial(trial).judgeScoreMaximum || 100)-5)-(bif.elimination ? index : count));
            const changes=Object.fromEntries(judgeSlots.map((slot,judgeIndex)=>[slot.key,String(Math.max(1,score-judgeIndex))]));
            if(isTie) updateBifTieScore(String(hound.entryId),changes);
            else updateBifScore(String(hound.entryId),changes);
            count++;
        });
    }
    saveTrials();render();
    showMessage(adminTestMessage,`Populated ${count} ${bif.eventType==='BIE'?'BIE':'BIF'}${isTie?' tie-runoff':''} scores. Existing courses and earlier elimination rounds were preserved.`, 'success');
    showMessage(bifMessage,`Populated ${count} test scores.${bif.elimination?' Review the course winners below and advance when ready.':''}`, 'success');
}
