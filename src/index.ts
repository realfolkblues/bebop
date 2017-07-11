
import Crawler from './crawler';
import Scanner from './scanner';
import Epurator from './epurator';

const cwd = process.cwd();
const targetPath = process.env.npm_config_target_path || './examples/fn/01/index.js';
const crawler = new Crawler(targetPath);
const astStream = crawler.getASTStream();
const scanner = new Scanner(astStream);
const astStreamModded = scanner.getASTStream();

astStreamModded.subscribe(ast => {
    const epurator = new Epurator(ast);
    epurator.getSource();
});

crawler.start();
