
import Crawler from './crawler';
import Scanner from './scanner';

const cwd = process.cwd();
const crawler = new Crawler('./examples/fn/01');
const astStream = crawler.getASTStream();
const scanner = new Scanner(astStream);
const astStreamModded = scanner.getASTStream();

astStreamModded.subscribe(ast => {
    console.log(ast);
});

crawler.start();

