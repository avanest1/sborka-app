const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const code=source.slice(source.indexOf('function section('),source.indexOf('function option('));

function runNavigation(adminView){
  const elements=new Map();
  for(const id of ['shift','assembly','history','earnings','admin','finance','tab-shift','tab-assembly','tab-history','tab-earnings','tab-admin','tab-finance','message']){
    const classes=new Set(id==='shift'||id==='tab-shift'?['active']:['hide']);
    if(adminView&&id==='tab-admin')classes.delete('hide');
    elements.set(id,{
      classes,attributes:{},
      classList:{
        add(name){classes.add(name)},
        toggle(name,enabled){if(enabled)classes.add(name);else classes.delete(name)},
      },
      setAttribute(name,value){this.attributes[name]=value},
    });
  }
  let loads=0;
  vm.runInNewContext(code,{
    el:id=>elements.get(id),adminView,workerView:!adminView,loadWorker(){},loadFinance(){},loadAdmin:()=>loads++,String,
  });
  return {elements,loads:()=>loads};
}

const owner=runNavigation(true);
owner.elements.get('tab-admin').onclick();
assert.equal(owner.loads(),1,'Owner tab must load the intake queue');
assert.equal(owner.elements.get('tab-admin').classes.has('hide'),false);
assert.equal(owner.elements.get('admin').classes.has('hide'),false);
assert.equal(owner.elements.get('shift').classes.has('hide'),true);
assert.equal(owner.elements.get('tab-admin').classes.has('active'),true);
assert.equal(owner.elements.get('tab-admin').attributes['aria-selected'],'true');
owner.elements.get('tab-assembly').onclick();
assert.equal(owner.elements.get('assembly').classes.has('hide'),false);
assert.equal(owner.elements.get('admin').classes.has('hide'),true);

const worker=runNavigation(false);
worker.elements.get('tab-admin').onclick();
assert.equal(worker.loads(),0,'Worker cannot load the owner queue');
assert.equal(worker.elements.get('admin').classes.has('hide'),true);

