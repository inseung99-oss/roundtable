import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRequest,validateBackup,otherAgent} from '../ui/core.mjs';
const agents=[{id:'a',name:'A',mark:'A',color:'green'},{id:'b',name:'B',mark:'B',color:'blue'}];
const room={id:'r',title:'Topic',context:'Context',messages:[{id:'m1',sender:'a',text:'Selected opinion',time:'2026-10-20T00:00:00Z'},{id:'m2',sender:'b',text:'Demo',time:'2026-10-20T00:00:00Z',demo:true}],records:['m1'],requests:[]};
test('forwarding preserves source attribution, project context and user note',()=>{const q=makeRequest(room,'b',['m1'],'My question');assert.equal(q.target,'b');assert.equal(q.sources[0].sender,'a');assert.equal(q.sources[0].text,'Selected opinion');assert.equal(q.note,'My question');assert.equal(q.context,'Context');assert.equal(q.status,'pending');assert.equal(q.history.length,1);assert.equal(room.requests.length,0)});
test('backup accepts complete data and rejects invalid references',()=>{assert.equal(validateBackup({version:1,rooms:[room],agents}).rooms.length,1);assert.throws(()=>validateBackup({version:1,rooms:[{...room,records:['missing']}],agents}));assert.throws(()=>validateBackup({version:1,rooms:[room],agents:[agents[0],agents[0]]}));assert.throws(()=>validateBackup({version:1,rooms:[],agents}))});
test('extensible recipient routing chooses another participant',()=>{assert.equal(otherAgent(agents,'a'),'b');assert.equal(otherAgent([...agents,{id:'c'}],'b'),'a')});

test('room membership removal preserves history and does not affect other rooms',async()=>{
 const {roomAgents,removeParticipant}=await import('../ui/core.mjs');
 const s=validateBackup({version:1,agents:structuredClone(agents),rooms:[structuredClone(room),{...structuredClone(room),id:'other'}]});
 s.rooms[0].requests=[{target:'a',status:'running'},{target:'b',status:'pending'}];
 removeParticipant(s,s.rooms[0],'a');
 assert.deepEqual(roomAgents(s.agents,s.rooms[0]).map(a=>a.id),['b']);
 assert.equal(roomAgents(s.agents,s.rooms[1]).length,2);
 assert.equal(s.rooms[0].messages.length,2);assert.deepEqual(s.rooms[0].records,['m1']);
 assert.equal(s.rooms[0].requests[0].status,'cancelled');assert.equal(s.rooms[0].requests[1].status,'pending');
 removeParticipant(s,s.rooms[0],'b');assert.equal(roomAgents(s.agents,s.rooms[0]).length,0);
 s.rooms[0].participants.push('a');assert.equal(s.rooms[0].messages[0].sender,'a');
});

test('room membership validation rejects unknown and duplicate IDs',()=>{
 for(const participants of [['missing'],['a','a'],'a'])assert.throws(()=>validateBackup({version:1,agents,rooms:[{...room,participants}]}));
 assert.doesNotThrow(()=>validateBackup({version:1,agents,rooms:[{...room,participants:[]}]}));
});
