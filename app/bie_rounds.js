function bieRoundCommit(trial, bif) {
    trial.scorebook = {...(trial.scorebook || {}), bif};
    upsertTrial(trial); saveTrials(); render();
}

async function startManualBie() {
    const trial = readForm(), bif = bifState(trial);
    if (bif.eventType !== 'BIE' || !await approveBifChange(trial)) return;
    const ids = [...selectedBifEntryIds(bif)];
    if (!ids.length) { showMessage(bifMessage, 'Mark the hounds Running BIE first.', 'warning'); return; }
    manualDrawEditKey = 'bif:draw';
    bieRoundCommit(trial, {...bif, outcomes:{}, tieRunoff:null, tieRunoffs:[], courseWinners:{}, finalWinner:'',
        draw:{id:crypto.randomUUID(), createdAt:new Date().toISOString(), manualDraft:true, courses:[{id:crypto.randomUUID(),number:1,hounds:[]}]}});
}

function assignBieDraftHound(entryId, courseId) {
    const trial=readForm(), bif=bifState(trial);
    if(trial.archivedAt || !bif.draw?.manualDraft) return;
    const candidate=bifCandidateHoundsForTrial(trial).find(c=>String(c.entryId)===entryId);
    const target=bif.draw.courses.find(c=>c.id===courseId);
    if(!candidate || !selectedBifEntryIds(bif).has(entryId) || !target) return;
    const already=target.hounds.some(h=>String(h.entryId)===entryId);
    if(!already && target.hounds.length>=bieCourseLimit(bif)) { showMessage(bifMessage,'That course is full. Add another course.', 'warning'); render(); return; }
    const courses=bif.draw.courses.map(c=>({...c,hounds:c.hounds.filter(h=>String(h.entryId)!==entryId)}));
    courses.find(c=>c.id===courseId).hounds.push({...candidate.hound,entryId,callName:candidate.name});
    bieRoundCommit(trial,{...bif,draw:normalizeBifDrawColors({...bif.draw,courses})});
}

function finishManualBie() {
    const trial=readForm(), bif=bifState(trial);
    if(trial.archivedAt || !bif.draw?.manualDraft) return;
    const assigned=bif.draw.courses.flatMap(c=>c.hounds.map(h=>String(h.entryId)));
    if([...selectedBifEntryIds(bif)].some(id=>!assigned.includes(id)) || !assigned.length) { showMessage(bifMessage,'Assign every running hound to a course before finishing.', 'warning'); return; }
    if(!bifJudgeSlots(bif).length) { showMessage(bifMessage,'Assign at least one judge before finishing.', 'warning'); return; }
    bieRoundCommit(trial,{...bif,draw:{...bif.draw,manualDraft:false,courses:bif.draw.courses.filter(c=>c.hounds.length)}});
}

function bieCourseWinner(bif, course) {
    const selected=(bif.courseWinners || {})[course.id];
    if (selected && course.hounds.some(h=>String(h.entryId)===selected)) return selected;
    if (course.hounds.length < 2) return ''; // Byes require a decision.
    const rows=course.hounds.map(h=>({id:String(h.entryId),o:(bif.outcomes || {})[String(h.entryId)] || {}}));
    if(rows.some(r=>!r.o.value && (r.o.score === '' || r.o.score == null || !Number.isFinite(Number(r.o.score))))) return '';
    const scored=rows.filter(r=>!r.o.value && r.o.score !== '' && r.o.score != null && Number.isFinite(Number(r.o.score)));
    if(!scored.length) return '';
    const top=Math.max(...scored.map(r=>Number(r.o.score)));
    const winners=scored.filter(r=>Number(r.o.score)===top);
    return winners.length===1 ? winners[0].id : '';
}

function bieWinningIds(bif) {
    return (bif.draw?.courses || []).filter(c=>c.hounds.length).map(c=>bieCourseWinner(bif,c));
}

function buildBiePreQualifierPlan(hounds) {
    const byBreed=new Map();
    hounds.forEach(hound=>{const breed=normalizeBreedCode(hound.breed);if(!byBreed.has(breed))byBreed.set(breed,[]);byBreed.get(breed).push(hound);});
    const carryEntryIds=[], contested=[];
    byBreed.forEach(group=>group.length>1 ? contested.push(...group) : carryEntryIds.push(String(group[0].entryId)));
    return {carryEntryIds,courses:buildBiePreQualifierCourses(contested)};
}

