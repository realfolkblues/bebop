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

import { readFile } from 'fs';
import { resolve } from 'path';
import { Node, parse } from 'esprima';
import { Observable, Subject, BehaviorSubject } from 'rxjs/Rx';

interface TreeItem {
    file: string;
    imports: string[];
    declared: string[];
    invoked: string[];
    exported: string[];
}

class Analyzer {
    declared: Observable<string> = new Observable();
    deps: Subject<string> = new Subject();
    dirPath: string;
    encoding: string;
    exported: Observable<string> = new Observable();    
    imports: Observable<string> = new Observable();
    invoked: Observable<string> = new Observable();
    nodes: Observable<Node> = new Observable();
    tree: BehaviorSubject<TreeItem[]> = new BehaviorSubject([]);

    constructor(dirPath: string, encoding: string = 'utf8') {
        this.dirPath = dirPath;
        this.encoding = encoding;

        this.createDepTree();
    }

    createDepTree() {
        let files: Observable<string> = this.deps
            .startWith('index')
            .map(dep => resolve(this.dirPath, dep) + '.js');

        files.subscribe(file => {
            this.analyzeFile(file);
        });

        this.tree.subscribe({
            next: (value) => {
                console.log('==== TREE:');
                console.info(value);
            }
        });

        return this;
    }

    analyzeFile(file: string) {
        this.addTreeElement(file)
            .scanNodes(file)
            .scanImports()
            .scanDeclared()
            .scanInvoked()
            .scanExported()
            .createSubscriptions();
    }

    addTreeElement(filename: string) {
        let snapshot = this.tree.getValue();
        const itemIndex = snapshot.findIndex(element => {
            return element.file === filename;
        });

        if (itemIndex < 0) {
            snapshot.push({
                file: filename,
                imports: [],
                declared: [],
                invoked: [],
                exported: []
            });

            this.tree.next(snapshot);
        }

        return this;
    }

    feedTreeElement(category: string, value: string) {
        let snapshot = this.tree.getValue();

        snapshot[snapshot.length - 1][category].push(value);

        this.tree.next(snapshot);
    }

    scanNodes(filename: string) {
        this.nodes = Observable
            .from([filename])
            .flatMap(file => {
                const readFileAsObservable = Observable.bindNodeCallback((
                    path: string,
                    encoding: string,
                    callback: (error: Error, buffer: Buffer) => void
                ) => readFile(path, encoding, callback));

                return  readFileAsObservable(file, this.encoding);
            }).flatMap(code => {
                const codeAsObservable = Observable.fromEventPattern(handler => 
                    parse(code, { sourceType: 'module' }, handler)
                );

                // codeAsObservable.subscribe(value => console.info(value));

                return codeAsObservable;
            }).share();
        
        return this;
    }

    scanImports() {
        this.imports = this.nodes
            .filter(node => node.type === 'ImportDeclaration')
            .map(node => node.source.value);

        return this;
    }

    scanInvoked() {
        this.invoked = this.nodes
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
        this.declared.subscribe(value => {
            this.feedTreeElement('declared', value);
        });

        this.invoked.subscribe(value => {
            this.feedTreeElement('invoked', value);
        });

        this.exported.subscribe(value => {
            this.feedTreeElement('exported', value);
        });

        this.imports.subscribe(value => {
            this.feedTreeElement('imports', value);
        });

        return this;
    }
}

const analyzer = new Analyzer('./examples/fn/01/');