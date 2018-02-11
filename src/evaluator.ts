import * as jscodeshift from 'jscodeshift';
import { Observable, Subject } from 'rxjs/Rx';
import { File } from 'babel-types';
import Stream from './stream';
import Logger from './logger';
import Crawler, { IModule } from './crawler';

export default class Evaluator extends Stream<IModule> {
    crawler: Crawler
    evaluatedAstSubject: Subject<File>

    constructor(logger: Logger, crawler: Crawler) {
        super(logger, 'Evaluating modules');
        this.crawler = crawler;
        this.evaluatedAstSubject = new Subject<File>();
    }

    init(): void { 
        this.crawler.init();
    }

    get(): Observable<IModule> { 
        return this.crawler
            .get()
            .map((module: IModule) => this.enrich(module));
    }

    enrich(module: IModule): IModule {
        this.logger.log(`Evaluating`, module.fullPath);

        const collection = jscodeshift(module.ast);
        collection.markFunctions();
        collection.shake();

        this.logger.log(`Output:`, collection.toSource());
        this.logger.log(`Evaluation DONE`);

        return module;
    }

}
