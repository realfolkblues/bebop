import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { Observable, Subject } from 'rxjs/Rx';
import * as babylon from 'babylon';
import * as babelTypes from 'babel-types';
import * as jscodeshift from 'jscodeshift';
import { IResolverModule, Resolver } from './resolver';

export interface ICrawlerModule { 
    code: string,
    fullPath: string,
    processed: boolean
}

export default class Crawler { 
    astStream: Observable<babelTypes.File>
    crawlerModuleStream: Observable<ICrawlerModule>
    encoding: string
    entryPoint: string
    filesSubject: Subject<IResolverModule> = new Subject<IResolverModule>()
    resolver: Resolver = new Resolver()
    sourceDir: string

    constructor(entryPoint: string, encoding: string = 'utf8') { 
        this.entryPoint = entryPoint;
        this.sourceDir = dirname(resolve(entryPoint));
        this.encoding = encoding;
    }

    discoverDependencies(): void {
        this.astStream.subscribe({
            next: (ast: babelTypes.File) => {
                jscodeshift(ast)
                    .find(jscodeshift.ImportDeclaration)
                    .forEach((nodePath) => {
                        const dependency: IResolverModule = {
                            id: nodePath.value.source.value,
                            context: dirname(nodePath.value.loc.filename),
                        };

                        this.filesSubject.next(dependency);
                    });
            }, 
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('AST stream completed');
            }
        });
    }

    getAST(module: ICrawlerModule): babelTypes.File { 
        return babylon.parse(module.code, <babylon.BabylonOptions>{
            allowImportExportEverywhere: true,
            sourceFilename: module.fullPath,
            sourceType: 'module'
        });  
    }

    discoverFiles(): void {
        this.crawlerModuleStream = this.filesSubject
            .asObservable()
            .map((dep: IResolverModule) => this.resolver.resolve(dep))
            .map((fullPath: string) => {
                console.log('Processing file [' + fullPath + ']');
                return <ICrawlerModule>{
                    code: readFileSync(fullPath, this.encoding),
                    fullPath,
                    processed: false
                }
            })
            .share();
    }

    getASTStream(): Observable<babelTypes.File> {
        this.discoverFiles();
        this.astStream = this.crawlerModuleStream.map((module: ICrawlerModule) => this.getAST(module));
        this.discoverDependencies();

        return this.astStream;
    }

    start(): void { 
        this.filesSubject.next(<IResolverModule>{
            id: this.entryPoint
        });
    }
}
