import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import Logger from './logger';
import Monitor from './monitor';
import * as acorn from 'acorn';
import * as estree from 'estree';
import { visitAST, getDependencyId, getDependencyFolder } from './util';
import Resolver, { IFileContext, IFileInfo } from './resolver';

export interface IFile extends IFileInfo {
    content: string
}

export interface IPartialModule extends IFile {
    ast: estree.Program
}

export interface IModule extends IPartialModule {
    deps: IFileContext[]
}

export default class Crawler extends Stream<IModule> { 
    readonly logger: Logger
    readonly resolver: Resolver
    readonly monitor: Monitor<IFileContext>
    readonly entryPoint: string
    readonly encoding: string
    readonly stream: Subject<IFileContext>
    

    constructor(logger: Logger, resolver: Resolver, monitor: Monitor<IFileContext>, entryPoint: string, encoding: string = 'utf8') {
        super(logger, 'Crawling files');

        this.resolver = resolver;
        this.monitor = monitor;
        this.entryPoint = entryPoint;
        this.encoding = encoding;
        this.stream = new Subject<IFileContext>();

        this.logger.log(`Entry point: ${this.entryPoint}`);
    }

    init(): void {
        this.logger.debug('Start crawling');
        this.check();

        this.stream.next(this.monitor.add({
            id: this.entryPoint,
            base: ''
        }));
    }

    get(): Observable<IModule> {
        return this.stream
            .asObservable()
            .map((dependency: IFileContext) => this.resolve(dependency))
            .map((info: IFileInfo) => this.readFile(info))
            .map((file: IFile) => this.getPartialModule(file))
            .map((partialModule: IPartialModule) => this.getModule(partialModule))
            .map((module: IModule) => this.recurse(module))
            .share();
    }

    protected check(): void {
        const self = this;

        this.stream.subscribe({
            next: () => {
                self.monitor.logStatus();

                setTimeout(() => {
                    if (self.monitor.isConsumed) {
                        self.stream.complete();
                    }
                });
            }
        });
    }

    protected resolve(dependency: IFileContext): IFileInfo { 
        return this.resolver.resolve(dependency);
    }

    protected readFile(info: IFileInfo): IFile {
        this.logger.debug(`Processing ${info.fullPath}`);

        return <IFile>Object.assign({}, info, {
            content: readFileSync(info.fullPath, this.encoding),
        });
    }

    protected getPartialModule(file: IFile): IPartialModule { 
        this.logger.debug(`Obtaining AST for ${file.fullPath}`);

        return <IPartialModule>Object.assign({}, file, {
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

    protected getModule(partialModule: IPartialModule): IModule {
        const deps: IFileContext[] = [];

        const importDeclarationCallback = (node): void => {
            const dependencyId = getDependencyId(node);
            const dependencyFolder = getDependencyFolder(node);

            if (dependencyId.length > 0 && dependencyFolder.length > 0) {
                deps.push({
                    id: dependencyId,
                    base: dependencyFolder
                });
            }
        };

        visitAST(partialModule.ast, 'ImportDeclaration', importDeclarationCallback);

        if (deps.length > 0) {
            this.logger.debug('Dependencies:', deps);
        } else { 
            this.logger.debug('No dependency found');
        }

        return <IModule>Object.assign({}, partialModule, {
            deps
        });
    }

    protected recurse(module: IModule): IModule { 
        module.deps.forEach((dependency: IFileContext) => this.stream.next(this.monitor.add(dependency)));
        this.monitor.consume(module.context);
        return module;
    }
}
