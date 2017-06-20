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
import { StringDecoder } from 'string_decoder';
import * as babylon from 'babylon';
import * as babelTypes from 'babel-types';
import { Observable, Subject, BehaviorSubject } from 'rxjs/Rx';

class Analyzer {
    dirPath: string;
    encoding: string;    
    files: BehaviorSubject<string> = new BehaviorSubject('index');

    constructor(dirPath: string, encoding: string = 'utf8') {
        this.dirPath = dirPath;
        this.encoding = encoding;

        this.files.subscribe(filename => {
            const fileFullPath = resolve(this.dirPath, filename) + '.js';
            const babylonAst = this.getBabylonAstFromFile(fileFullPath);

            babylonAst.subscribe({
                next: (value) => {
                    console.log('==== BABYLON AST');
                    console.log(value);
                },
                error: (error) => {
                    console.error(error);
                },
                complete: () => console.log('==== Babylon AST Complete!')
            });
        });
    }

    getBabylonAstFromFile(filename: string): Observable<any> {
        const readFileAsObservable = Observable.bindNodeCallback((
            path: string,
            encoding: string,
            callback: (error: Error, buffer: Buffer) => void
        ) => readFile(path, encoding, callback));

        const tree = readFileAsObservable(filename, this.encoding)
            .flatMap(buffer => {                
                const decoder = new StringDecoder(this.encoding);
                const ast = babylon.parse(decoder.write(buffer), {
                    allowImportExportEverywhere: true,
                    sourceFilename: filename,
                    sourceType: 'module'
                });

                return Observable.of(ast);
            });

        return tree;        
    }
}

const analyzer = new Analyzer('./examples/fn/01/');