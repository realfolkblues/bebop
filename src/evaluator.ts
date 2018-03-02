import * as jscodeshift from 'jscodeshift';
import * as estree from 'estree';
import { NodeCollection } from './nodeCollection';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import Logger from './logger';
import Crawler, { IModule } from './crawler';

export default class Evaluator extends Stream<IModule> {
    crawler: Crawler

    constructor(logger: Logger, crawler: Crawler) {
        super(logger, 'Evaluating modules');
        this.crawler = crawler;
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
        this.logger.log(`Evaluating ${module.fullPath}`);

        const collection: NodeCollection = new NodeCollection(module.ast);
        let astContent: estree.Node[] = collection.get();

        // const collection = jscodeshift(module.ast);
        // collection.markFunctions();
        // collection.shake();

        // this.logger.log(`Output: \n\r${collection.toSource()}`);
        this.logger.log(`Evaluation DONE`);

        return module;
    }

}
