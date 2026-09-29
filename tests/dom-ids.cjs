const fs=require('node:fs');
const assert=require('node:assert/strict');

const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const app=fs.readFileSync(__dirname+'/../app.js','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
const references=[...app.matchAll(/\bel\('([^']+)'\)/g)].map(match=>match[1]);

assert.equal(new Set(ids).size,ids.length,'HTML IDs must be unique');
assert.deepEqual(references.filter(id=>!ids.includes(id)),[],
  'Every element used by the app must exist in the page');
