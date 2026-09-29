const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const code=source.slice(source.indexOf('function addPhotoButton('),source.indexOf('function acceptAssembly('));
const calls=[];
const box={children:[],isConnected:true,append(item){this.children.push(item)}};
let fail=true;
const addPhotoButton=vm.runInNewContext(code+';addPhotoButton',{
  node:(_tag,content)=>({textContent:content,remove(){box.children.splice(box.children.indexOf(this),1)}}),
  document:{createElement:tag=>({tagName:tag.toUpperCase()})},
  adminRequestData:async(week,options)=>{
    calls.push({week,...options});
    if(fail)throw new Error('Повторите попытку');
    return {src:'data:image/jpeg;base64,AA=='};
  },
});

async function main(){
  addPhotoButton(box,{key:'SB-1',product:'Стол',order:'1488',photo:false});
  assert.equal(box.children.length,0,'No photo should mean no preview control');
  const record={key:'SB-1',product:'Стол',order:'1488',photo:true};
  addPhotoButton(box,record);
  const button=box.children[0];
  button.replaceWith=item=>{box.children.splice(box.children.indexOf(button),1,item)};
  await button.onclick();
  assert.equal(button.disabled,false,'Failed preview can be retried');
  assert.equal(button.textContent,'Повторить загрузку фото');
  assert.equal(box.children.length,2,'Failure message is visible');
  fail=false;
  await button.onclick();
  assert.deepEqual(calls,[
    {week:'',view:'photo',key:'SB-1'},
    {week:'',view:'photo',key:'SB-1'},
  ]);
  assert.equal(box.children.length,1,'Retry removes the failure message');
  assert.equal(box.children[0].tagName,'IMG');
  assert.equal(box.children[0].alt,'Фото изделия · Стол · заказ № 1488');
  assert.equal(box.children[0].src,'data:image/jpeg;base64,AA==');
}

main().catch(error=>{console.error(error);process.exitCode=1});
