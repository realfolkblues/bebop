
import Crawler from './crawler';

const cwd = process.cwd();
const crawler = new Crawler('./examples/fn/01');
const astStream = crawler.getASTStream();

astStream.subscribe(ast => {
    // console.log(ast);
});

crawler.start();

