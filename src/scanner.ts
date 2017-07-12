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
                // const astModded = this.scanInvokedFn(astCollectionOriginal).getAST();

                // this.astStreamModded.next(astModded);
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
            next: (nodePath) => {
                const nodeName = nodePath.node.name;
                const nodeScope = nodePath.scope;
                const nodeParent = nodePath.parent;


                console.info('== NODE:', nodeName, ' PARENT ', nodeParent.node.type);
                if (this.isDeclaration(nodeParent)) {
                    console.log('PARENT IS DECLARATION');
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

    scanInvokedFn(astCollection: jscodeshift.Collection): jscodeshift.Collection {
        const invokedFn: Subject<jscodeshift.CallExpression> = new Subject<jscodeshift.CallExpression>();

        invokedFn.subscribe({
            next: (value) => {
                astCollection
                    .find(jscodeshift.FunctionDeclaration, {
                        id: {
                            name: value
                        }
                    })
                    .forEach(nodePath => {
                        if (parseInt(nodePath['references']) > -1) {
                            nodePath.references++;
                        } else {
                            nodePath['references'] = 1;
                        }
                    });
            },
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Invoked functions stream completed');
            }
        });

        const invokedFnCollection: jscodeshift.Collection = this.getInvokedFn(astCollection);

        invokedFnCollection.forEach(nodePath => {
            invokedFn.next(nodePath.value.callee.name); 
        });

        return astCollection;
    }

    getInvokedFn(astCollection: jscodeshift.Collection): jscodeshift.Collection {
        return astCollection
            .find(jscodeshift.CallExpression, {
                callee: {
                    type: 'Identifier'
                }
            });
    }

    getASTStream() {
        return this.astStreamModded;
    }

    isDeclaration(nodePath: jscodeshift.NodePath): boolean {
        if (nodePath && nodePath.node && nodePath.node.type && (nodePath.node.type == jscodeshift.VariableDeclarator || nodePath.node.type == jscodeshift.FunctionDeclaration)) {
            return true;
        }

        return false;
    }
}