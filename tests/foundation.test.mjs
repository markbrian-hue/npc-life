import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWorld, blocked, SPAWN, ROAD_SEGMENTS, roadBounds, inBox, ROAD_SEGMENTS as roads, ACTIVITY_SITES } from '../shared/world.mjs';
import { walkingRoute } from './pathing.mjs';
import { createFleet, stepTraffic, trafficPose, TRAFFIC_LENGTH, carBlocked } from '../shared/vehicles.mjs';
import { freshLife, validateLife, JOBS, canStart, startShift, advanceShift, shiftReward, lifeAchievements } from '../shared/residentLife.mjs';

test('planned buildings, canopies, arrival and activity sites pass placement rules',()=>{assert.deepEqual(validateWorld(),[]);assert.ok(roads.length>=9);for(const site of ACTIVITY_SITES)assert.ok(walkingRoute(SPAWN,site).length);});
test('every new job stop is reachable without walking through road furniture',()=>{for(const job of JOBS)for(const stop of job.stops){assert.equal(blocked(stop.x,stop.z),false,`${job.id}: ${stop.action}`);assert.ok(walkingRoute(SPAWN,stop).length);}});
test('traffic circuit stays on roads with clear hulls and travels continuously',()=>{
  const fleet=createFleet();for(let d=0;d<TRAFFIC_LENGTH;d+=1){const pose=trafficPose(d);assert.ok(ROAD_SEGMENTS.some(r=>inBox(pose.x,pose.z,roadBounds(r),.1)));assert.equal(carBlocked({...fleet[6],...pose},[]),false);}
  const car=fleet[6],before=car.distance;for(let i=0;i<120;i++)stepTraffic(car,1/60,fleet);assert.ok(car.distance>before+3);
  const look=trafficPose(car.distance+4);stepTraffic(car,.1,fleet,[look]);assert.equal(car.speed,0,'traffic yields to a pedestrian');
});
test('job state enforces access, stage order, proximity, stopped taxi and timeout',()=>{
  const s=freshLife();assert.equal(startShift('taxi',100,s,1000),null);assert.equal(canStart(JOBS[3],40,{...s,upgrades:['club']}),true);
  let a=startShift('milk',0,s,1000);assert.equal(advanceShift(a,{x:6,z:22},{now:1500}).status,'far');
  let next=advanceShift(a,JOBS[0].stops[0],{now:1500});assert.equal(next.status,'advanced');
  next=advanceShift(next.active,JOBS[0].stops[1],{now:2000});assert.equal(next.status,'complete');assert.equal(advanceShift(next.active,JOBS[0].stops[1]).status,'idle');
  const taxi=startShift('taxi',50,{...s,upgrades:['club']},0),p=JOBS[3].stops[0];
  assert.equal(advanceShift(taxi,p,{now:1000}).status,'stop-car');assert.equal(advanceShift(taxi,p,{driving:true,speed:4,now:1000}).status,'stop-car');assert.equal(advanceShift(taxi,p,{driving:true,speed:0,now:1000}).status,'advanced');assert.equal(advanceShift(taxi,p,{now:220000}).status,'expired');
});
test('resident saves reject corrupt unlocks, preserve progress and give useful upgrade rewards',()=>{
  const s={...freshLife(),completed:{milk:10},upgrades:['bag'],benches:[0,1,2],wins:1,secret:true};const restored=validateLife(JSON.parse(JSON.stringify(s)));assert.equal(restored.completed.milk,10);assert.equal(lifeAchievements(restored).length,5);assert.equal(shiftReward('milk',restored).coins,35);assert.equal(shiftReward('cleanup',restored).coins,45);
  for(const bad of [{...s,wins:-1},{...s,upgrades:['admin']},{...s,completed:{milk:Infinity}},{...s,benches:[-1]},null])assert.throws(()=>validateLife(bad));
});


import { CAREER_CHAPTERS, CAREER_DISTRICTS, addDistrict, finishCareerShift, finishCareerCourt, careerReady, claimCareerChapter, claimBulletin, currentBulletin, freshBulletin } from '../shared/career.mjs';
import { shiftStops } from '../shared/residentLife.mjs';
test('career chapters award once in order, only after requirements are met',()=>{
  let s=freshLife();const date='2026-10-13';
  assert.equal(claimCareerChapter(s,'badge',0),null);
  s=finishCareerShift(s,'milk',date);
  const award=claimCareerChapter(s,'badge',10);
  assert.equal(award.coins,35);s=award.record;
  assert.equal(claimCareerChapter(s,'badge',10),null);
  assert.equal(claimCareerChapter(s,'tour',10),null);
  for(const d of CAREER_DISTRICTS.slice(0,3))s=addDistrict(s,d.id,date);
  assert.equal(careerReady(CAREER_CHAPTERS[1],s,10),true);
  assert.equal(claimCareerChapter(s,'tour',10).coins,45);
});
test('exploration passport persists and daily district challenge resets on rollover',()=>{
  let s=freshLife();s=addDistrict(s,'civic','2026-10-13');
  assert.deepEqual(s.visited,['civic']);
  assert.equal(addDistrict(s,'civic','2026-10-13'),s);
  s=addDistrict(s,'market','2026-10-13');s=addDistrict(s,'park','2026-10-13');
  const claimed=claimBulletin(s,'districts','2026-10-13');
  assert.equal(claimed.coins,25);
  assert.equal(claimBulletin(claimed.record,'districts','2026-10-13'),null);
  const after=addDistrict(claimed.record,'civic','2026-10-14');
  assert.deepEqual(after.visited,['civic','market','park']);
  assert.deepEqual(after.daily.districts,['civic']);assert.deepEqual(after.daily.claimed,[]);
});
test('shift and court daily claims cannot duplicate, and day rollover clears counters',()=>{
  let s=freshLife();s=finishCareerShift(s,'milk','2026-10-13');s=finishCareerShift(s,'post','2026-10-13');
  s=finishCareerCourt(s,'2026-10-13');
  assert.equal(claimBulletin(s,'shifts','2026-10-13').rep,5);
  s=claimBulletin(s,'court','2026-10-13').record;
  assert.equal(claimBulletin(s,'court','2026-10-13'),null);
  assert.equal(currentBulletin(s.daily,'2026-10-14').shifts,0);
});
test('alternate job routes are deterministic and old resident saves migrate losslessly',()=>{
  const old={completed:{milk:3},upgrades:['club'],benches:[1],wins:0,secret:false};
  const previous=validateLife(old);
  assert.deepEqual(previous.visited,[]);assert.deepEqual(previous.chapters,[]);
  const post=JOBS.find(j=>j.id==='post');assert.ok(post);
  const first=startShift('post',55,previous,0);
  assert.equal(shiftStops(post,first)[1].x,57);
  const second=startShift('post',55,{...previous,completed:{...previous.completed,post:1}},0);
  assert.equal(shiftStops(post,second)[1].x,8);
  assert.throws(()=>validateLife({...old,chapters:['unofficial']}));
  assert.throws(()=>validateLife({...old,daily:{...freshBulletin('2026-10-13'),claimed:['bogus']}}));
});
