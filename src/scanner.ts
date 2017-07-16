import * as babelTypes from 'babel-types';
import { Observable, Subject } from 'rxjs/Rx';
import * as jscodeshift from 'jscodeshift';

export default class Scanner {
    astStream: Observable<babelTypes.File>
    astStreamModded: Subject<babelTypes.File> = new Subject<babelTypes.File>();

    constructor(astStream: Observable<babelTypes.File>) { 
        this.astStream = astStream;
        this.scanASTStream();
    }

    scanASTStream(): void {
        this.astStream.subscribe({
            next: (ast: babelTypes.File) => {
                const astCollectionOriginal: jscodeshift.Collection = jscodeshift(ast);
                const astModded = this.scanASTCollection(astCollectionOriginal).getAST();

                this.astStreamModded.next(astModded);
            }, 
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Scanning completed');
            }
        });
    }

    scanASTCollection(astCollection: jscodeshift.Collection): jscodeshift.Collection {
        const identifiers: Subject<jscodeshift.Identifier> = new Subject<jscodeshift.Identifier>();

        identifiers.subscribe({
            next: (identifierNodePath) => {
                const identifierName = identifierNodePath.node.name;

                if (!this.isDeclaration(identifierNodePath.parent)) {
                    astCollection
                        .find(jscodeshift.FunctionDeclaration, {
                            id: {
                                name: identifierName
                            }
                        })
                        .forEach(nodePath => {
                            if (parseInt(nodePath['references']) > -1) {
                                nodePath.references++;
                            } else {
                                nodePath['references'] = 1;
                            }
                        });
                        
                    astCollection
                        .find(jscodeshift.VariableDeclarator, {
                            id: {
                                name: identifierName
                            }
                        })
                        .forEach(nodePath => {
                            if (parseInt(nodePath['references']) > -1) {
                                nodePath.references++;
                            } else {
                                nodePath['references'] = 1;
                            }
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

    getASTStream(): any {
        return this.astStreamModded;
    }

    isDeclaration(nodePath: jscodeshift.NodePath): boolean {
        if (nodePath && nodePath.node && nodePath.node.type && (nodePath.node.type == jscodeshift.VariableDeclarator || nodePath.node.type == jscodeshift.FunctionDeclaration)) {
            return true;
        }

        return false;
    }
}