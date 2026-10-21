import {readFileSync,writeFileSync,mkdirSync,cpSync,rmSync} from 'node:fs';
// Only remove this project’s generated build directory.
rmSync(new URL('./dist/',import.meta.url),{recursive:true,force:true});
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
const assets={};for(const [p,f,type] of [['/','index.html','text/html; charset=utf-8'],['/app.js','app.js','text/javascript'],['/core.mjs','core.mjs','text/javascript'],['/style.css','style.css','text/css'],['/layout.css','layout.css','text/css']])assets[p]={body:readFileSync('ui/'+f,'utf8'),type};
assets['/CONNECTOR-GUIDE.md']={body:readFileSync('CONNECTOR-GUIDE.md','utf8'),type:'text/plain; charset=utf-8'};
const core=readFileSync('ui/core.mjs','utf8').replaceAll('export ','');const handler=readFileSync('server/handler.mjs','utf8').replace("import {validateBackup,roomAgents} from '../ui/core.mjs';",'');
writeFileSync('dist/server/index.js',core+'\n'+handler+'\nconst assets='+JSON.stringify(assets)+';\nexport default {fetch:(req,env)=>handle(req,env,assets)};');
cpSync('.openai/hosting.json','dist/.openai/hosting.json');cpSync('drizzle','dist/.openai/drizzle',{recursive:true});console.log('Built server with D1 and MCP.');
