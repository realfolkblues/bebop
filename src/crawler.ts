import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { Observable, Subject } from 'rxjs/Rx';
import * as babylon from 'babylon';
import * as babelTypes from 'babel-types';
import * as jscodeshift from 'jscodeshift';
import { IResolverModule, Resolver } from './resolver';

export interface IASTModule extends ICrawlerModule {
    ast: babelTypes.File,
    processed: boolean
}

export interface ICrawlerModule {
    code: string,
    fullPath: string
}

export default class Crawler { 
    astStream: Observable<IASTModule>
    crawlerModuleStream: Observable<ICrawlerModule>
    encoding: string
    entryPoint: string
    filesStream: Subject<IResolverModule> = new Subject<IResolverModule>()
    resolver: Resolver = new Resolver()
    sourceDir: string

    constructor(entryPoint: string, encoding: string = 'utf8') {
        console.log('Crawler init');
        this.entryPoint = entryPoint;
        this.sourceDir = dirname(resolve(entryPoint));
        this.encoding = encoding;
        console.log('Folder ['  + this.sourceDir + ']');
    }

    discoverDependencies(): void {
        this.astStream.subscribe({
            next: (astModule: IASTModule) => {
                jscodeshift(astModule.ast)
                    .find(jscodeshift.ImportDeclaration)
                    .forEach((nodePath) => {
                        console.log('Found dependency [' + nodePath.value.source.value + ']');

                        this.filesStream.next(<IResolverModule>{
                            id: nodePath.value.source.value,
                            context: dirname(nodePath.value.loc.filename)
                        });
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

    discoverFiles(): void {
        this.astStream = this.filesStream
            .asObservable()
            .map((dep: IResolverModule) => this.resolver.resolve(dep))
            .map((fullPath: string): ICrawlerModule => {
                console.log('Processing file [' + fullPath + ']');
                
                return <ICrawlerModule>{
                    code: readFileSync(fullPath, this.encoding),
                    fullPath
                }
            })
            .map((module: ICrawlerModule): IASTModule => {
                console.log('Obtaining AST for [' + module.fullPath + ']');
                                
                return <IASTModule>{
                    ast: this.getAST(module),
                    code: module.code,
                    fullPath: module.fullPath,
                    processed: false
                };
            })
            .share();
    }

    getAST(module: ICrawlerModule): babelTypes.File { 
        return babylon.parse(module.code, <babylon.BabylonOptions>{
            allowImportExportEverywhere: true,
            sourceFilename: module.fullPath,
            sourceType: 'module'
        });  
    }

    getASTStream(): void {
        console.log('Getting AST stream from crawler');
        this.discoverFiles();        
        this.discoverDependencies();
    }

    start(): void { 
        console.log('Crawler start');

        this.filesStream.next(<IResolverModule>{
            id: this.entryPoint
        });
    }
}
