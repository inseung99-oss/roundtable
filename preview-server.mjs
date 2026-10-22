import {createServer} from 'node:http';import {readFileSync} from 'node:fs';import {database} from './tests/sqlite-d1.mjs';import {handle} from './server/handler.mjs';
// Development-only local identity. Never included in the deployment build.
// This process is intentionally bound to loopback and is not a production server.
const DB=database(),assets={};
// Explicit, local-only test mode; no provider credentials leave this process.
const previewFetch=process.env.BYOK_PREVIEW_MOCK==='1'?async(url,init)=>{
 if(init.method==='GET')return Response.json({id:'preview-model'});
 const text='[로컬 검증 응답] BYOK 질문 전달과 답변 저장이 정상 작동합니다.';
 if(url.includes('anthropic'))return Response.json({content:[{type:'text',text}]});
 if(url.includes('googleapis'))return Response.json({candidates:[{content:{parts:[{text}]}}]});
 return Response.json({output:[{type:'message',content:[{type:'output_text',text}]}]});
}:undefined;for(const [path,file,type] of [['/','index.html','text/html; charset=utf-8'],['/app.js','app.js','text/javascript'],['/core.mjs','core.mjs','text/javascript'],['/style.css','style.css','text/css'],['/layout.css','layout.css','text/css']])assets[path]={body:readFileSync('ui/'+file,'utf8'),type};
assets["/CONNECTOR-GUIDE.md"]={body:readFileSync("CONNECTOR-GUIDE.md","utf8"),type:"text/plain; charset=utf-8"};
createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id','local-preview');const r=new Request('http://127.0.0.1:4175'+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});const response=await handle(r,{DB,PROVIDER_FETCH:previewFetch,BYOK_ENCRYPTION_KEY:btoa('12345678901234567890123456789012')},assets);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch(e){res.writeHead(500);res.end('Preview error')}}).listen(4175,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4175'));
