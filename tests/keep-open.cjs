const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const code=source.slice(source.indexOf('// Decisions stay in the WebView.'),source.indexOf('// Bonus requests have their own freshness'));
const elements=new Map(),storage=new Map();
function el(id){if(!elements.has(id))elements.set(id,{textContent:'',value:'',disabled:false,classList:{hide:false,add(){this.hide=true},remove(){this.hide=false}}});return elements.get(id)}
const posts=[],reads=[],statuses=[];let answers=[],refreshed=0,realPending=false;
const context=vm.createContext({console,el,adminView:true,adminActionToken:'test-action-cap',adminEndpoint:'https://script.google.com/macros/s/test/exec',tg:{initData:'',sendData(){throw Error('Must never close via sendData')},close(){throw Error('Must never close')}},TextEncoder,Uint8Array,Map,Array,Promise,JSON,Error,fetch:async(url,options)=>{posts.push(options);return {type:'opaque'}},window:{crypto:crypto.webcrypto},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:(fn,ms)=>{if(ms>0)queueMicrotask(fn);return 0},
 adminRequestData:async(week,params)=>{reads.push(params);const reply=answers.shift();if(reply instanceof Error)throw reply;return reply||{supported:true,state:'pending'}},loadBonuses:async()=>{refreshed++},loadAdmin:async()=>{refreshed++},loadOrder:async()=>{},loadGlobalSearch:async()=>{},orderData:null,bulkSelectionStatus(){},mutationPending:false});
vm.runInContext(code+';globalThis.api={sendApproval,checkApproval,resumeApproval,get:()=>({approvalPending,mutationPending,approvalChecking})};',context);
const payload={version:1,type:'adminBonusDecision',key:'TG-1',amount:250};
(async()=>{
 answers=[{supported:true,state:'unknown'},{supported:true,state:'unknown'},{supported:true,state:'pending'},{supported:true,state:'done',message:'Одобрено: 250 руб.'}];
 await context.api.sendApproval(payload);assert.equal(posts.length,1);assert.equal(posts[0].method,'POST');assert.equal(posts[0].mode,'no-cors');assert.equal(posts[0].credentials,'omit');assert(!posts[0].body.includes('readToken'));assert.equal(storage.size,0);assert.equal(context.api.get().mutationPending,false);assert.equal(refreshed,1);assert.match(el('bonus-status').textContent,/250/);assert(!source.includes('tg.close('));
 // A lost response is not an approval; the same ID survives retry and refresh.
 posts.length=0;answers=[{supported:true,state:'unknown'},...Array.from({length:20},()=>({supported:true,state:'unknown'}))];
 await context.api.sendApproval(payload);assert.equal(posts.length,3);const ids=posts.map(p=>JSON.parse(p.body).requestId);assert.equal(new Set(ids).size,1);assert.equal(context.api.get().mutationPending,true);assert.equal(storage.size,1);assert.match(el('admin-action-status').textContent,/не получено/);
 await context.api.sendApproval(payload);assert.equal(posts.length,3,'Double press while unconfirmed cannot create another request');
 answers=[{supported:true,state:'done',message:'Одобрено'}];await context.api.checkApproval();assert.equal(context.api.get().mutationPending,false);assert.equal(storage.size,0);
 // A server failure is explicit and leaves the cabinet usable without showing success.
 answers=[{supported:true,state:'unknown'},{supported:true,state:'failed',message:'Неделя закрыта'}];await context.api.sendApproval(payload);assert.equal(context.api.get().mutationPending,false);assert.match(el('bonus-status').textContent,/не применено|требует проверки/);
 // An old deployed backend is discovered before any opaque POST.
 const count=posts.length;answers=[{assembly:[]}];await context.api.sendApproval(payload);assert.equal(posts.length,count);assert.equal(context.api.get().mutationPending,false);assert.match(el('admin-action-status').textContent,/V27/);
 // Network read failure after delivery cannot unlock another mutation.
 answers=[{supported:true,state:'unknown'},{supported:true,state:'unknown'},Error('Сеть')];await context.api.sendApproval(payload);assert.equal(context.api.get().mutationPending,true);assert.equal(storage.size,1);const pendingId=context.api.get().approvalPending.id;
 answers=[{supported:true,state:'done',message:'Подтверждено'}];await context.api.checkApproval();assert.equal(reads.at(-1).requestId,pendingId);assert.equal(context.api.get().mutationPending,false);
 // Selection confirmation refreshes the active list, no employee picker or sendData.
 answers=[{supported:true,state:'unknown'},{supported:true,state:'done',message:'Выбор получен',bulkJob:{total:25,accepted:0}}];await context.api.sendApproval({version:1,type:'adminAcceptSelection'});assert(refreshed>=4);
 // Actual send routing intercepts owner decisions; worker submissions keep their old channel.
 const send=source.slice(source.indexOf('function send(payload)'),source.indexOf("el('arrive').onclick"));
 const sent=[],rpc=[];const c=vm.createContext({mutationPending:false,adminView:true,adminDataFresh:true,bonusDataFresh:true,notice:m=>statuses.push(m),adminStatus(){},el,staff:[],TextEncoder,JSON,tg:{platform:'ios',sendData:p=>sent.push(p)},sendApproval:p=>rpc.push(p)});vm.runInContext(send,c);
 for(const type of ['adminBonusDecision','adminAcceptAssembly','adminAcceptSelection'])c.send({type});assert.equal(sent.length,0);assert.equal(rpc.length,3);
 c.adminView=false;c.send({type:'arrive'});assert.equal(sent.length,1);
 console.log('PASS keep-open UI: POST only, actual confirmation, no closure, repeated press, opaque/lost reply, stable retry ID, server failure, old backend detection, selection refresh, legacy worker compatibility');
})().catch(error=>{console.error(error);process.exitCode=1});
