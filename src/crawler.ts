import { readFileSync } from 'fs';
import { Observable, Subject} from 'rxjs';
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

    getObeservable() { 
        const self = this;

        const astStream = this.filesSubject
            .map((dep: IResolverModule) => this.resolver.resolve(dep))
            .map((fullPath: string) => (
                <ICrawlerModule>{
                    code: readFileSync(fullPath, this.encoding),
                    fullPath
                }
            ))
            .map((module: ICrawlerModule) => this.getAST(module))
            .share();

        astStream.subscribe(ast => {
            jscodeshift(ast)
                .find(jscodeshift.ImportDeclaration)
                .forEach(function (node) {
                    const dependency: IResolverModule = {
                        id: node.value.source.value,
                        context: node.value.loc.filename,
                        isFileContext: true
                    };

                    self.filesSubject.next(dependency);
                });

        }, err => {
            console.log(err);
        }, () => {
            console.log('end');
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
