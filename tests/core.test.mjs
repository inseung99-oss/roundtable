import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRequest,validateBackup,otherAgent} from '../ui/core.mjs';
const agents=[{id:'a',name:'A',mark:'A',color:'green'},{id:'b',name:'B',mark:'B',color:'blue'}];
const room={id:'r',title:'Topic',context:'Context',messages:[{id:'m1',sender:'a',text:'Selected opinion',time:'2026-10-20T00:00:00Z'},{id:'m2',sender:'b',text:'Demo',time:'2026-10-20T00:00:00Z',demo:true}],records:['m1'],requests:[]};
test('forwarding preserves source attribution, project context and user note',()=>{const q=makeRequest(room,'b',['m1'],'My question');assert.equal(q.target,'b');assert.equal(q.sources[0].sender,'a');assert.equal(q.sources[0].text,'Selected opinion');assert.equal(q.note,'My question');assert.equal(q.context,'Context');assert.equal(q.status,'pending');assert.equal(q.history.length,1);assert.equal(room.requests.length,0)});
test('backup accepts complete data and rejects invalid references',()=>{assert.equal(validateBackup({version:1,rooms:[room],agents}).rooms.length,1);assert.throws(()=>validateBackup({version:1,rooms:[{...room,records:['missing']}],agents}));assert.throws(()=>validateBackup({version:1,rooms:[room],agents:[agents[0],agents[0]]}));assert.throws(()=>validateBackup({version:1,rooms:[],agents}))});
test('extensible recipient routing chooses another participant',()=>{assert.equal(otherAgent(agents,'a'),'b');assert.equal(otherAgent([...agents,{id:'c'}],'b'),'a')});
