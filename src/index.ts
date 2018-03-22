import { join } from 'path';
import Logger from './logger';
import Monitor from './monitor';
import Resolver from './resolver';
import Crawler from './crawler';
import Evaluator from './evaluator';
import registerUtils from './jscodeshift-util';

console.log('== BEGIN ============================================================');

registerUtils();

const cwd = process.cwd();
const entryPointPath = process.env.npm_config_target_path || './examples/fn/01/index.js';
const entryPointFullPath = join(cwd, entryPointPath);

const logger = new Logger();
const resolver = new Resolver(cwd);
const monitor = new Monitor<string>(logger);
const crawler = new Crawler(logger, resolver, monitor, entryPointFullPath);
const evaluator = new Evaluator(logger, crawler);

const stream = evaluator.get();

stream.subscribe({
    next: (param: any) => {
        // console.log(param);
    },
    error: (err: Error) => {
        console.error(err);
    },
    complete: () => {
        console.log('== END ==============================================================');
    }
});

evaluator.init();
