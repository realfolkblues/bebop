const fs = require('fs');
const path = require('path');
const esprima = require('esprima');
const Rx = require('rxjs');

let globalTree = {};
const deps = new Rx.Subject();

const files = deps
    .map(dep => path.resolve('./examples/fn/01/', dep) + '.js');

files.subscribe(file => { 
    console.log('working on', file);
    abc(file);
}, error => { 
    console.error(error);
}, () => { 
    console.log(123);
}); 

function abc(filename) { 
    let analysis = {
        imports: {},
        declaredFn: {},
        invokedFn: {},
        exportedFn: {}
    };

    globalTree[filename] = analysis;

    const nodes = Rx.Observable
        .from([filename])
        .flatMap(file => Rx.Observable.bindNodeCallback(fs.readFile)(file, 'utf8'))
        .flatMap(code => Rx.Observable.fromEventPattern(handler => esprima.parse(code, { sourceType: 'module' }, handler)))
        .share();

    const imports = nodes
        .filter(node => node.type === 'ImportDeclaration')
        .map(node => node.source.value);

    const invokedFn = nodes
        .filter(node => node.type === 'CallExpression' && node.callee.type === 'Identifier')
        .map(node => node.callee.name);

    const declaredFn = nodes
        .filter(node => node.type === 'FunctionDeclaration')
        .map(node => node.id.name);

    const exportedFn = nodes
        .filter(node => node.type === 'ExportNamedDeclaration')
        .map(node => node.declaration.id.name);
    
    function count(type, key) {
        globalTree[filename][type][key] =
            !!globalTree[filename][type][key] ? globalTree[filename][type][key] + 1 : 1;
    }
    
    imports.subscribe(value => { 
        count('imports', value);
        deps.next(value);
    });

    declaredFn.subscribe(value => { 
        count('declaredFn', value);
    });

    invokedFn.subscribe(value => { 
        count('invokedFn', value);
    });

    exportedFn.subscribe(value => { 
        count('exportedFn', value);
    });
}

deps.next('index');

setTimeout(function () {
    console.log(globalTree);
}, 1000);
