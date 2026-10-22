import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export function database(path=':memory:'){
 const db=new DatabaseSync(path);
 if(!db.prepare("SELECT name FROM sqlite_master WHERE name='workspaces'").get())db.exec(readFileSync(new URL('../drizzle/0000_roundtable.sql',import.meta.url),'utf8'));
 db.exec(readFileSync(new URL('../drizzle/0001_byok.sql',import.meta.url),'utf8'));
 const api={
  prepare(sql){return {bind(...values){return {
   async first(){return db.prepare(sql).get(...values)||null},
   async all(){return {results:db.prepare(sql).all(...values)}},
   async run(){return {meta:{changes:db.prepare(sql).run(...values).changes}}}
  }}}},
  async batch(items){db.exec('BEGIN');try{const out=[];for(const item of items)out.push(await item.run());db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}},
  close(){db.close()}
 };return api;
}
