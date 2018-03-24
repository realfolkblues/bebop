import * as jscodeshift from 'jscodeshift';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import Logger from './logger';
import Crawler, { IModule } from './crawler';
import Inspector, { INode } from './inspector';

export default class Evaluator extends Stream<IModule> {
    crawler: Crawler
    inspector: Inspector

    constructor(logger: Logger, crawler: Crawler, inspector: Inspector) {
        super(logger);
        this.crawler = crawler;
        this.inspector = inspector;

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

        this.inspector.init(module.ast);

        // const collection = jscodeshift(module.ast);
        // collection.markFunctions();
        // collection.shake();

        // this.logger.debug('Output:');
        // this.logger.debug(collection.toSource());

        return module;
    }

}
