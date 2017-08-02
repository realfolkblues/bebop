import * as babelTypes from 'babel-types';
import { Observable, Subject } from 'rxjs/Rx';
import * as jscodeshift from 'jscodeshift';
import Crawler from './crawler';

export default class Scanner {
    astStream: Observable<babelTypes.File>
    astStreamModded: Subject<babelTypes.File> = new Subject<babelTypes.File>();

    constructor(crawler: Crawler) { 
        this.astStream = crawler.getASTStream();
    }

    /**
     * Launch AST stream analysis
     */
    scanASTStream(): Subject<babelTypes.File> {
        this.astStream.subscribe({
            next: (ast: babelTypes.File) => {
                const astCollectionOriginal: jscodeshift.Collection = jscodeshift(ast);
                const astModded: babelTypes.File = this.scanASTCollection(astCollectionOriginal).getAST();

                this.astStreamModded.next(astModded);
            }, 
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Scanning completed');
            }
        });

        return this.astStreamModded;
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

    /**
     * Verify if nodePath having an identifier child represents a declaration.
     * @param nodePath 
     */
    isDeclaration(nodePath: jscodeshift.NodePath): boolean {
        if (nodePath && nodePath.node && nodePath.node.type && (nodePath.node.type == jscodeshift.VariableDeclarator || nodePath.node.type == jscodeshift.FunctionDeclaration)) {
            return true;
        }

        return false;
    }
}