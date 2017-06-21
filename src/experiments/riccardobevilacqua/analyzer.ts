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

import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as babylon from 'babylon';
import * as babelTypes from 'babel-types';
import traverse from 'babel-traverse';
import { Observable, BehaviorSubject } from 'rxjs/Rx';

class Analyzer {
    dirPath: string;
    encoding: string;    
    files: BehaviorSubject<string> = new BehaviorSubject('index');

    constructor(dirPath: string, encoding: string = 'utf8') {
        this.dirPath = dirPath;
        this.encoding = encoding;

        this.scanFiles();
    }

    scanFiles(): void {
        this.files.subscribe({
            next: filename => {
                const ast = this.getAstFromFile(resolve(this.dirPath, filename) + '.js');

                ast.subscribe({
                    next: (value) => {
                        console.log(`==== AST for [${filename}]...`);
                        console.log(value);
                    },
                    error: (error) => {
                        console.error(error);
                    },
                    complete: () => console.log('==== ...Completed')
                });
            },
            complete: () => console.log('==== All files have been processed')
        });
    }

    getAstFromFile(filename: string): Observable<babelTypes.File> {
        return Observable
            .of(readFileSync(filename, this.encoding))
            .map(code =>                 
                babylon.parse(code, {
                    allowImportExportEverywhere: true,
                    sourceFilename: filename,
                    sourceType: 'module'
                })
            );    
    }
}

const analyzer = new Analyzer('./examples/fn/01/');