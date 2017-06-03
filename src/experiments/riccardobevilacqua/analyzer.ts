/**
 * ****************************************************** *
 *                                                        *
 *                        ANALYZER                        *
 *                                                        *
 * ****************************************************** *
 * This library aims to:
 * 1) Access source code
 * 2) Detect dependencies tree and its properties
 * 
 * Necessary and sufficient info to include a function in the output:
 * 1) origin
 * 2) origin imports
 * 3) origin invoked functions
 * 4) origin exported functions
 * 5) origin private declared functions
 * 
 * Example 01
 * 
 * Analysis of index.js should prduce:
 * 1) Modules:
 *      - lib
 * 2) Declared functions: none
 * 3) Invoked functions:
 *      - name
 *      - doublePlusOne
 *      - console.log
 * 
 * Analysis of lib.js should produce:
 * 1) Modules: none
 * 2) Declared functions:
 *      - name (exported)
 *      - double (exported)
 *      - doublePlusOne (exported)
 *      - subX (since it is never used it should be excluded in final output)
 * 3) Invoked functions:
 *      - increment
 *      - double
 *      - addX
 */

const fs = require('fs');
const path = require('path');
const esprima = require('esprima');
const Rx = require('rxjs/Rx');

class Analyzer {
    deps: any = new Rx.Subject();
    dirPath: string;
    encoding: string;
    tree: any = [];

    constructor(dirPath: string, encoding: string = 'utf8') {
        this.dirPath = dirPath;
        this.encoding = encoding;
        this.detectDeps();
    }

    detectDeps() {
        const files = this.deps
            .startWith('index')
            .map(dep => path.resolve(this.dirPath, dep) + '.js');

        const nodes = files
            .flatMap(file => Rx.Observable.bindNodeCallback(fs.readFile)(file, this.encoding))
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

        files.subscribe(value => {
            this.addTreeModule(value);
            console.log('=================================');
            console.info(this.tree);
            console.log('=================================');
        });

        imports.subscribe(value => {
            this.deps.next(value);
            console.log('import from', value);
        });

        declared.subscribe(value => console.log('declare', value));

        invokes.subscribe(value => console.log('invoke', value));

        exported.subscribe(value => console.log('export', value));
    }

    addTreeModule(modulePath: string) {
        this.tree.push({
            filePath: modulePath
        });
    }
}

const analyzer = new Analyzer('./examples/fn/01/');