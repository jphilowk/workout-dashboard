'use strict';
const $=id=>document.getElementById(id);
let stored=null,entries=[],selectedPoint=null;
const dateLabel=date=>new Date(date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
const shortDate=date=>new Date(date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'});
const number=n=>Number(n.toFixed(1)).toLocaleString();
function options(select,items,preferred){select.replaceChildren();items.forEach(([id,name])=>{const o=document.createElement('option');o.value=id;o.textContent=name;select.append(o);});select.value=items.some(([id])=>id===preferred)?preferred:items[0]?.[0]||'';}
function refresh(){
  try{stored=ProgressData.read();$('progress-error').textContent='';}catch{$('progress-error').textContent='Your saved history could not be read. Restore a backup from the Workouts page.';$('progress-content').hidden=true;$('progress-empty').hidden=true;return;}
  const sessions=stored?.sessions||[];
  $('progress-empty').hidden=sessions.length>0;$('progress-content').hidden=!sessions.length;if(!sessions.length)return;
  const workouts=new Map();sessions.forEach(s=>workouts.set(s.workoutId,s.workoutName));
  stored.workouts.forEach(w=>{if(workouts.has(w.id))workouts.set(w.id,w.name);});
  options($('filter-workout'),[...workouts],$('filter-workout').value);
  exerciseOptions();
}
function exerciseOptions(){
  const wid=$('filter-workout').value,exercises=new Map();
  (stored.sessions||[]).filter(s=>s.workoutId===wid).forEach(s=>s.exercises.forEach(e=>exercises.set(e.id,e.name)));
  stored.workouts.find(w=>w.id===wid)?.exercises.forEach(e=>{if(exercises.has(e.id))exercises.set(e.id,e.name);});
  options($('filter-exercise'),[...exercises],$('filter-exercise').value);
  chooseExercise();
}
function chooseExercise(){
  const wid=$('filter-workout').value,eid=$('filter-exercise').value;
  entries=(stored.sessions||[]).filter(s=>s.workoutId===wid).map(s=>({s,e:s.exercises.find(e=>e.id===eid)})).filter(p=>p.e).sort((a,b)=>a.s.date.localeCompare(b.s.date)||a.s.createdAt.localeCompare(b.s.createdAt));
  if(entries.length&&entries.every(p=>p.e.unit==='bodyweight'))$('filter-metric').value='reps';
  const last=entries.filter(p=>p.e.unit!=='bodyweight').at(-1);if(last)$('filter-unit').value=last.e.unit;
  selectedPoint=null;draw();
}
function svgNode(name,attrs,text){const el=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));if(text!==undefined)el.textContent=text;return el;}
function draw(){
  const metric=$('filter-metric').value,unit=$('filter-unit').value,label=metric==='weight'?unit:metric==='reps'?'total reps':'sets';
  $('unit-label').hidden=metric!=='weight';
  $('chart-title').textContent=$('filter-exercise').selectedOptions[0]?.textContent||'Exercise';
  const points=entries.map(p=>({...p,value:ProgressData.value(p.e,metric,unit)})).filter(p=>p.value!==null);
  $('chart').replaceChildren();$('chart-empty').hidden=points.length>0;
  $('point-value').textContent='';$('point-detail').textContent='';
  $('chart-note').textContent=metric==='reps'?'Total reps adds together every set.':metric==='sets'?'Sets completed in each session.':'Recorded weight, converted to your selected unit. For assisted exercises, this is assistance weight; less assistance can mean progress.';
  if(points.length){
    const svg=svgNode('svg',{viewBox:'0 0 480 250',role:'group','aria-label':`${$('chart-title').textContent}: ${label} over time`});
    const max=Math.max(...points.map(p=>p.value)),top=max===0?1:max*1.15;
    const first=Date.parse(points[0].s.date),last=Date.parse(points.at(-1).s.date);
    const x=p=>last===first?264:58+(Date.parse(p.s.date)-first)/(last-first)*412;
    const y=p=>205-p.value/top*175;
    for(let i=0;i<=4;i++){
      const v=top*i/4,yy=205-i*175/4;
      svg.append(svgNode('line',{x1:58,x2:470,y1:yy,y2:yy,stroke:'#e4eaf0'}),svgNode('text',{x:48,y:yy+4,'text-anchor':'end'},number(v)));
    }
    svg.append(svgNode('text',{x:58,y:237},shortDate(points[0].s.date)));
    if(last!==first)svg.append(svgNode('text',{x:470,y:237,'text-anchor':'end'},shortDate(points.at(-1).s.date)));
    if(points.length>1)svg.append(svgNode('polyline',{points:points.map(p=>`${x(p)},${y(p)}`).join(' '),fill:'none',stroke:'#235e99','stroke-width':2.5}));
    const selected=points.find(p=>p.s.id===selectedPoint)||points.at(-1);selectedPoint=selected.s.id;
    const show=p=>{
      selectedPoint=p.s.id;$('point-value').textContent=`${number(p.value)} ${label}`;
      $('point-detail').textContent=`${dateLabel(p.s.date)} · ${p.e.sets} sets · ${p.e.unit==='bodyweight'?'Bodyweight':p.e.weight+' '+p.e.unit} · ${p.e.reps} reps`;
      svg.querySelectorAll('.point').forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.session===p.s.id)));
    };
    points.forEach(p=>{
      const dot=svgNode('circle',{cx:x(p),cy:y(p),r:7,class:'point',tabindex:0,role:'button','aria-label':`${dateLabel(p.s.date)}, ${number(p.value)} ${label}`,'data-session':p.s.id});
      dot.onclick=()=>show(p);dot.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(p);}};svg.append(dot);
    });$('chart').append(svg);show(selected);
    if(points.length===1)$('chart-note').textContent+=' Your next session will start the trend line.';
  }
  $('session-history').replaceChildren();[...entries].reverse().forEach(({s,e})=>{
    const row=document.createElement('div');row.className='session';const info=document.createElement('div'),date=document.createElement('strong'),details=document.createElement('p');date.textContent=dateLabel(s.date);details.className='hint';details.textContent=`${e.sets} sets · ${e.unit==='bodyweight'?'Bodyweight':e.weight+' '+e.unit} · ${e.reps} reps`;info.append(date,details);
    const remove=document.createElement('button');remove.className='quiet danger';remove.textContent='Remove';remove.setAttribute('aria-label',`Remove ${s.workoutName} session from ${dateLabel(s.date)}`);remove.onclick=()=>{
      if(!confirm(`Remove the whole ${s.workoutName} session from ${dateLabel(s.date)}? This removes all ${s.exercises.length} exercises logged in that session.`))return;
      try{const latest=ProgressData.read();if(!latest)throw Error();latest.sessions=(latest.sessions||[]).filter(item=>item.id!==s.id);localStorage.setItem(ProgressData.key,JSON.stringify(latest));refresh();}catch{$('progress-error').textContent='Could not remove this session. Your saved history has not been changed.';}
    };row.append(info,remove);$('session-history').append(row);
  });
}
$('filter-workout').onchange=exerciseOptions;$('filter-exercise').onchange=chooseExercise;
$('filter-metric').onchange=()=>{selectedPoint=null;draw();};$('filter-unit').onchange=draw;
window.addEventListener('storage',e=>{if(e.key===ProgressData.key||e.key===null)refresh();});window.addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});refresh();
