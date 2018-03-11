import * as jscodeshift from 'jscodeshift';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import Logger from './logger';
import Crawler, { IModule } from './crawler';

export default class Evaluator extends Stream<IModule> {
    crawler: Crawler

    constructor(logger: Logger, crawler: Crawler) {
        super(logger);
        this.crawler = crawler;

        this.logger.debug('Instantiating evaluator...');
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
        this.logger.info(`Evaluating ${module.fullPath}...`);

        const collection = jscodeshift(module.ast);
        collection.markFunctions();
        collection.shake();

        this.logger.debug('Output:');
        this.logger.debug(collection.toSource());

        return module;
    }

}
