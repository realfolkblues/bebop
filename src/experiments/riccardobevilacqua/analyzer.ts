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
    tree: any = new Rx.BehaviorSubject([]);

    constructor(dirPath: string, encoding: string = 'utf8') {
        this.dirPath = dirPath;
        this.encoding = encoding;

        this.createDepTree();
    }

    createDepTree() {
        this.files = this.deps
            .startWith('index')
            .map(dep => path.resolve(this.dirPath, dep) + '.js');

        this.files.subscribe(file => {
            this.analyzeFile(file);
        }, error => {
            console.error(error);
        });

        this.tree.subscribe({
            next: value => {
                console.log('==== TREE:');
                console.info(value);
            }
        });

        return this;
    }

    analyzeFile(file) {
        this.scanNodes(file)
            .scanImports()
            .createSubscriptions();
    }

    addTreeElement(filename) {
        let snapshot = this.tree.getValue();
        const itemIndex = snapshot.findIndex(element => {
            return element.file === filename;
        });

        if (itemIndex > -1) {
            return;
        }

        snapshot.push({
            file: filename
        });

        this.tree.next(snapshot);
    }

    scanNodes(filename) {
        this.addTreeElement(filename);

        this.nodes = Rx.Observable
            .from([filename])
            .flatMap(file => 
                Rx.Observable.bindNodeCallback(fs.readFile)(file, this.encoding)
            ).flatMap(code => 
                Rx.Observable.fromEventPattern(handler => 
                    esprima.parse(code, { sourceType: 'module' }, handler)
                )
            ).share();
        
        return this;
    }

    scanImports() {
        this.imports = this.nodes
            .filter(node => node.type === 'ImportDeclaration')
            .map(node => node.source.value);

        return this;
    }

    scanInvokes() {
        this.invokes = this.nodes
            .filter(node => node.type === 'CallExpression' && node.callee.type === 'Identifier')
            .map(node => node.callee.name);

        return this;
    }

    scanDeclared() {
        this.declared = this.nodes
            .filter(node => node.type === 'FunctionDeclaration')
            .map(node => node.id.name);

        return this;
    }

    scanExported() {
        this.exported = this.nodes
            .filter(node => node.type === 'ExportNamedDeclaration')
            .map(node => node.declaration.id.name);

        return this;
    }


    createSubscriptions(){        
        // this.declared.subscribe(value => {
        
        // });

        // this.invokes.subscribe(value => {
        
        // });

        // this.exported.subscribe(value => {
        
        // });

        this.imports.subscribe(value => {
            // this.deps.next(value);
        });

        return this;
    }
}

const analyzer = new Analyzer('./examples/fn/01/');