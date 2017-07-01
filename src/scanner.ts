import * as babelTypes from 'babel-types';
import { Observable, Subject } from 'rxjs/Rx';
import * as jscodeshift from 'jscodeshift';

export default class Scanner {
    constructor(astStream: Observable<babelTypes.File>) { 
        this.subscribeAstStream(astStream);
    }

    subscribeAstStream(astStream: Observable<babelTypes.File>): void {
        astStream.subscribe({
            next: (ast: babelTypes.File) => {
                this.scanInvokedFn(ast);
            }, 
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('end');
            }
        });
    }

    scanInvokedFn(ast: babelTypes.File): jscodeshift.Collection {
        const astCollection: jscodeshift.Collection = jscodeshift(ast);
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

                        console.info(nodePath);
                    });
            },
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Invoked functions stream completed');
            }
        });

        const invokedFnCollection: jscodeshift.Collection = astCollection
            .find(jscodeshift.CallExpression, {
                callee: {
                    type: 'Identifier'
                }
            });

        invokedFnCollection.forEach(nodePath => {
            invokedFn.next(nodePath.value.callee.name); 
        });

        return astCollection;
    }
}