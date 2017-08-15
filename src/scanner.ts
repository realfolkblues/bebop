import * as babelTypes from 'babel-types';
import { Observable, Subject } from 'rxjs/Rx';
import * as jscodeshift from 'jscodeshift';
import { isDeclaration, increaseReference } from './jscodeshift-util';
import Crawler from './crawler';

export default class Scanner {
    astStreamInput: Observable<babelTypes.File>

    constructor(crawler: Crawler) { 
        this.astStreamInput = crawler.getASTStream();

        this.scanCrossStream();
    }

    scanCrossStream(): void {
        this.scanASTStream();
        
        this.scanASTStream().subscribe({
            next: (ast: babelTypes.File) => {
                jscodeshift(ast)
                    .find(jscodeshift.FunctionDeclaration)
                    .forEach(nodePath => {
                        console.info(nodePath.node.id.name, nodePath.references);
                    });
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
     * Launch AST stream analysis
     */
    scanASTStream(astStream: Observable<babelTypes.File> = this.astStreamInput): Subject<babelTypes.File> {
        const astStreamOutput: Subject<babelTypes.File> = new Subject<babelTypes.File>();

        astStream.subscribe({
            next: (ast: babelTypes.File) => {
                const astCollectionOriginal: jscodeshift.Collection = jscodeshift(ast);
                const astModded: babelTypes.File = this.scanASTCollection(astCollectionOriginal).getAST();

                astStreamOutput.next(astModded);
            }, 
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Scanning completed');
            }
        });

        return astStreamOutput;
    }

    /**
     * Add number of references to declarations in a given AST Collection
     * @param astCollection 
     */
    scanASTCollection(astCollection: jscodeshift.Collection): jscodeshift.Collection {
        const identifiers: Subject<jscodeshift.Identifier> = new Subject<jscodeshift.Identifier>();

        identifiers.subscribe({
            next: (identifierNodePath) => {
                const identifierName = identifierNodePath.node.name;

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

        astCollection
            .find(jscodeshift.Identifier)
            .forEach(nodePath => {
                identifiers.next(nodePath); 
            });

        return astCollection;
    }
}