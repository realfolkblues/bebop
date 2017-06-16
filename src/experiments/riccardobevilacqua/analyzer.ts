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

        this.createDepTree();
    }

    createDepTree() {
        this.files.subscribe(filename => {
            this.analyzeFile(resolve(this.dirPath, filename) + '.js');
        });

        return this;
    }

    analyzeFile(filename: string) {
        const readFileAsObservable = Observable.bindNodeCallback((
            path: string,
            encoding: string,
            callback: (error: Error, buffer: Buffer) => void
        ) => readFile(path, encoding, callback));

        const nodes = readFileAsObservable(filename, this.encoding)
            .flatMap(codeBuffer => {
                const codeAsObservable = Observable.bindNodeCallback((
                    code: Buffer,
                    callback: (error: Error, file: babelTypes.File) => void
                ) => {
                        const decoder = new StringDecoder(this.encoding);
                        
                        return babylon.parse(decoder.write(codeBuffer), {
                            allowImportExportEverywhere: true,
                            sourceFilename: filename,
                            sourceType: 'module'
                        });
                    }
                );

                return codeAsObservable(codeBuffer);
            }).share();
        
    }
}

const analyzer = new Analyzer('./examples/fn/01/');