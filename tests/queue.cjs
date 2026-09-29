const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const code=source.slice(source.indexOf('function accountingIssue('),source.indexOf('function queueFilters('));
const {filterAssemblyRows,accountingSummary}=vm.runInNewContext(
  code+';({filterAssemblyRows,accountingSummary})');
const rows=[
  {key:'SB-1',order:'1488',name:'Антон',product:'Сборка печки',status:'Ожидает приёмки'},
  {key:'SB-2',order:'1489',name:'Леня',product:'Стол',status:'Своя переделка'},
  {key:'SB-3',order:'1490',name:'Фил',product:'Стул',status:'Принято'},
  {key:'SB-4',order:'1491',name:'Нарик',product:'Дровник',status:'Принято',statusMismatch:true},
  {key:'SB-5',order:'1492',name:'Антон',product:'Шкафчик',status:'Принято',
    payAmount:'#N/A',payCheck:'Проверьте операцию',payBonus:0,bonusCheck:'OK'}
];
const keys=filters=>filterAssemblyRows(rows,{status:'attention',employee:'',query:'',...filters}).map(r=>r.key).join(',');

assert.equal(keys({}),'SB-1,SB-2,SB-4,SB-5','Queue includes status and calculation issues');
assert.equal(keys({status:'Принято'}),'SB-3,SB-4,SB-5');
assert.equal(keys({status:'all',employee:'Леня'}),'SB-2');
assert.equal(keys({status:'all',query:'sb-3'}),'SB-3');
assert.equal(keys({status:'all',query:'ПЕЧКИ'}),'SB-1');
assert.equal(keys({status:'all',query:'149'}),'SB-3,SB-4,SB-5');
assert.equal(keys({status:'attention',query:'Стул'}),'');
assert.equal(accountingSummary(rows[0]),null,'Old server payload remains compatible');
assert.equal(accountingSummary(rows[4]).warning,true);
assert.match(accountingSummary(rows[4]).text,/Проверьте операцию/);
assert.match(accountingSummary({payCheck:'',bonusCheck:'OK'}).text,/проверка сделки недоступна/);
const correct=accountingSummary({payAmount:1800,payBonus:2000,payCheck:'OK',bonusCheck:'OK'});
assert.equal(correct.warning,false);
assert.match(correct.text,/1.800|1\s800/);
