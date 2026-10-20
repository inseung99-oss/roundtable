import {mkdirSync,copyFileSync} from 'node:fs';
mkdirSync('dist',{recursive:true});
for(const file of ['index.html','style.css','layout.css','app.js','core.mjs']) copyFileSync('ui/'+file,'dist/'+file);
copyFileSync('CONNECTOR-GUIDE.md','dist/CONNECTOR-GUIDE.md');
console.log('Roundtable static app built.');
