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
                const astCollectionMod: jscodeshift.Collection = this.scanInvokedFn(jscodeshift(ast));
                const astCollectionClean: jscodeshift.Collection = this.epurateDeclaredFn(astCollectionMod);
                this.convertToSource(astCollectionClean);
            }, 
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('end');
            }
        });
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

    epurateDeclaredFn(astCollection: jscodeshift.Collection): jscodeshift.Collection {
        return astCollection
            .find(jscodeshift.FunctionDeclaration)
            .forEach(nodePath => {
                if (!nodePath.references) {
                    if (nodePath.parent.value.type === 'ExportNamedDeclaration') {
                        nodePath.parent.replace();
                    } else {
                        nodePath.replace();
                    }
                }
            });
    }

    convertToSource(astCollection: jscodeshift.Collection): void {
        console.log('=====================');
        console.info(astCollection.toSource());
    }
}