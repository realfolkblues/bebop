import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { Observable, Subject } from 'rxjs/Rx';
import * as babylon from 'babylon';
import * as babelTypes from 'babel-types';
import * as jscodeshift from 'jscodeshift';
import { IResolverModule, Resolver } from './resolver';

export interface ICrawlerModule { 
    code: string,
    fullPath: string
}

export interface IMonitorModule {
    fullPath: string,
    processed: boolean
}

export default class Crawler { 
    astStream: Observable<babelTypes.File>
    crawlerModuleStream: Observable<ICrawlerModule>
    encoding: string
    entryPoint: string
    filesStream: Subject<IResolverModule> = new Subject<IResolverModule>()
    resolver: Resolver = new Resolver()
    sourceDir: string
    stack: IMonitorModule[] = []

    constructor(entryPoint: string, encoding: string = 'utf8') {
        console.log('Crawler init');
        this.entryPoint = entryPoint;
        this.sourceDir = dirname(resolve(entryPoint));
        this.encoding = encoding;
        console.log('Folder ['  + this.sourceDir + ']');
    }

    discoverDependencies(): void {
        this.astStream.subscribe({
            next: (ast: babelTypes.File) => {
                jscodeshift(ast)
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
        this.crawlerModuleStream = this.filesStream
            .asObservable()
            .map((dep: IResolverModule) => this.resolver.resolve(dep))
            .map((fullPath: string): ICrawlerModule => {
                console.log('Processing file [' + fullPath + ']');
                this.stack.push({
                    fullPath,
                    processed: false
                });
                
                return <ICrawlerModule>{
                    code: readFileSync(fullPath, this.encoding),
                    fullPath
                }
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

    getASTStream(): Observable<babelTypes.File> {
        this.discoverFiles();
        this.astStream = this.crawlerModuleStream
            .map((module: ICrawlerModule): babelTypes.File => {
                if (typeof this.getMonitorModule(module.fullPath) === 'undefined') {
                    console.log('Obtaining AST for [' + module.fullPath + ']');
                    return this.getAST(module);
                }
            });
        this.discoverDependencies();

        return this.astStream;
    }

    getMonitorModule(fullPath: string): IMonitorModule {
        return this.stack.find((monitorModule) => monitorModule.fullPath === fullPath);
    }

    start(): void { 
        console.log('Crawler start');
        const astStream = this.filesStream
            .asObservable()
            .map((dep: IResolverModule) => this.resolver.resolve(dep))
            .map((fullPath: string): ICrawlerModule => {
                console.log('Processing file [' + fullPath + ']');
                                
                return <ICrawlerModule>{
                    code: readFileSync(fullPath, this.encoding),
                    fullPath
                }
            })
            .map((module: ICrawlerModule): babelTypes.File => {
                console.log('Obtaining AST for [' + module.fullPath + ']');
                return this.getAST(module);            
            })
            .share();
        
        astStream.subscribe({
            next: (ast) => {
                console.log('Detected AST');
            }
        });

        this.filesStream.next(<IResolverModule>{
            id: this.entryPoint
        });
    }
}
