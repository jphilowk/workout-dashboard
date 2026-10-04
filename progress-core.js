'use strict';
const ProgressData = (() => {
  const key = 'my-workouts-v1';
  const text = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
  function reps(e) {
    if (!/^\d+(\s*,\s*\d+)*$/.test(e.reps.trim())) return null;
    const values = e.reps.split(',').map(Number);
    if (values.some(n => n > 10000) || (values.length !== 1 && values.length !== e.sets)) return null;
    return values.length === 1 ? values[0] * e.sets : values.reduce((a,b) => a+b,0);
  }
  function exercise(e) {
    return e && text(e.id,200) && text(e.name,180) && Number.isInteger(e.sets) && e.sets>0 && e.sets<=100 && Number.isFinite(e.weight) && e.weight>=0 && e.weight<=10000 && ['lb','kg','bodyweight'].includes(e.unit) && text(e.reps,60);
  }
  function date(s) { return typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s; }
  function sessions(list) {
    return Array.isArray(list) && list.length<=10000 && new Set(list.map(s=>s?.id)).size===list.length && list.every(s=>s && text(s.id,200) && date(s.date) && Number.isFinite(Date.parse(s.createdAt)) && text(s.workoutId,200) && text(s.workoutName,60) && Array.isArray(s.exercises) && s.exercises.length>0 && s.exercises.length<=300 && new Set(s.exercises.map(e=>e?.id)).size===s.exercises.length && s.exercises.every(e=>exercise(e)&&reps(e)!==null));
  }
  function read() {
    const raw=localStorage.getItem(key);
    if(!raw)return null;
    const d=JSON.parse(raw);
    if(d.version!==1||!Array.isArray(d.workouts)||!d.workouts.length||!d.workouts.every(w=>w&&text(w.id,200)&&text(w.name,60)&&Array.isArray(w.exercises)&&w.exercises.every(exercise))||(d.sessions!==undefined&&!sessions(d.sessions)))throw Error('Saved data could not be read.');
    return d;
  }
  function value(e,metric,unit='lb') {
    if(metric==='sets')return e.sets;
    if(metric==='reps')return reps(e);
    if(e.unit==='bodyweight')return null;
    return e.weight*(e.unit===unit?1:e.unit==='kg'?2.2046226218:1/2.2046226218);
  }
  function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  return {key,reps,exercise,date,sessions,read,value,today};
})();
if(typeof module!=='undefined')module.exports=ProgressData;
