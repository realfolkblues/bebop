import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import Monitor from './monitor';
import Resolver from './resolver';
import * as acorn from 'acorn';
import * as estree from 'estree';
import { visitAST } from './recast-util';
import * as logger from './logger';

export interface IFile {
    fullPath: string
    content: string
}

export interface IModule extends IFile {
    ast: estree.Program
}

export default class Crawler extends Stream<IModule> {
    readonly resolver: Resolver
    readonly monitor: Monitor<string>
    readonly entryPoint: string
    readonly encoding: string
    readonly stream: Subject<string>

    constructor(resolver: Resolver, monitor: Monitor<string>, entryPoint: string, encoding: string = 'utf8') {
        super();

        this.resolver = resolver;
        this.monitor = monitor;
        this.entryPoint = entryPoint;
        this.encoding = encoding;
        this.stream = new Subject<string>();

        logger.debug('Instantiating crawler...');
    }

    init(): void {
        this.crawl(this.entryPoint);
    }

    get(): Observable<IModule> {
        const observable = this.stream
            .asObservable()
            .map((fullPath: string) => this.readFile(fullPath))
            .map((file: IFile) => this.getModule(file))
            .share();

        this.monitorize(observable);
        return observable;
    }

    protected crawl(fullPath: string): void {
        logger.info(`Crawling into ${fullPath}...`);
        this.monitor.add(fullPath);
        this.stream.next(fullPath);
    }

    protected monitorize(observable: Observable<IModule>): void {
        observable.subscribe({
            next: (module: IModule) => {
                this.monitor.logStatus();
                this.monitor.consume(module.fullPath);
                this.getDeps(module).map((fullPath: string) => this.crawl(fullPath));

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

    protected readFile(fullPath: string): IFile {
        logger.log(`Reading file ${fullPath}...`);

        return <IFile>{
            fullPath,
            content: readFileSync(fullPath, this.encoding)
        };
    }

    protected getModule(file: IFile): IModule {
        logger.log(`Getting AST for ${file.fullPath}...`);

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

    protected getDeps(module: IModule): string[] {
        const dependencyFullPaths: string[] = [];
        logger.log(`Looking for deps in ${module.fullPath}...`);

        const importDeclarationCallback = (nodePath): void => {
            if (nodePath && nodePath.value && nodePath.value.source && nodePath.value.source.value && nodePath.value.loc && nodePath.value.loc.source) {
                const dependencyFullPath = this.resolver.resolve(nodePath.value.source.value, dirname(nodePath.value.loc.source));
                dependencyFullPaths.push(dependencyFullPath);
            }
        };

        visitAST(module.ast, 'ImportDeclaration', importDeclarationCallback);
        logger.debug(`-> ${dependencyFullPaths.length} deps found`);

        return dependencyFullPaths;
    }
}
