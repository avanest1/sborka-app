const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const transport=source.slice(source.indexOf('function transientAdminError('),source.indexOf('let workerData='));
function setup({initData='',mode='expired',worker=false}={}){
  const elements=new Map(),requests=[],sent=[];
  const el=id=>{if(!elements.has(id)){const classes=new Set(['hide']);elements.set(id,{textContent:'',disabled:false,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}})}return elements.get(id)};
  const context=vm.createContext({adminView:!worker,adminReadToken:'old-read-key',workerReadToken:'worker-key',adminUseInitData:false,accessRefreshSent:false,mutationPending:true,
    adminEndpoint:'https://script.google.com/macros/s/test/exec',el,URL,URLSearchParams,setTimeout,clearTimeout,
    tg:{platform:'ios',initData,sendData:raw=>sent.push(JSON.parse(raw))},window:{},
    document:{createElement:()=>({remove(){}}),head:{append(script){
      const url=new URL(script.src);requests.push(url);const cb=url.searchParams.get('callback');
      if(mode==='data-error')context.window[cb]({ok:false,message:'Не удалось прочитать данные учёта.'});
      else if(mode==='network'&&requests.length===1)script.onerror();
      else if((mode==='fallback'&&url.searchParams.has('initData'))||mode==='ok'||mode==='network')context.window[cb]({ok:true,data:{assembly:[],authenticated:true}});
      else context.window[cb]({ok:false,message:'Сессия просмотра истекла. Откройте кнопку заново.'});
    }}}
  });
  vm.runInContext(transport+';globalThis.api={adminRequestData,refreshAdminAccess};',context);
  return {context,el,requests,sent};
}
(async()=>{
  let s=setup();await assert.rejects(s.context.api.adminRequestData('2026-10-12'),/истекла/);
  assert.equal(s.requests.length,1,'Expired access is not a network retry');
  assert.equal(s.el('admin-access-recovery').classList.contains('hide'),false);
  assert.match(s.el('admin-access-message').textContent,/старой кнопки/);
  s.context.api.refreshAdminAccess();s.context.api.refreshAdminAccess();
  assert.equal(s.sent.length,1);assert.equal(s.sent[0].type,'adminAccounting');assert.equal(s.sent[0].version,1);
  assert.equal(s.context.mutationPending,true,'Read-only renewal does not discard an outstanding approval');
  s=setup({initData:'signed-owner-data',mode:'fallback'});
  const result=await s.context.api.adminRequestData('2026-10-12');assert.equal(result.authenticated,true);
  assert.equal(s.requests.length,2);assert(s.requests[0].searchParams.has('readToken'));assert(s.requests[1].searchParams.has('initData'));
  assert.equal(s.context.adminUseInitData,true);await s.context.api.adminRequestData('2026-10-05');assert(s.requests[2].searchParams.has('initData'));
  assert.equal(s.el('admin-access-recovery').classList.contains('hide'),true);
  const post=source.slice(source.indexOf('function postApproval('),source.indexOf('const approvalPause='));
  let body;vm.runInContext(post,s.context);s.context.adminActionToken='old-action-key';s.context.fetch=async(url,opt)=>{body=JSON.parse(opt.body)};
  s.context.postApproval({id:'a'.repeat(32),payload:{version:1,type:'adminBonusDecision'}});
  assert.equal(body.initData,'signed-owner-data');assert(!body.actionToken,'Expired action key is not reused after signed read fallback');
  s=setup({initData:'invalid-data'});await assert.rejects(s.context.api.adminRequestData('2026-10-12'),/истекла/);assert.equal(s.context.adminUseInitData,false);
  s=setup({mode:'data-error',initData:'signed-data'});await assert.rejects(s.context.api.adminRequestData('2026-10-12'),/прочитать/);assert.equal(s.requests.length,1,'Data failures are not mislabeled as expired access');assert(s.el('admin-access-recovery').classList.contains('hide'));
  s=setup({mode:'network'});await s.context.api.adminRequestData('2026-10-12');assert.equal(s.requests.length,2);
  s=setup({worker:true,initData:'employee-signed-data'});await assert.rejects(s.context.api.adminRequestData('',{view:'mine'},undefined,true),/истекла/);assert.equal(s.requests.length,1);assert(s.requests[0].searchParams.has('workerRead'));assert(s.el('admin-access-recovery').classList.contains('hide'));
  console.log('PASS access recovery: expired owner read, one-click read-only renewal, pending approval preserved, verified initData fallback, matching POST auth, explicit rejection, network retry, employee isolation');
})().catch(e=>{console.error(e);process.exitCode=1});
