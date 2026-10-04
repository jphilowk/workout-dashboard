'use strict';
let sessionWorkout,sessionRows=[];
$('log-workout').onclick=()=>{
  if(blocked){$('log-status').textContent='Restore your saved data before logging a session.';return;}
  sessionWorkout=JSON.parse(JSON.stringify(current()));
  if(!sessionWorkout.exercises.length){$('log-status').textContent='Add an exercise before logging this workout.';return;}
  $('session-date').value=ProgressData.today();$('session-date').max=ProgressData.today();$('session-error').textContent='';$('session-exercises').replaceChildren();sessionRows=[];
  sessionWorkout.exercises.forEach(e=>{
    const field=document.createElement('fieldset');field.className='log-row';
    const legend=document.createElement('legend');legend.textContent=e.name;field.append(legend);
    const includeLabel=document.createElement('label');includeLabel.className='include';const include=document.createElement('input');include.type='checkbox';include.checked=true;includeLabel.append(include,document.createTextNode('Completed'));field.append(includeLabel);
    const fields=document.createElement('div');fields.className='fields';const inputs={};
    for(const [name,title] of [['sets','Sets'],['reps','Reps'],['weight','Weight'],['unit','Unit']]){
      const label=document.createElement('label');label.textContent=title;
      const input=document.createElement(name==='unit'?'select':'input');
      if(name==='unit'){for(const u of ['lb','kg','bodyweight']){const o=document.createElement('option');o.value=u;o.textContent=u==='bodyweight'?'Bodyweight':u;input.append(o);}}
      else if(name==='sets'||name==='weight'){input.type='number';input.min=name==='sets'?'1':'0';input.max=name==='sets'?'100':'10000';input.step=name==='sets'?'1':'any';input.inputMode=name==='sets'?'numeric':'decimal';}
      else{input.type='text';input.maxLength=60;}
      input.value=e[name];input.required=true;label.append(input);fields.append(label);inputs[name]=input;
    }
    const toggle=()=>{Object.entries(inputs).forEach(([name,input])=>input.disabled=!include.checked||(name==='weight'&&inputs.unit.value==='bodyweight'));fields.classList.toggle('inactive',!include.checked);};
    include.onchange=toggle;inputs.unit.onchange=toggle;toggle();field.append(fields);$('session-exercises').append(field);sessionRows.push({e,include,inputs});
  });$('log-dialog').showModal();
};
$('cancel-log').onclick=()=>$('log-dialog').close();
$('log-form').onsubmit=event=>{
  event.preventDefault();$('session-error').textContent='';
  const exercises=sessionRows.filter(r=>r.include.checked).map(({e,inputs:i})=>({...e,sets:Number(i.sets.value),reps:i.reps.value.trim(),weight:i.unit.value==='bodyweight'?0:Number(i.weight.value),unit:i.unit.value}));
  if(!exercises.length){$('session-error').textContent='Select at least one completed exercise.';return;}
  const bad=exercises.find(e=>!ProgressData.exercise(e)||ProgressData.reps(e)===null);
  if(bad){$('session-error').textContent=`${bad.name}: enter reps per set (like 12), or one number for every set (like 7, 4 for 2 sets).`;return;}
  const date=$('session-date').value;
  if(!ProgressData.date(date)||date>ProgressData.today()){$('session-error').textContent='Choose today or a past date.';return;}
  try{
    const latest=ProgressData.read();if(!latest)throw Error();
    const session={id:uid(),date,createdAt:new Date().toISOString(),workoutId:sessionWorkout.id,workoutName:sessionWorkout.name,exercises};
    latest.sessions=[...(latest.sessions||[]),session];
    if(!ProgressData.sessions(latest.sessions))throw Error();
    localStorage.setItem(KEY,JSON.stringify(latest));data=latest;render();$('log-dialog').close();$('log-status').textContent='Session saved. Your Progress page is updated.';$('save-status').textContent='Saved on this device';
  }catch{$('session-error').textContent='Session was not saved. Your storage may be full or unavailable. Save a backup and try again.';}
};
