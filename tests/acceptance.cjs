const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const app=fs.readFileSync(__dirname+'/../app.js','utf8');
const code=app.slice(app.indexOf('function acceptanceChoices('),app.indexOf('function deleteAssembly('));
const sent=[];
const {acceptanceChoices,addAcceptanceButtons}=vm.runInNewContext(
  code+';({acceptanceChoices,addAcceptanceButtons})',
  {node:(_tag,caption,klass)=>({textContent:caption,className:klass}),acceptAssembly:(record,status)=>sent.push([record.key,status])}
);
const choices=record=>JSON.parse(JSON.stringify(acceptanceChoices(record)));

assert.deepEqual(choices({status:'Принято'}),[
  ['Вернуть на приёмку','Ожидает приёмки'],['На переделку','Своя переделка']
]);
assert.deepEqual(choices({status:'Своя переделка'}),[
  ['Принять','Принято'],['Вернуть на приёмку','Ожидает приёмки']
]);
assert.deepEqual(choices({status:'Ожидает приёмки'}),[
  ['Принять','Принято'],['На переделку','Своя переделка']
]);
assert.deepEqual(choices({status:'Принято',statusMismatch:true}),[
  ['Синхронизировать','Принято']
]);
assert.deepEqual(choices({status:'Неизвестно'}),[]);

const actions={buttons:[],append(button){this.buttons.push(button)}};
addAcceptanceButtons(actions,{key:'SB-000054',status:'Принято'});
assert.equal(actions.buttons[0].textContent,'Вернуть на приёмку');
assert.equal(actions.buttons[0].className,'');
actions.buttons[0].onclick();
assert.deepEqual(sent,[['SB-000054','Ожидает приёмки']]);
const pending={buttons:[],append(button){this.buttons.push(button)}};
addAcceptanceButtons(pending,{key:'SB-000055',status:'Ожидает приёмки'});
assert.equal(pending.buttons[0].className,'admin-primary');
assert.equal(pending.buttons[1].className,'');
