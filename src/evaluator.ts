import * as estree from 'estree';
import Inspector from './inspector';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import Logger from './logger';
import Crawler, { IModule } from './crawler';
import { visitAST, markAST, shakeAST, astToSource } from './util';

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

        module.ast = shakeAST(markAST(module.ast));
        
        this.logger.log(`Output:\r\n`, astToSource(module.ast));
        this.logger.log(`Evaluation DONE`);

        return module;
    }

}
