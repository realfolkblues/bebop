import * as babelTypes from 'babel-types';
import { Observable, Subject } from 'rxjs/Rx';
import * as jscodeshift from 'jscodeshift';
import Crawler from './crawler';

export default class Scanner {
    astStream: Observable<babelTypes.File>

    constructor(crawler: Crawler) { 
        this.astStream = crawler.getASTStream();
    }

    /**
     * Launch AST stream analysis
     */
    scanASTStream(astStream: Observable<babelTypes.File> = this.astStream): Subject<babelTypes.File> {
        const astStreamModded: Subject<babelTypes.File> = new Subject<babelTypes.File>();

        astStream.subscribe({
            next: (ast: babelTypes.File) => {
                const astCollectionOriginal: jscodeshift.Collection = jscodeshift(ast);
                const astModded: babelTypes.File = this.scanASTCollection(astCollectionOriginal).getAST();

                astStreamModded.next(astModded);
            }, 
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Scanning completed');
            }
        });

        return astStreamModded;
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
                        .filter(nodePath => 
                            this.isDeclaration(nodePath) && nodePath.id && nodePath.id.name && nodePath.id.name === identifierName
                        )
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

    start(): void {
        const astStreamCrossModule: Observable<babelTypes.File> = this.scanASTStream().repeat(1);

        astStreamCrossModule.subscribe({
            next: (ast: babelTypes.File) => {
                jscodeshift(ast)
                    .find(jscodeshift.ImportDeclaration)
                    .forEach(nodePath => {
                        console.info(nodePath.node)
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
     * Verify if nodePath has type FunctionDeclaration or VariableDeclarator, hence is a declaration with a child Identifier.
     * @param nodePath 
     */
    isDeclaration(nodePath: jscodeshift.NodePath): boolean {
        if (nodePath && nodePath.node && nodePath.node.type && (nodePath.node.type == jscodeshift.VariableDeclarator || nodePath.node.type == jscodeshift.FunctionDeclaration)) {
            return true;
        }

        return false;
    }
}