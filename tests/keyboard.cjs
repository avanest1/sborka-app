const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const app=fs.readFileSync(__dirname+'/../app.js','utf8');
const code=app.slice(app.indexOf('// A visible accessory'),app.indexOf('const fromBot='));
let blur=0,hide=0;const events={},handlers={};
class H{constructor(tag='INPUT'){this.tagName=tag;this.style={};this.hidden=false;this.attributes={};this.listeners={}}
 matches(){return true} setAttribute(k,v){this.attributes[k]=v} addEventListener(k,v){this.listeners[k]=v}
 blur(){blur++;doc.activeElement=null}}
let btn;const doc={activeElement:null,body:{append:b=>btn=b},createElement:()=>new H('BUTTON'),addEventListener:(k,v)=>events[k]=v};
const win={innerHeight:800,visualViewport:{height:430,offsetTop:30,addEventListener:(k,v)=>handlers[k]=v},addEventListener:()=>{}};
const tg={hideKeyboard:()=>hide++,isVersionAtLeast:()=>true};
vm.runInNewContext(code,{HTMLElement:H,document:doc,window:win,tg,setTimeout:f=>f(),Math});
const input=new H();doc.activeElement=input;events.focusin({target:input});
assert.equal(btn.hidden,false);assert.equal(btn.style.top,'404px');assert.equal(input.attributes.enterkeyhint,'done');
btn.listeners.click();assert.equal(blur,1);assert.equal(hide,1);assert.equal(btn.hidden,true);
const text=new H('TEXTAREA');doc.activeElement=text;let prevented=false;
events.keydown({key:'Enter',target:text,preventDefault:()=>prevented=true});assert.equal(prevented,false,'Textarea must keep line breaks');
doc.activeElement=input;events.keydown({key:'Enter',target:input,preventDefault:()=>prevented=true});assert(prevented);assert.equal(blur,2);
tg.isVersionAtLeast=()=>false;doc.activeElement=input;btn.listeners.click();assert.equal(blur,3);assert.equal(hide,2,'Old Telegram uses blur only');
console.log('PASS: Done focus/blur, viewport position, Enter, multiline, older Telegram fallback');
