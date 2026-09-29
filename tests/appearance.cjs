const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const code = fs.readFileSync(__dirname + '/../appearance.js','utf8');
const html = fs.readFileSync(__dirname + '/../index.html','utf8');
const css = fs.readFileSync(__dirname + '/../appearance.css','utf8');

for (const id of ['settings-open','settings-close','settings-reset','settings-dialog']) {
  assert.match(html,new RegExp(`id="${id}"`));
}
for (const file of ['appearance.css','appearance.js']) assert.ok(html.includes(file));
for (const value of ['grid','blueprint','warm']) assert.ok(css.includes(`wallpaper-swatch--${value}`));
assert.match(css,/\.shell \{[^}]*background-image: var\(--wallpaper\)/,
  'Wallpaper must continue beneath both the rounded hero and main content');
assert.match(css,/\.content \{[^}]*background: transparent/,
  'Main content must not restart the wallpaper at the hero boundary');
assert.match(css,/\.admin-picker select \{[^}]*background: var\(--surface-soft\);[^}]*color: var\(--ink\)/,
  'The owner employee selector must use matching background and text colors');
assert.match(css,/#admin \.admin-card button \{[^}]*border-radius: 999px/,
  'Buttons in owner cards must have the same pill shape as Delete');
assert.match(css,/#admin \.admin-accept-actions \.admin-delete \{[^}]*color: #ae4d3c/,
  'Delete must remain a red-text action');
assert.match(css,/#admin \.admin-accept-actions \.admin-primary \{[^}]*background: var\(--accent\)/,
  'Accept must remain the primary action');

function load(saved) {
  const listeners = new Map();
  const focused = {current:null};
  const storage = new Map(saved == null ? [] : [['sborka.appearance.v1',saved]]);
  const nodes = new Map();
  const choices = new Map();
  function node(id) {
    const classes = new Set(id === 'settings-dialog' ? ['hide'] : []);
    const n = {
      id,listeners:{},classList:{
        add:value=>classes.add(value),remove:value=>classes.delete(value),
        contains:value=>classes.has(value),
        toggle(value,enabled){if (enabled) classes.add(value); else classes.delete(value)},
      },
      addEventListener(type,callback){this.listeners[type]=callback},
      focus(){focused.current=this},
      querySelectorAll(selector){return selector === 'input[type="radio"]' ? [...choices.values()] : [nodes.get('settings-close'),nodes.get('settings-reset')]},
      classes,
    };
    nodes.set(id,n);
    return n;
  }
  for (const id of ['settings-dialog','settings-open','settings-close','settings-reset']) node(id);
  for (const [field,values] of Object.entries({theme:['system','light','dark'],wallpaper:['plain','grid','blueprint','warm'],accent:['pine','blue','clay'],size:['normal','large']})) {
    for (const value of values) {
      const parent = {classes:new Set(),classList:{toggle(name,on){if(on)parent.classes.add(name);else parent.classes.delete(name)}}};
      choices.set(`${field}:${value}`,{name:`appearance-${field}`,value,checked:false,parentElement:parent});
    }
  }
  const meta = {content:'#123e36'};
  const document = {
    documentElement:{dataset:{}},body:{classList:node('body').classList},
    activeElement:nodes.get('settings-open'),
    getElementById:id=>nodes.get(id),
    querySelector(selector){
      if (selector === 'meta[name="theme-color"]') return meta;
      return null;
    },
    addEventListener(type,callback){listeners.set(type,callback)},
  };
  class HTMLInputElement {
    constructor(name,value){this.name=name;this.value=value;this.type='radio'}
  }
  const context = {
    document,HTMLInputElement,
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
    window:{matchMedia:()=>({matches:false,addEventListener(){}})},
  };
  vm.runInNewContext(code,context);
  return {document,nodes,storage,meta,focused,HTMLInputElement,listeners,choices};
}

const app = load(JSON.stringify({theme:'dark',wallpaper:'grid',accent:'clay',size:'large'}));
assert.equal(app.document.documentElement.dataset.theme,'dark');
assert.equal(app.document.documentElement.dataset.wallpaper,'grid');
assert.equal(app.meta.content,'#111b1b');
app.nodes.get('settings-open').listeners.click();
assert.equal(app.nodes.get('settings-dialog').classes.has('hide'),false);
assert.equal(app.choices.get('theme:dark').checked,true);
assert.equal(app.focused.current,app.nodes.get('settings-close'));
app.nodes.get('settings-dialog').listeners.change({target:new app.HTMLInputElement('appearance-theme','light')});
assert.equal(app.document.documentElement.dataset.theme,'light');
assert.equal(app.meta.content,'#f1eee6');
assert.equal(JSON.parse(app.storage.get('sborka.appearance.v1')).theme,'light');
app.listeners.get('keydown')({key:'Escape',preventDefault(){}});
assert.equal(app.nodes.get('settings-dialog').classes.has('hide'),true);
assert.equal(app.focused.current,app.nodes.get('settings-open'));
app.nodes.get('settings-reset').listeners.click();
assert.equal(app.document.documentElement.dataset.wallpaper,'plain');
assert.equal(app.document.documentElement.dataset.size,'normal');

const malformed = load('{bad json');
assert.equal(malformed.document.documentElement.dataset.theme,'system');
const unknown = load(JSON.stringify({theme:'broken',wallpaper:'grid'}));
assert.equal(unknown.document.documentElement.dataset.theme,'system');
assert.equal(unknown.document.documentElement.dataset.wallpaper,'grid');
