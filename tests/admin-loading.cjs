const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const transport=source.slice(source.indexOf('function transientAdminError('),source.indexOf('function adminNormalizeWeek('));
const scripts=[];
const callbacks={};
let mode='network',retryCount=0;
const document={
  createElement:()=>({remove(){}}),
  head:{append(script){
    scripts.push(script);
    if(mode==='network'&&scripts.length===1)script.onerror();
    else if(mode==='server')callbacks[new URL(script.src).searchParams.get('callback')]({ok:false,message:'Нет доступа'});
    else callbacks[new URL(script.src).searchParams.get('callback')]({ok:true,data:{assembly:[{key:'SB-1'}]}});
  }}
};
const adminRequestData=vm.runInNewContext(transport+';adminRequestData',{
  adminEndpoint:'https://script.google.com/macros/s/AKfycb-test/exec',
  adminReadToken:'test-token',tg:null,document,window:callbacks,URL,URLSearchParams,
  setTimeout,clearTimeout,Math,Error,
});

async function testTransport(){
  const data=await adminRequestData('2026-09-28',{},()=>retryCount++);
  assert.equal(data.assembly[0].key,'SB-1');
  assert.equal(scripts.length,2,'A broken read is retried once');
  assert.equal(retryCount,1);
  assert.equal(new URL(scripts[1].src).searchParams.get('week'),'2026-09-28');
  mode='server';
  await assert.rejects(adminRequestData('2026-09-28'),/Нет доступа/);
  assert.equal(scripts.length,3,'An explicit server rejection is not retried');
}

const loading=source.slice(source.indexOf('async function loadAdmin('),source.indexOf("el('admin-refresh').onclick=loadAdmin;"));
const ids=new Map();
const el=id=>{
  if(!ids.has(id))ids.set(id,{
    value:'',textContent:'',classList:{add(){},toggle(){}},
    replaceChildren(){this.children=[]},children:[],
  });
  return ids.get(id);
};
let week='2026-09-28',fail=false;
const state=vm.runInNewContext(
  'let adminData=null,adminRequest=0,adminLoadedWeek="",adminDataFresh=false;'+loading+
  ';({loadAdmin,get:()=>({adminData,adminLoadedWeek,adminDataFresh})})',{
    adminView:true,el,selectedAssemblies:new Map(),bulkSelectionStatus(){},
    adminNormalizeWeek:()=>week,
    adminRequestData:async()=>{if(fail)throw new Error('Ответ не получен');return {assembly:[{key:'SB-1'}]}},
    renderAdmin:()=>{el('admin-assembly-list').children=[{key:'SB-1'}]},
    adminStatus:value=>{el('admin-status').textContent=value},Intl,Date,
  });

async function testSnapshot(){
  await state.loadAdmin();
  assert.equal(state.get().adminDataFresh,true);
  fail=true;
  await state.loadAdmin();
  assert.equal(state.get().adminData.assembly[0].key,'SB-1','Same-week snapshot remains visible');
  assert.equal(state.get().adminDataFresh,false,'Stale data cannot authorize mutations');
  assert.equal(el('admin-assembly-list').children.length,1);
  assert.match(el('admin-status').textContent,/предыдущий список/);
  week='2026-10-05';
  await state.loadAdmin();
  assert.equal(state.get().adminData,null,'A different week cannot show the old snapshot');
  assert.equal(el('admin-assembly-list').children.length,0);
}

Promise.resolve().then(testTransport).then(testSnapshot).catch(error=>{console.error(error);process.exitCode=1});
