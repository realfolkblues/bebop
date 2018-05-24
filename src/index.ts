import { join } from 'path';
import Monitor from './monitor';
import Resolver from './resolver';
import Crawler from './crawler';
import Inspector from './inspector';
import registerUtils from './jscodeshift-util';
import * as logger from './logger';

console.log('== BEGIN ============================================================');

registerUtils();

const cwd = process.cwd();
const entryPointPath = process.env.npm_config_target_path || './examples/fn/01/index.js';
const entryPointFullPath = join(cwd, entryPointPath);

const resolver = new Resolver(cwd);
const monitor = new Monitor<string>();
const crawler = new Crawler(resolver, monitor, entryPointFullPath);
const inspector = new Inspector(crawler);

const stream = inspector.get();

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

inspector.init();
