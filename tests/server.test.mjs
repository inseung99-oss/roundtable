import {test} from 'node:test';import assert from 'node:assert/strict';
import {database} from './sqlite-d1.mjs';import {getState,putState,claim,reply,heartbeat,handle} from '../server/handler.mjs';import {makeRequest,resolveTargets} from '../ui/core.mjs';
test('public UI serves anonymously while workspace identity follows authentication',async()=>{
 const db=database(),assets={'/':{body:'public app',type:'text/html'}};
 assert.equal((await handle(new Request('https://site/'),{DB:db},assets)).status,200);
 for(const id of ['alice','bob']){
  const response=await handle(new Request('https://site/api/v1/state',{headers:{'oai-authenticated-user-id':id}}),{DB:db});
  const data=await response.json();assert.equal(data.userId,id);assert.equal(data.state,null);
 }
 assert.equal((await handle(new Request('https://site/api/v1/state'),{DB:db},assets)).status,401);
 db.close();
});
const make=()=>({version:1,active:'r',mode:'pending',agents:[{id:'gpt',name:'GPT',mark:'G',color:'green'},{id:'claude',name:'Claude',mark:'C',color:'orange'}],rooms:[{id:'r',title:'test',context:'private',messages:[],records:[],requests:[]}]});
test('ALL creates independent jobs; answers persist and remain isolated by owner',async()=>{const db=database(),s=make();s.rooms[0].requests=resolveTargets(s.agents,'all').map(a=>makeRequest(s.rooms[0],a,[],'question'));
 assert.equal((await putState(db,'alice',{state:s,revision:0})).revision,1);assert.equal((await getState(db,'bob')).state,null);assert.equal(s.rooms[0].requests.length,2);
 const g=await claim(db,'alice','gpt');assert.equal(await claim(db,'alice','gpt'),null);const c=await claim(db,'alice','claude');assert.notEqual(g.request.id,c.request.id);
 await assert.rejects(reply(db,'bob',{requestId:g.request.id,lease:g.lease,text:'bad'}));await assert.rejects(reply(db,'alice',{requestId:g.request.id,lease:'wrong',text:'bad'}));
 await heartbeat(db,'alice',{requestId:g.request.id,lease:g.lease});const a={requestId:g.request.id,lease:g.lease,text:'actual response',model:'test'};await reply(db,'alice',a);assert.equal((await reply(db,'alice',a)).duplicate,true);
 const read=await getState(db,'alice');assert.equal(read.state.rooms[0].messages.length,1);assert.equal(read.state.rooms[0].messages[0].sender,'gpt');
 await putState(db,'alice',{state:s,revision:1});assert.equal((await getState(db,'alice')).state.rooms[0].messages.length,1);await assert.rejects(putState(db,'alice',{state:s,revision:1}),e=>e.status===409);db.close();});
test('cancellation and expiry prevent stale replies; expired claims can retry',async()=>{const db=database(),s=make(),r=s.rooms[0];r.requests=[makeRequest(r,'gpt',[],'question')];await putState(db,'u',{state:s,revision:0});const first=await claim(db,'u','gpt');await db.prepare('UPDATE jobs SET lease_until=0 WHERE owner=?').bind('u').run();await assert.rejects(reply(db,'u',{requestId:first.request.id,lease:first.lease,text:'late'}));const second=await claim(db,'u','gpt');assert.notEqual(first.lease,second.lease);r.requests[0].status='cancelled';await putState(db,'u',{state:s,revision:1});await assert.rejects(reply(db,'u',{requestId:second.request.id,lease:second.lease,text:'cancelled'}));assert.equal(await claim(db,'u','gpt'),null);db.close()});
test('anonymous and cross-origin writes rejected; MCP discovery contains no private data',async()=>{const db=database();assert.equal((await handle(new Request('https://site/api/v1/state'),{DB:db})).status,401);assert.equal((await handle(new Request('https://site/api/v1/state',{method:'PUT',headers:{'oai-authenticated-user-id':'u','origin':'https://evil','content-type':'application/json'},body:'{}'}),{DB:db})).status,403);const m=await handle(new Request('https://site/mcp',{method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})}),{DB:db});assert.equal((await m.json()).result.tools.length,5);db.close()});

test('removing an AI cancels its room lease while keeping other rooms available',async()=>{
 const {removeParticipant}=await import('../ui/core.mjs');const db=database(),s=make();
 s.rooms[0].participants=['gpt','claude'];const second={...structuredClone(s.rooms[0]),id:'second'};s.rooms.push(second);
 for(const r of s.rooms)r.requests=[makeRequest(r,'gpt',[],'question')];
 await putState(db,'u',{state:s,revision:0});const first=await claim(db,'u','gpt');
 const affected=s.rooms.find(r=>r.id===first.request.roomId);removeParticipant(s,affected,'gpt');
 await putState(db,'u',{state:s,revision:1});
 await assert.rejects(reply(db,'u',{requestId:first.request.id,lease:first.lease,text:'late reply'}),e=>e.status===409);
 const next=await claim(db,'u','gpt');assert.notEqual(next.request.roomId,affected.id);
 const loaded=(await getState(db,'u')).state;assert.equal(loaded.rooms.find(r=>r.id===affected.id).requests[0].status,'cancelled');db.close();
});
