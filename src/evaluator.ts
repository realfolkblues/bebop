import * as jscodeshift from 'jscodeshift';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import Crawler, { IModule } from './crawler';
import Inspector, { INode } from './inspector';
import * as logger from './logger';

export default class Evaluator extends Stream<IModule> {
    crawler: Crawler
    inspector: Inspector

    constructor(crawler: Crawler, inspector: Inspector) {
        super();
        this.crawler = crawler;
        this.inspector = inspector;

        logger.debug('Instantiating evaluator...');
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
        logger.info(`Evaluating ${module.fullPath}...`);

        this.inspector.init(module.ast);
        logger.debug(`Nodes in collection: ${this.inspector.collection.length}`);
        this.inspector.comb();
        this.inspector.shake();
        logger.explode(...this.inspector.collection);

        // logger.debug('Output:');
        // logger.debug(collection.toSource());

        return module;
    }

}