function buildBiePreQualifierCourses(hounds) {
    const byBreed=new Map();
    hounds.forEach(hound=>{const breed=normalizeBreedCode(hound.breed);if(!byBreed.has(breed))byBreed.set(breed,[]);byBreed.get(breed).push(hound);});
    const courses=[];
    byBreed.forEach((group,breed)=>{
        const shuffled=secureShuffle([...group]);
        const sizes=courseSizesForEntryCount(shuffled.length);
        sizes.forEach(size=>courses.push({id:crypto.randomUUID(),number:courses.length+1,qualifierBreed:breed,hounds:shuffled.splice(0,size)}));
    });
    return courses;
}

function bieCandidateHoundMap(trial) {
    return new Map(bifCandidateHoundsForTrial(trial).map(candidate=>[String(candidate.entryId),{...candidate.hound,entryId:String(candidate.entryId),callName:candidate.name,bobStake:candidate.stake}]));
}

function advanceBiePreQualifier(trial,bif) {
    const ids=bieWinningIds(bif);
    if(!ids.length || ids.some(id=>!id)) { showMessage(bifMessage,'Choose a winner for each pre-qualifier course before advancing.', 'warning'); return; }
    const saved=structuredClone({phase:'prequalifier',number:(bif.preQualifierHistory || []).length+1,draw:bif.draw,outcomes:bif.outcomes || {},courseWinners:bif.courseWinners || {},judges:bifJudgeSlots(bif).map(slot=>({key:slot.key,name:slot.name})),judge1:bif.judge1,judge2:bif.judge2,advancedEntryIds:ids,completedAt:new Date().toISOString()});
    const houndsById=bieCandidateHoundMap(trial), winnersByBreed=new Map();
    ids.forEach(id=>{const hound=houndsById.get(String(id));if(!hound)return;const breed=normalizeBreedCode(hound.breed);if(!winnersByBreed.has(breed))winnersByBreed.set(breed,[]);winnersByBreed.get(breed).push(hound);});
    const carry=[...(bif.preQualifierCarryEntryIds || []).map(String)], pending=[];
    winnersByBreed.forEach(group=>group.length>1 ? pending.push(...group) : carry.push(String(group[0].entryId)));
    const history=[...(bif.preQualifierHistory || []),saved];
    if(pending.length) {
        const courses=buildBiePreQualifierCourses(pending);
        bieRoundCommit(trial,{...bif,preQualifierHistory:history,preQualifierCarryEntryIds:[...new Set(carry)],biePhase:'prequalifier',
            outcomes:{},tieRunoff:null,tieRunoffs:[],courseWinners:{},finalWinner:'',
            draw:normalizeBifDrawColors({id:crypto.randomUUID(),createdAt:new Date().toISOString(),courses})});
        return;
    }
    const mainIds=[...new Set(carry)], mainHounds=mainIds.map(id=>houndsById.get(id)).filter(Boolean);
    const courses=buildBieCourses(mainHounds,{...bif,dogsPerCourse:3,sameBreedFirst:false});
    const statuses=Object.fromEntries((bif.bieCandidates || []).map(candidate=>[String(candidate.entryId),mainIds.includes(String(candidate.entryId))?'running':'not_running']));
    bieRoundCommit(trial,{...bif,preQualifierHistory:history,preQualifierCarryEntryIds:mainIds,biePhase:'main',dogsPerCourse:3,sameBreedFirst:false,
        selectedEntryIds:mainIds,statusByEntryId:statuses,outcomes:{},tieRunoff:null,tieRunoffs:[],courseWinners:{},finalWinner:'',
        draw:normalizeBifDrawColors({id:crypto.randomUUID(),createdAt:new Date().toISOString(),courses})});
}

function setBieCourseWinner(courseId, entryId) {
    const trial=readForm(), bif=bifState(trial);
    if(trial.archivedAt || bif.draw?.manualDraft || bif.finalWinner) return;
    const course=bif.draw?.courses.find(c=>c.id===courseId);
    if(!course || (entryId && !course.hounds.some(h=>String(h.entryId)===entryId))) return;
    bieRoundCommit(trial,{...bif,courseWinners:{...bif.courseWinners,[courseId]:entryId}});
}

