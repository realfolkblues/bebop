import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { Observable, Subject } from 'rxjs/Rx';
import * as recast from 'recast';
import { visitAST } from './recast-util';
import * as babylon from 'babylon';
import * as babelTypes from 'babel-types';
import { IResolverModule, Resolver } from './resolver';

export interface IASTModule extends ICrawlerModule {
    ast: babelTypes.File,
    deps: IResolverModule[],
    processed: boolean
}

export interface ICrawlerModule {
    code: string,
    fullPath: string
}

export default class Crawler { 
    astStream: Observable<IASTModule>
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

    discover(): Observable<IASTModule> {
        return this.filesStream
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
            .map((astModule: IASTModule): IASTModule => {
                let deps: IResolverModule[] = [];
                const importDeclarationCallback = (nodePath): void => {
                    console.log('Found dependency [' + nodePath.value.source.value + ']');
                    deps.push(<IResolverModule>{
                        id: nodePath.value.source.value,
                        context: dirname(nodePath.value.loc.filename)
                    });
                };

                visitAST(astModule.ast, 'ImportDeclaration', importDeclarationCallback);

                astModule.deps = deps;

                return astModule;                
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

    start(): void { 
        console.log('Crawler start');

        this.filesStream.next(<IResolverModule>{
            id: this.entryPoint
        });
    }
}
