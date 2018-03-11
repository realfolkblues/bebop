import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import Logger from './logger';
import Monitor from './monitor';
import * as acorn from 'acorn';
import * as estree from 'estree';
import { visitAST } from './recast-util';
import Resolver, { IFileContext, IFileInfo } from './resolver';

export interface IFile extends IFileInfo {
    content: string
}

export interface IModule extends IFile {
    ast: estree.Program
}

export default class Crawler extends Stream<IModule> { 
    readonly logger: Logger
    readonly resolver: Resolver
    readonly monitor: Monitor<string>
    readonly entryPoint: string
    readonly encoding: string
    readonly stream: Subject<IFileContext>
    observable: Observable<IModule>

    constructor(logger: Logger, resolver: Resolver, monitor: Monitor<string>, entryPoint: string, encoding: string = 'utf8') {
        super(logger);

        this.resolver = resolver;
        this.monitor = monitor;
        this.entryPoint = entryPoint;
        this.encoding = encoding;
        this.stream = new Subject<IFileContext>();

        this.logger.debug('Instantiating crawler...');
    }

    init(): void {
        this.logger.info(`Crawling into ${this.entryPoint}...`);

        const entryContext = {
            id: this.entryPoint,
            base: ''
        };

        const entryFullPath = this.resolve(entryContext);

        this.monitor.add(entryFullPath.fullPath);
        this.stream.next(entryContext);
    }

    get(): Observable<IModule> {
        const observable = this.stream
            .asObservable()
            .map((dependency: IFileContext) => this.resolve(dependency))
            .map((info: IFileInfo) => this.readFile(info))
            .map((file: IFile) => this.getModule(file))
            .share();
        
        this.monitorize(observable);
        return observable;
    }

    protected monitorize(observable: Observable<IModule>): void {
        observable.subscribe({
            next: (module: IModule) => {
                this.monitor.logStatus();
                this.monitor.consume(module.fullPath);

                this.getDeps(module)
                    .map((dependency: IFileContext) => this.resolve(dependency))   
                    .map((info: IFileInfo) => { 
                        this.logger.info(`Crawling into ${this.entryPoint}...`);
                        this.monitor.add(info.fullPath);
                        this.stream.next(info.context); 
                    });
                
                setTimeout(() => {
                    if (this.monitor.isConsumed) {
                        this.stream.complete();
                    }
                });
            },
            complete: () => {
                this.monitor.logStatus();
            }
        });
    }

    protected resolve(dependency: IFileContext): IFileInfo { 
        return this.resolver.resolve(dependency);
    }

    protected readFile(info: IFileInfo): IFile {
        this.logger.log(`Reading file ${info.fullPath}...`);

        return <IFile>Object.assign({}, info, {
            content: readFileSync(info.fullPath, this.encoding),
        });
    }

    protected getModule(file: IFile): IModule { 
        this.logger.log(`Getting AST for ${file.fullPath}...`);

        return <IModule>Object.assign({}, file, {
            ast: this.getAST(file)
        });
    }

    protected getAST(file: IFile): estree.Program {
        return acorn.parse(file.content, <acorn.Options>{
            ecmaVersion: 6,
            sourceType: 'module',
            allowImportExportEverywhere: true,
            locations: true,
            sourceFile: file.fullPath
        });
    }

    protected getDeps(module: IModule): IFileContext[] { 
        const deps: IFileContext[] = [];
        this.logger.log(`Looking for deps in ${module.fullPath}...`);

        const importDeclarationCallback = (nodePath): void => {
            if (nodePath && nodePath.value && nodePath.value.source && nodePath.value.source.value && nodePath.value.loc && nodePath.value.loc.source) {
                deps.push({
                    id: nodePath.value.source.value,
                    base: dirname(nodePath.value.loc.source)
                });
            }
        };

        visitAST(module.ast, 'ImportDeclaration', importDeclarationCallback);
        this.logger.debug(`-> ${deps.length} deps found`);

        return deps;          
    }
}
