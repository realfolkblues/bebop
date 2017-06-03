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
    declared: any = new Rx.Observable();
    deps: any = new Rx.Subject();
    dirPath: string;
    encoding: string;
    exported: any = new Rx.Observable();
    files: any = new Rx.Observable();
    imports: any = new Rx.Observable();
    invokes: any = new Rx.Observable();
    nodes: any = new Rx.Observable();
    tree: any = [];

    constructor(dirPath: string, encoding: string = 'utf8') {
        this.dirPath = dirPath;
        this.encoding = encoding;

        this.createDepTree();
    }

    createDepTree() {
        this.scanFiles();
        this.scanNodes();
        this.scanInvokes();
        this.scanDeclared();
        this.scanExported();
        this.scanImports();
        this.createSubscriptions();
    }

    scanFiles() {
        this.files = this.deps
            .startWith('index')
            .map(dep => path.resolve(this.dirPath, dep) + '.js');
    }

    scanNodes() {
        this.nodes = this.files
            .flatMap(file => 
                Rx.Observable.bindNodeCallback(fs.readFile)(file, this.encoding)
            ).flatMap(code => 
                Rx.Observable.fromEventPattern(handler => 
                    esprima.parse(code, { sourceType: 'module' }, handler)
                )
            );
    }

    scanImports() {
        this.imports = this.nodes
            .filter(node => node.type === 'ImportDeclaration')
            .map(node => node.source.value);
    }

    scanInvokes() {
        this.invokes = this.nodes
            .filter(node => node.type === 'CallExpression' && node.callee.type === 'Identifier')
            .map(node => node.callee.name);
    }

    scanDeclared() {
        this.declared = this.nodes
            .filter(node => node.type === 'FunctionDeclaration')
            .map(node => node.id.name);
    }

    scanExported() {
        this.exported = this.nodes
            .filter(node => node.type === 'ExportNamedDeclaration')
            .map(node => node.declaration.id.name);
    }


    createSubscriptions(){        
        this.files.subscribe(value => {
            this.addTreeElement(value);

            console.log('======================');
            console.log(this.tree);
            console.log('======================');
        });

        this.imports.subscribe(value => {
            this.deps.next(value);
        });
        
        this.declared.subscribe(value => console.log('declare', value));

        this.invokes.subscribe(value => console.log('invoke', value));

        this.exported.subscribe(value => console.log('export', value));
    }

    addTreeElement(modulePath: string) {
        this.tree.push({
            filePath: modulePath
        });
    }
}

const analyzer = new Analyzer('./examples/fn/01/');