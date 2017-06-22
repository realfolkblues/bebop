
import * as fs from 'fs';
import * as Rx from 'rxjs';
import * as babylon from 'babylon';
import * as babelTypes from 'babel-types';
import * as jscodeshift from 'jscodeshift';
import { IResolverModule, Resolver } from './resolver';

export interface ICrawlerModule { 
    code: string,
    fullPath: string
}

export default class Crawler { 
    entryPoint: string
    resolver: Resolver
    filesSubject: Rx.Subject<babelTypes.File>

    constructor(entryPoint: string) { 
        this.entryPoint = entryPoint;
        this.resolver = new Resolver();
        this.filesSubject = new Rx.Subject();
    }

    getObeservable() { 
        const that = this;

        const astStream = this.filesSubject
            .map((dep: IResolverModule) => this.resolver.resolve(dep))
            .map((fullPath: string) => ({ code: fs.readFileSync(fullPath, 'utf8'), fullPath }))
            .map((module: ICrawlerModule) => this.getAST(module))
            .share();

        astStream.subscribe(ast => {
            jscodeshift(ast)
                .find(jscodeshift.ImportDeclaration)
                .forEach(function (node) {
                    const dependency = {
                        id: node.value.source.value,
                        context: node.value.loc.filename,
                        isFileContext: true
                    };

                    that.filesSubject.next(dependency);
                });

        }, err => {
            console.log(err);
        }, () => {
            console.log('end');
        });

        return astStream;
    }

    start() { 
        this.filesSubject.next({
            id: this.entryPoint
        });
    }

    getAST(module: ICrawlerModule) { 
        return babylon.parse(module.code, {
            allowImportExportEverywhere: true,
            sourceFilename: module.fullPath,
            sourceType: 'module'
        })  
    }

}
