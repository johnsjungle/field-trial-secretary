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
    if(!bif.judge1 && !bif.judge2) { showMessage(bifMessage,'Assign at least one judge before finishing.', 'warning'); return; }
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
    const ids=bieWinningIds(bif);
    if(!ids.length || ids.some(id=>!id)) { showMessage(bifMessage,'Choose a winner for each course, including any bye.', 'warning'); return; }
    if(ids.length===1) {
        bieRoundCommit(trial,{...bif,finalWinner:ids[0]}); return;
    }
    const previous=structuredClone({number:(bif.roundHistory || []).length+1,draw:bif.draw,outcomes:bif.outcomes || {},courseWinners:bif.courseWinners || {},judge1:bif.judge1,judge2:bif.judge2,advancedEntryIds:ids,completedAt:new Date().toISOString()});
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
    const label=document.createElement('label'),mode=document.createElement('input');mode.type='checkbox';mode.checked=Boolean(bif.elimination);mode.disabled=Boolean(trial.archivedAt || bif.roundHistory?.length);
    mode.addEventListener('change',()=>saveBieConfiguration({elimination:mode.checked,courseWinners:{},finalWinner:''}));label.append(mode,document.createTextNode(' Use elimination rounds (optional)'));box.appendChild(label);
    if(!bif.draw) button('Set Up BIE Manually',startManualBie);
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
        const guidance=document.createElement('p');guidance.textContent='Clear highest scores select course winners automatically. Review them below; tied scores, incomplete courses and byes require your decision. Advance saves this round permanently. Next-round grouping starts mixed-breed; three remaining winners form one three-dog final. Choose manual setup to arrange the next round yourself.';box.appendChild(guidance);
        const title=document.createElement('h3');title.textContent=`Elimination round ${(bif.roundHistory || []).length+1}`;box.appendChild(title);
        for(const course of bif.draw.courses.filter(c=>c.hounds.length)) {
            const row=document.createElement('label');row.textContent=`Course ${course.number} winner / advance `;
            const select=document.createElement('select');select.add(new Option('Select winner (resolve ties first)',''));
            course.hounds.forEach(h=>{const o=(bif.outcomes || {})[String(h.entryId)] || {};select.add(new Option(`${h.callName || h.registeredName} — score ${o.score ?? ''}${o.value ? ' '+o.value : ''}`,String(h.entryId)));});
            select.value=bieCourseWinner(bif,course);select.disabled=Boolean(trial.archivedAt || bif.finalWinner);select.addEventListener('change',()=>setBieCourseWinner(course.id,select.value));row.appendChild(select);box.appendChild(row);
        }
        const pending=bieWinningIds(bif).filter(id=>!id).length;const readiness=document.createElement('p');readiness.textContent=pending ? `${pending} course(s) need a winner before advancing.` : 'All course winners are ready. Continue below.';box.appendChild(readiness);
        if(!bif.finalWinner) {button(bieWinningIds(bif).length===1?'Confirm BIE Winner':'Advance Winners — Draw Next Round',()=>advanceBieRound(false));if(bieWinningIds(bif).length>1)button('Advance Winners — Set Up Next Round Manually',()=>advanceBieRound(true));}
        else {const done=document.createElement('p');done.textContent='Event complete. The selected final-course winner is the BIE winner.';box.appendChild(done);button('Review Final Winner',()=>{const current=readForm();if(!current.archivedAt)bieRoundCommit(current,{...bifState(current),finalWinner:''});});}
    }
    for(const round of bif.roundHistory || []) {
        const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`Previous round ${round.number} — ${round.draw.courses.filter(c=>c.hounds.length).length} courses (saved)`;details.appendChild(summary);
        const judges=document.createElement('p');judges.textContent=`Judges: ${[round.judge1,round.judge2].filter(Boolean).join(', ')}`;details.appendChild(judges);
        round.draw.courses.forEach(c=>c.hounds.forEach(h=>{const p=document.createElement('p'),o=(round.outcomes || {})[String(h.entryId)] || {};p.textContent=`Course ${c.number} · ${h.bifBlanketColor || h.blanketColor || ''} · ${h.callName || h.registeredName} · J1 ${o.judge1 ?? ''} / J2 ${o.judge2 ?? ''} · Total ${o.score ?? ''} ${o.value || ''}${round.advancedEntryIds.includes(String(h.entryId))?' — Advanced':''}`;details.appendChild(p);}));box.appendChild(details);
    }
    return box;
}
