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

export default class Crawler { 
    encoding: string
    entryPoint: string
    resolver: Resolver = new Resolver()
    filesSubject: Subject<IResolverModule> = new Subject<IResolverModule>()
    pathStream: Observable<string>
    sourceDir: string

    constructor(entryPoint: string, encoding: string = 'utf8') { 
        this.entryPoint = entryPoint;
        this.encoding = encoding;
        this.sourceDir = resolve(dirname(entryPoint));
    }

    getASTStream(): Observable<babelTypes.File> {
        this.pathStream = this.discoverFiles();
        
        const astStream: Observable<babelTypes.File> = this
            .discoverModules()
            .map((module: ICrawlerModule) => this.getAST(module));

        return this.discoverDependencies(astStream);
    }

    discoverFiles(fileStream: Subject<IResolverModule> = this.filesSubject): Observable<string> {
        return fileStream
            .asObservable()
            .map((dep: IResolverModule) => {
                const fullPath: string = this.resolver.resolve(dep);                
                console.log('Crawler discovered file [' + fullPath + ']');
                return fullPath;
            })
            .share();
    }

    discoverModules(pathStream: Observable<string> = this.pathStream): Observable<ICrawlerModule> {
        return pathStream
            .map((fullPath: string) => {
                return <ICrawlerModule>{
                    code: readFileSync(fullPath, this.encoding),
                    fullPath
                }
            })
            .share();
    }

    discoverDependencies(astStream: Observable<babelTypes.File>): Observable<babelTypes.File> {
        astStream.subscribe({
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

        return astStream;
    }

    start(): void { 
        console.log('Crawler started in [' + this.sourceDir + ']');
        this.filesSubject.next(<IResolverModule>{
            id: this.entryPoint
        });
    }

    getAST(module: ICrawlerModule): babelTypes.File { 
        return babylon.parse(module.code, <babylon.BabylonOptions>{
            allowImportExportEverywhere: true,
            sourceFilename: module.fullPath,
            sourceType: 'module'
        });  
    }
}
