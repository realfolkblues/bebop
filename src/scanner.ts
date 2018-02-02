import { dirname, resolve } from 'path';
import * as babelTypes from 'babel-types';
import { BehaviorSubject, Observable, Subject } from 'rxjs/Rx';
import * as jscodeshift from 'jscodeshift';
import { isDeclaration, increaseReference } from './jscodeshift-util';
import { default as Crawler, IASTModule} from './crawler';
import { IResolverModule } from './resolver';

export interface IMonitorModule {
    fullPath: string,
    processed: boolean
}

export default class Scanner {
    astListStream: BehaviorSubject<babelTypes.File[]> = new BehaviorSubject([])
    crawler: Crawler
    inputStream: Observable<babelTypes.File>
    stack: IMonitorModule[] = []

    constructor(crawler: Crawler) { 
        console.log('Scanner init');
        this.crawler = crawler;
    }

    getASTStream(): Observable<IASTModule> {
        console.log('Getting AST stream from crawler');
        const astModuleStream: Observable<IASTModule> = this.crawler.discover();

        const astModuleStreamObserver = astModuleStream
            .subscribe({
                next: (astModule: IASTModule) => {
                    console.log('Scanner received [' + astModule.fullPath + ']');

                    this.stack.push(<IMonitorModule>{
                        fullPath: astModule.fullPath,
                        processed: false
                    });

                    console.log('Stack contains [' + this.stack.length + '] modules');

                    astModule.ast = this.scanDeclaration(astModule).ast;
                    astModule.deps.forEach((dep: IResolverModule) =>
                        this.crawler.filesStream.next(dep)
                    );
                    this.updateStack(astModule.fullPath);

                    console.log('---- STACK  BEGIN ----------');
                    console.info(this.stack);
                    console.log('---- STACK  END ------------');

                    if (this.stack.every((item) => item.processed)) {
                        this.crawler.filesStream.complete();
                    }
                },
                error: (err: Error) => {
                    console.error(err);
                },
                complete: () => {
                    console.log('Scanner completed');
                }
            });

        return astModuleStream;
    }

    /**
     * Add number of references to declarations in a given AST
     * @param ast
     * @param identifierName
     */
    scanDeclaration(astModule: IASTModule, identifierName: string = ''): IASTModule {
        const astCollection: jscodeshift.Collection = jscodeshift(astModule.ast);
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
        
        astModule.ast = astCollection.getAST();
        return astModule;
    }

    start(): void {
        console.log('Scanner start');
        this.crawler.start();
    }

    updateStack(fullPath: string): void {
        this.stack = this.stack.map((item: IMonitorModule) => {
            if (item.fullPath === fullPath) {
                item.processed = true;
            }
            return item;
        });
    } 
}
