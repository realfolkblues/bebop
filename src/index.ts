
import Crawler from './crawler';
import Scanner from './scanner';
import Evaluator from './evaluator';
import registerUtils from './jscodeshift-util';

registerUtils();

console.log('== BEGIN ============================================================');
const cwd = process.cwd();
const targetPath = process.env.npm_config_target_path || './examples/fn/01/index.js';
const crawler = new Crawler(targetPath);
const scanner = new Scanner(crawler);
const evaluator = new Evaluator(scanner);

const evaluatedASTStream = evaluator.getEvaluatedASTStream();

evaluatedASTStream.subscribe(ast => {
    // console.log(ast);
});

evaluator.start();
console.log('== END ==============================================================');