function advanceBieRound(manual=false) {
    const trial=readForm(), bif=bifState(trial);
    if(trial.archivedAt || !bif.elimination || !bif.draw || bif.draw.manualDraft || bif.finalWinner) return;
    if(bif.biePhase==='prequalifier') { advanceBiePreQualifier(trial,bif); return; }
    const ids=bieWinningIds(bif);
    if(!ids.length || ids.some(id=>!id)) { showMessage(bifMessage,'Choose a winner for each course, including any bye.', 'warning'); return; }
    if(ids.length===1) {
        bieRoundCommit(trial,{...bif,finalWinner:ids[0]}); return;
    }
    const previous=structuredClone({number:(bif.roundHistory || []).length+1,draw:bif.draw,outcomes:bif.outcomes || {},courseWinners:bif.courseWinners || {},judges:bifJudgeSlots(bif).map(slot=>({key:slot.key,name:slot.name})),judge1:bif.judge1,judge2:bif.judge2,advancedEntryIds:ids,completedAt:new Date().toISOString()});
    const byId=new Map(bif.draw.courses.flatMap(c=>c.hounds).map(h=>[String(h.entryId),h]));
    // Three remaining winners can run the final together, matching 12 -> 6 -> 3.
    const limit=ids.length===3 ? 3 : bieCourseLimit(bif);
    const courses=manual ? [{id:crypto.randomUUID(),number:1,hounds:[]}] : buildBieCourses(ids.map(id=>({...byId.get(id),blanketColor:'',bifBlanketColor:'',bifCode:''})),{...bif,dogsPerCourse:limit,sameBreedFirst:false});
    manualDrawEditKey=manual?'bif:draw':'';
    bieRoundCommit(trial,{...bif,roundHistory:[...(bif.roundHistory || []),previous],dogsPerCourse:limit,sameBreedFirst:false,
        selectedEntryIds:ids,statusByEntryId:Object.fromEntries((bif.bieCandidates || []).map(c=>[String(c.entryId),ids.includes(String(c.entryId))?'running':'not_running'])),
        outcomes:{},tieRunoff:null,tieRunoffs:[],courseWinners:{},finalWinner:'',
        draw:normalizeBifDrawColors({id:crypto.randomUUID(),createdAt:new Date().toISOString(),manualDraft:manual,courses})});
}

