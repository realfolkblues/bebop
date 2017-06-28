import { readFileSync } from 'fs';
import { Observable, Subject } from 'rxjs/Rx';
import * as babylon from 'babylon';
import * as babelTypes from 'babel-types';
import * as jscodeshift from 'jscodeshift';
import { IResolverModule, Resolver } from './resolver';

export interface ICrawlerModule { 
    code: string,
    fullPath: string
}

export default class Crawler { 
    encoding: string
    entryPoint: string
    resolver: Resolver
    filesSubject: Subject<IResolverModule>

    constructor(entryPoint: string, encoding: string = 'utf8') { 
        this.entryPoint = entryPoint;
        this.encoding = encoding;
        this.resolver = new Resolver();
        this.filesSubject = new Subject<IResolverModule>();
    }

    getObeservable() { 
        const self = this;

        const astStream = this.filesSubject
            .map((dep: IResolverModule) => this.resolver.resolve(dep))
            .map((fullPath: string) => (
                <ICrawlerModule>{
                    code: readFileSync(fullPath, this.encoding),
                    fullPath
                }
            ))
            .map((module: ICrawlerModule) => this.getAST(module))
            .share();

        astStream.subscribe({
            next: (ast: babelTypes.File) => {
                const astCollection: any = jscodeshift(ast);
                const invokedFn: Subject<any> = new Subject<any>();

                invokedFn.subscribe({
                    next: (value) => {
                        console.log('Invoked [' + value + ']');
                    },
                    error: (err: Error) => {
                        console.error(err);
                    }
                });

                astCollection
                    .find(jscodeshift.ImportDeclaration)
                    .forEach((nodePath) => {
                        const dependency: IResolverModule = {
                            id: nodePath.value.source.value,
                            context: nodePath.value.loc.filename,
                            isFileContext: true
                        };

                        self.filesSubject.next(dependency);
                    });

                astCollection
                    .find(jscodeshift.CallExpression, {
                        callee: {
                            type: 'Identifier'
                        }
                    })
                    .forEach((nodePath) => {
                        invokedFn.next(nodePath.value.callee.name);
                    });
            }, 
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('end');
            }
        });

        return astStream;
    }

    start() { 
        this.filesSubject.next(<IResolverModule>{
            id: this.entryPoint
        });
    }

    getAST(module: ICrawlerModule) { 
        return babylon.parse(module.code, <babylon.BabylonOptions>{
            allowImportExportEverywhere: true,
            sourceFilename: module.fullPath,
            sourceType: 'module'
        })  
    }

}
