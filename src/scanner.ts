import { resolve } from 'path';
import * as babelTypes from 'babel-types';
import { Observable, Subject } from 'rxjs/Rx';
import * as jscodeshift from 'jscodeshift';
import { isDeclaration, increaseReference } from './jscodeshift-util';
import Crawler from './crawler';

export default class Scanner {
    astStreamInput: Observable<babelTypes.File>

    constructor(crawler: Crawler) { 
        this.astStreamInput = crawler.getASTStream();

        this.start();
    }

    /**
     * Launch cross AST stream analysis
     * 
     * >Don't cross the streams.
     * - Egon Spengler
     */
    start(): void {
        const astStreamScanned: Observable<babelTypes.File> = this.astStreamInput.map(ast => this.scanDeclaration(ast));
        
        astStreamScanned.subscribe({
            next: (ast: babelTypes.File) => {
                console.info('== SCANNED', ast[0].value.loc.filename);
            },
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Scanning cross module completed');
            }
        });
    }

    /**
     * Add number of references to declarations in a given AST
     * @param ast
     * @param identifierName
     */
    scanDeclaration(ast: babelTypes.File, identifierName: string = ''): babelTypes.File {
        const astCollection: jscodeshift.Collection = jscodeshift(ast);
        const identifiers: Observable<jscodeshift.Identifier> = Observable.from(astCollection.find(jscodeshift.Identifier).__paths);

        identifiers.subscribe({
            next: (identifierNodePath) => {
                if (identifierName === '') {
                    identifierName = identifierNodePath.node.name;
                }

                if (!isDeclaration(identifierNodePath.parent)) {
                    astCollection
                        .find(jscodeshift.FunctionDeclaration, {
                            id: {
                                name: identifierName
                            }
                        })
                        .forEach(nodePath => {
                            increaseReference(nodePath);
                        });

                    astCollection
                        .find(jscodeshift.VariableDeclarator, {
                            id: {
                                name: identifierName
                            }
                        })
                        .forEach(nodePath => {
                            increaseReference(nodePath);
                        });
                }
            },
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Identifiers stream completed');
            }
        });

        return astCollection.getAST();
    }
}