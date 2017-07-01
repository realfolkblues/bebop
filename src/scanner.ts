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

    scanInvokedFn(ast: babelTypes.File): any {
        const invokedFn: Subject<string> = new Subject<string>();

        invokedFn.subscribe({
            next: (value) => {
                console.log('Invoked [' + value + ']');
            },
            error: (err: Error) => {
                console.error(err);
            }
        });

        jscodeshift(ast)
            .find(jscodeshift.CallExpression, {
                callee: {
                    type: 'Identifier'
                }
            })
            .forEach((nodePath) => {
                invokedFn.next(nodePath.value.callee.name);
            });
    }
}