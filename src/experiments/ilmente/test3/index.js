
const Resolver = require('./resolver');

const resolver = new Resolver();
// const filesStream = resolver.getFilesStream();

// filesStream.subscribe(v => console.log(v));

// resolver.start();

resolver.resolve('./examples/fn/01/lib', process.cwd() + '/examples/fn/01/index.js');

// console.log(require.resolve.toString());

