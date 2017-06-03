const fs = require('fs');
const path = require('path');
const esprima = require('esprima');
const Rx = require('rxjs');

const deps = new Rx.Subject();

const files = deps
    .startWith('index')
    .map(dep => path.resolve('./examples/fn/01/', dep) + '.js');

const nodes = files
    .flatMap(file => Rx.Observable.bindNodeCallback(fs.readFile)(file, 'utf8'))
    .flatMap(code => Rx.Observable.fromEventPattern(handler => esprima.parse(code, { sourceType: 'module' }, handler)));

const imports = nodes
    .filter(node => node.type === 'ImportDeclaration')
    .map(node => node.source.value);

const invokes = nodes
    .filter(node => node.type === 'CallExpression' && node.callee.type === 'Identifier')
    .map(node => node.callee.name);

const declared = nodes
    .filter(node => node.type === 'FunctionDeclaration')
    .map(node => node.id.name);

const exported = nodes
    .filter(node => node.type === 'ExportNamedDeclaration')
    .map(node => node.declaration.id.name);

imports.subscribe(value => {
    deps.next(value);
    console.log('import from', value);
});

declared.subscribe(value => console.log('declare', value));
invokes.subscribe(value => console.log('invoke', value));
exported.subscribe(value => console.log('export', value));