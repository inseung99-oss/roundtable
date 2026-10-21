export const uid=()=>crypto.randomUUID();
export const otherAgent=(agents,sender)=>agents.find(a=>a.id!==sender)?.id||agents[0]?.id;
export const roomAgents=(agents,room)=>room.participants===undefined?agents:agents.filter(a=>room.participants.includes(a.id));
export function removeParticipant(state,room,id){
 room.participants=roomAgents(state.agents,room).map(a=>a.id).filter(a=>a!==id);
 for(const q of room.requests)if(q.target===id&&['pending','running','demo-processing'].includes(q.status))q.status='cancelled';
}
export function resolveTargets(agents,target){if(target==='all')return agents.map(a=>a.id);if(!agents.some(a=>a.id===target))throw Error('AI 참여자를 찾을 수 없습니다.');return [target];}
export function makeRequest(room,target,sourceIds,note){
 const sources=room.messages.filter(m=>sourceIds.includes(m.id));
 return {version:'1',id:uid(),roomId:room.id,target,status:'pending',createdAt:new Date().toISOString(),topic:room.title,context:room.context,sources:sources.map(m=>({id:m.id,sender:m.sender,text:m.text,demo:!!m.demo})),note,history:room.messages.filter(m=>!m.demo).slice(-40).map(m=>({id:m.id,sender:m.sender,text:m.text}))};
}
export function validateBackup(data){
 if(data?.version!==1||!Array.isArray(data.rooms)||!data.rooms.length||data.rooms.length>100||!Array.isArray(data.agents)||data.agents.length<2||data.agents.length>100)throw Error('Roundtable 백업 파일이 아닙니다.');
 const safe=s=>typeof s==='string';
 if(!data.agents.every(a=>safe(a.id)&&safe(a.name)&&safe(a.mark)&&safe(a.color)))throw Error('AI 정보가 올바르지 않습니다.');
 const aids=new Set(data.agents.map(a=>a.id));
 if(aids.size!==data.agents.length)throw Error('AI ID가 중복되었습니다.');
 const ids=new Set();
 for(const r of data.rooms){if(!safe(r.id)||ids.has(r.id)||!safe(r.title)||!safe(r.context)||!Array.isArray(r.messages)||!Array.isArray(r.records)||!Array.isArray(r.requests))throw Error('대화방 정보가 올바르지 않습니다.');ids.add(r.id);
 if(r.participants!==undefined&&(!Array.isArray(r.participants)||r.participants.length>12||new Set(r.participants).size!==r.participants.length||!r.participants.every(id=>aids.has(id))))throw Error('참가자 목록이 올바르지 않습니다.');
 r.participants??=[...aids];if(r.participants.length>12)throw Error('대화방에는 최대 12개의 AI가 참여할 수 있습니다.');
 const mids=new Set();for(const m of r.messages){if(!safe(m.id)||mids.has(m.id)||!safe(m.text)||!safe(m.sender)||!safe(m.time)||(!aids.has(m.sender)&&m.sender!=='user'))throw Error('메시지가 올바르지 않습니다.');mids.add(m.id)}
 if(!r.records.every(x=>safe(x)&&mids.has(x)))throw Error('기록한 메시지 참조가 올바르지 않습니다.');
 for(const q of r.requests)if(!safe(q.id)||!safe(q.target)||!aids.has(q.target)||!safe(q.status)||!Array.isArray(q.sources)||!safe(q.note))throw Error('요청 정보가 올바르지 않습니다.');
 }return data;
}
