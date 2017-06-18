
const path = require('path');
const cwd = process.cwd();

module.exports = class Resolver {

    constructor(contextDir = cwd) { 
        this.contextDir = contextDir;
    }

    entry(filename) {
        if (path.isAbsolute()) { 
            return require.resolve(filename);
        }

        const entry = path.join(this.contextDir, filename);
        return require.resolve(entry);
    }

    dependency(dependency, callerAbsolutePath) { 
        if (path.isAbsolute()) {
            return require.resolve(dependency);
        }

        const callerDir = path.dirname(callerAbsolutePath);
        const dependencyAbsolutePath = path.join(callerAbsolutePath, dependency);
        return require.resolve(dependencyAbsolutePath);
    }

}