function renderBieRoundControls(trial, placement = "setup") {
    const bif=bifState(trial), box=document.createElement('div'); box.className='bie-round-controls';
    const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='secondary small';b.textContent=label;b.disabled=Boolean(trial.archivedAt);b.addEventListener('click',fn);box.appendChild(b);};
    if (placement === 'setup') {
    const label=document.createElement('label'),mode=document.createElement('input');mode.type='checkbox';mode.checked=Boolean(bif.elimination);mode.disabled=Boolean(trial.archivedAt || bif.roundHistory?.length || bif.preQualifierHistory?.length);
    mode.addEventListener('change',()=>saveBieConfiguration({elimination:mode.checked,preQualifierEnabled:mode.checked ? Boolean(bif.preQualifierEnabled) : false,courseWinners:{},finalWinner:''}));label.append(mode,document.createTextNode(' Use elimination rounds (optional)'));box.appendChild(label);
    const qualifierLabel=document.createElement('label'),qualifier=document.createElement('input');qualifier.type='checkbox';qualifier.checked=Boolean(bif.preQualifierEnabled);qualifier.disabled=Boolean(trial.archivedAt || !bif.elimination || bif.draw || bif.roundHistory?.length || bif.preQualifierHistory?.length);
    qualifier.addEventListener('change',()=>saveBieConfiguration({preQualifierEnabled:qualifier.checked}));qualifierLabel.append(qualifier,document.createTextNode(' Run breed pre-qualifiers before the main BIE elimination'));box.appendChild(qualifierLabel);
    const qualifierNote=document.createElement('p');qualifierNote.className='field-note';qualifierNote.textContent='When enabled, breeds with two or more selected hounds run first. One representative per breed advances; uncontested breeds wait and automatically join those winners in the main three-dog elimination draw.';box.appendChild(qualifierNote);
    if(!bif.draw && !bif.preQualifierEnabled) button('Set Up BIE Manually',startManualBie);
    if(bif.draw?.manualDraft) {
        const note=document.createElement('p');note.textContent='Manual setup: assign each running hound to a course. Colors follow assignment order; you can adjust them after setup. Scores and printing become available when you finish.';box.appendChild(note);
        for(const candidate of bifCandidateHoundsForTrial(trial).filter(c=>selectedBifEntryIds(bif).has(String(c.entryId)))) {
            const row=document.createElement('label');row.textContent=candidate.name+' ';
            const select=document.createElement('select');select.add(new Option('Choose course',''));
            bif.draw.courses.forEach(c=>select.add(new Option(`Course ${c.number} (${c.hounds.length}/${bieCourseLimit(bif)})`,c.id)));
            select.value=bif.draw.courses.find(c=>c.hounds.some(h=>String(h.entryId)===String(candidate.entryId)))?.id || '';
            select.disabled=Boolean(trial.archivedAt);select.addEventListener('change',()=>assignBieDraftHound(String(candidate.entryId),select.value));row.appendChild(select);box.appendChild(row);
        }
        button('Finish Manual Setup',finishManualBie);
    }
    }
    if (placement === 'setup') return box;
    if(bif.elimination && bif.draw && !bif.draw.manualDraft) {
        const isQualifier=bif.biePhase==='prequalifier';
        const guidance=document.createElement('p');guidance.textContent=isQualifier ? 'Each course is a same-breed pre-qualifier. Clear highest scores select winners automatically; review ties and choose every course winner. Winners remain within their breed until one representative is left. Uncontested breeds are waiting for the main event.' : 'Clear highest scores select course winners automatically. Review them below; tied scores, incomplete courses and byes require your decision. Advance saves this round permanently. Next-round grouping starts mixed-breed; three remaining winners form one three-dog final. Choose manual setup to arrange the next round yourself.';box.appendChild(guidance);
        const title=document.createElement('h3');title.textContent=isQualifier ? `BIE pre-qualifier round ${(bif.preQualifierHistory || []).length+1}` : `Elimination round ${(bif.roundHistory || []).length+1}`;box.appendChild(title);
        for(const course of bif.draw.courses.filter(c=>c.hounds.length)) {
            const row=document.createElement('label');row.textContent=`Course ${course.number} winner / advance `;
            const select=document.createElement('select');select.add(new Option('Select winner (resolve ties first)',''));
            course.hounds.forEach(h=>{const o=(bif.outcomes || {})[String(h.entryId)] || {};select.add(new Option(`${h.callName || h.registeredName} — score ${o.score ?? ''}${o.value ? ' '+o.value : ''}`,String(h.entryId)));});
            select.value=bieCourseWinner(bif,course);select.disabled=Boolean(trial.archivedAt || bif.finalWinner);select.addEventListener('change',()=>setBieCourseWinner(course.id,select.value));row.appendChild(select);box.appendChild(row);
        }
        const pending=bieWinningIds(bif).filter(id=>!id).length;const readiness=document.createElement('p');readiness.textContent=pending ? `${pending} course(s) need a winner before advancing.` : 'All course winners are ready. Continue below.';box.appendChild(readiness);
        if(!bif.finalWinner) {button(isQualifier?'Advance Pre-Qualifier Winners':(bieWinningIds(bif).length===1?'Confirm BIE Winner':'Advance Winners — Draw Next Round'),()=>advanceBieRound(false));if(!isQualifier && bieWinningIds(bif).length>1)button('Advance Winners — Set Up Next Round Manually',()=>advanceBieRound(true));}
        else {const done=document.createElement('p');done.textContent='Event complete. The selected final-course winner is the BIE winner.';box.appendChild(done);button('Review Final Winner',()=>{const current=readForm();if(!current.archivedAt)bieRoundCommit(current,{...bifState(current),finalWinner:''});});}
    }
    for(const round of bif.preQualifierHistory || []) {
        const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`Pre-qualifier round ${round.number} — ${round.draw.courses.filter(c=>c.hounds.length).length} courses (saved)`;details.appendChild(summary);
        const roundJudges=(round.judges || [round.judge1,round.judge2].filter(Boolean).map((name,index)=>({key:`judge${index+1}`,name})));
        round.draw.courses.forEach(c=>c.hounds.forEach(h=>{const p=document.createElement('p'),o=(round.outcomes || {})[String(h.entryId)] || {};const scores=roundJudges.map((item,index)=>`J${index+1} ${o[item.key] ?? ''}`).join(' / ');p.textContent=`Course ${c.number} · ${h.bifBlanketColor || h.blanketColor || ''} · ${h.callName || h.registeredName} · ${scores} · Total ${o.score ?? ''} ${o.value || ''}${round.advancedEntryIds.includes(String(h.entryId))?' — Advanced':''}`;details.appendChild(p);}));box.appendChild(details);
    }
    for(const round of bif.roundHistory || []) {
        const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`Previous round ${round.number} — ${round.draw.courses.filter(c=>c.hounds.length).length} courses (saved)`;details.appendChild(summary);
        const roundJudges=(round.judges || [round.judge1,round.judge2].filter(Boolean).map((name,index)=>({key:`judge${index+1}`,name})));
        const judges=document.createElement('p');judges.textContent=`Judges: ${roundJudges.map(item=>item.name).filter(Boolean).join(', ')}`;details.appendChild(judges);
        round.draw.courses.forEach(c=>c.hounds.forEach(h=>{const p=document.createElement('p'),o=(round.outcomes || {})[String(h.entryId)] || {};const scores=roundJudges.map((item,index)=>`J${index+1} ${o[item.key] ?? ''}`).join(' / ');p.textContent=`Course ${c.number} · ${h.bifBlanketColor || h.blanketColor || ''} · ${h.callName || h.registeredName} · ${scores} · Total ${o.score ?? ''} ${o.value || ''}${round.advancedEntryIds.includes(String(h.entryId))?' — Advanced':''}`;details.appendChild(p);}));box.appendChild(details);
    }
    return box;
}
