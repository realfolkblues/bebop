import { join } from 'path';
import Monitor from './monitor';
import Resolver from './resolver';
import Crawler from './crawler';
import Evaluator from './evaluator';
import registerUtils from './jscodeshift-util';
import Inspector from './inspector';
import * as logger from './logger';

console.log('== BEGIN ============================================================');

registerUtils();

const cwd = process.cwd();
const entryPointPath = process.env.npm_config_target_path || './examples/fn/01/index.js';
const entryPointFullPath = join(cwd, entryPointPath);

const resolver = new Resolver(cwd);
const monitor = new Monitor<string>();
const crawler = new Crawler(resolver, monitor, entryPointFullPath);
const inspector = new Inspector();
const evaluator = new Evaluator(crawler, inspector);

const stream = evaluator.get();

stream.subscribe({
    next: (param: any) => {
        // console.log(param);
    },
    error: (err: Error) => {
        logger.error(err);
    },
    complete: () => {
        logger.log('== END ==============================================================');
    }
});

evaluator.init();
