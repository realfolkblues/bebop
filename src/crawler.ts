import { readFileSync } from 'fs';
import { dirname } from 'path';
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

    getASTStream() { 
        const self = this;

        const astStream: Observable<babelTypes.File> = this.filesSubject
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
                jscodeshift(ast)
                    .find(jscodeshift.ImportDeclaration)
                    .forEach((nodePath) => {
                        const dependency: IResolverModule = {
                            id: nodePath.value.source.value,
                            context: dirname(nodePath.value.loc.filename),
                        };

                        self.filesSubject.next(dependency);
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
