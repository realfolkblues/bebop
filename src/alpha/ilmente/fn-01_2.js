const fs = require('fs');
const path = require('path');
const esprima = require('esprima');
const Rx = require('rxjs');

const fileStream = Rx.Observable
    .of('./examples/fn/01/index.js')
    .map(file => path.resolve(file));

const codeStream = fileStream
    .flatMap((file) => Rx.Observable.bindNodeCallback(fs.readFile)(file, 'utf8'));

codeStream.subscribe((code) => {
    esprima.parse(code, { sourceType: 'module' }, (node) => {
        
        if (node.type === 'ImportDeclaration') {
            console.log(node.source.value);
        }
    });
});