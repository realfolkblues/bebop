import * as jscodeshift from 'jscodeshift';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import Crawler, { IModule } from './crawler';
import Collection from './collection';
import Node from './node';
import * as logger from './logger';

export default class Inspector extends Stream<Collection> {
    crawler: Crawler

    constructor(crawler: Crawler) {
        super();
        this.crawler = crawler;

        logger.debug('Instantiating inspector...');
    }

    init(): void {
        this.crawler.init();
    }

    get(): Observable<Collection> {
        return this.crawler
            .get()
            .map((module: IModule) => this.enrich(module));
    }

    enrich(module: IModule): Collection {
        logger.info(`Inspecting AST in ${module.fullPath}...`);

        const collection = new Collection(module);
        collection.prune();
        logger.log('Nodes:', collection.length);
        logger.log('Alive:', collection.getAliveNodes().length);

        return collection;
    }

}
