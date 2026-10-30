// Bake a sleek hair snapshot into index.html so the hero still shows hair without JavaScript.
const fs = require('fs');
const dir = require('path').resolve(process.argv[2]);
require(dir + '/hair.js');
const st = { f: 0, curl: 0, time: 0, shine: 0.85, shineY: 0.44 };
const svg = Hair.markup('h', Hair.makeStrands(110, 11), st, 56, Hair.makeFuzz(90, 11));
const p = dir + '/index.html';
let html = fs.readFileSync(p, 'utf8');
html = html.replace(/<!--hair-->[\s\S]*?<!--\/hair-->/, '<!--hair-->' + svg + '<!--/hair-->');
fs.writeFileSync(p, html);
console.log('baked', svg.length, 'chars');
