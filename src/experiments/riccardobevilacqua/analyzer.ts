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
    dirPath: string;
    encoding: string;
    files: BehaviorSubject<string> = new BehaviorSubject<string>('index');
    tree: BehaviorSubject<TreeItem[]> = new BehaviorSubject([]);

    constructor(dirPath: string, encoding: string = 'utf8') {
        this.dirPath = dirPath;
        this.encoding = encoding;

        this.createDepTree();
    }

    createDepTree(): void {        
        this.files.subscribe(file => {
            const filename = resolve(this.dirPath, file) + '.js';
            console.log('FILE: ' + filename);
            this.analyzeFile(filename);
        });

        this.tree.subscribe({
            next: (value) => {
                console.log('==== TREE:');
                console.info(value);
            }
        });
    }

    analyzeFile(filename: string): void {
        this.addTreeElement(filename);

        const nodes = Observable
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

                return codeAsObservable;
            }).share();

        const imports = this.scanImports(nodes);
        const declared = this.scanDeclared(nodes);
        const invoked = this.scanInvoked(nodes);
        const exported = this.scanExported(nodes);
        
        imports.subscribe(value => {
            this.feedTreeElement(filename, 'imports', value);
            this.files.next(value);
        });

        declared.subscribe(value => {
            this.feedTreeElement(filename, 'declared', value);
        });

        invoked.subscribe(value => {
            this.feedTreeElement(filename, 'invoked', value);
        });

        exported.subscribe(value => {
            this.feedTreeElement(filename, 'exported', value);
        });
    }

    scanImports(nodes: Observable<Node>): Observable<string> {
        return nodes
            .filter(node => node.type === 'ImportDeclaration')
            .map(node => node.source.value);
    }

    scanInvoked(nodes: Observable<Node>): Observable<string> {
        return nodes
            .filter(node => node.type === 'CallExpression' && node.callee.type === 'Identifier')
            .map(node => node.callee.name);
    }

    scanDeclared(nodes: Observable<Node>): Observable<string> {
        return nodes
            .filter(node => node.type === 'FunctionDeclaration')
            .map(node => node.id.name);
    }

    scanExported(nodes: Observable<Node>): Observable<string> {
        return nodes
            .filter(node => node.type === 'ExportNamedDeclaration')
            .map(node => node.declaration.id.name);
    }

    addTreeElement(filename: string): TreeItem[] {
        let snapshot = this.tree.getValue();
        const itemIndex = snapshot.findIndex(element => {
            return element.file === filename;
        });

        if (itemIndex < 0) {
            snapshot.push(<TreeItem>{
                file: filename,
                imports: [],
                declared: [],
                invoked: [],
                exported: []
            });

            this.tree.next(snapshot);
        }

        return snapshot;
    }

    feedTreeElement(filename: string, category: string, value: string): TreeItem[] {
        let snapshot = this.tree.getValue();
        const itemIndex = snapshot.findIndex(element => {
            return element.file === filename;
        });

        if (itemIndex > -1) {
            snapshot[itemIndex][category].push(value);
            this.tree.next(snapshot);
        }

        return snapshot;
    }
}

const analyzer = new Analyzer('./examples/fn/01/');