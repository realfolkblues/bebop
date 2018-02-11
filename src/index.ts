import Logger from './logger';
import Monitor from './monitor';
import Resolver, { IFileContext } from './resolver';
import Crawler from './crawler';
// import Scanner from './scanner';
import Evaluator from './evaluator';
import registerUtils from './jscodeshift-util';

const cwd = process.cwd();
const entryPoint = process.env.npm_config_target_path || './examples/fn/01/index.js';
registerUtils();

console.log('== BEGIN ============================================================');

const logger = new Logger();
const resolver = new Resolver();
const monitor = new Monitor<IFileContext>(logger);
const crawler = new Crawler(logger, resolver, monitor, entryPoint);
// const scanner = new Scanner(crawler);
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
