
import Crawler from './crawler';
import Scanner from './scanner';
import Epurator from './epurator';

const cwd = process.cwd();
const crawler = new Crawler('./examples/fn/01');
const astStream = crawler.getASTStream();
const scanner = new Scanner(astStream);
const astStreamModded = scanner.getASTStream();

astStreamModded.subscribe(ast => {
    const epurator = new Epurator(ast);
    epurator.getSource();
});

crawler.start();

