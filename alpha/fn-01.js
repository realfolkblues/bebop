/**
 * This file is pure SHIT.
 * Forgive my soul: it's just a test.
 * Please.
 */

const fs = require('fs');
const path = require('path');

const regexp = {
    from: /from\s+('|")(\w?.\\?)+('|")/gm,
    invokedFn: /\w+\s*\((\w*,?\s*\(?\)?\[?\]?)*\)(?!\s?{)/gm,
    declaredFn: /function\s+(\w+\.*)*\s*\((?!\s?{)/gm,
    brackets: /\((\w*,?\s*\(?\)?\[?\]?)*\)/gm
}

class Shaker {

    constructor(entry) {
        this.entry = path.parse(path.resolve(entry));
        this.imports = {};

        this.readFile(this.entry.dir, './' + this.entry.base);

        console.log(this.imports);
    }

    readFile(basePath, filePath, fallback = '.js') {
        const fullPath = path.join(basePath, filePath);
        let code = '';

        try {
            code = fs.readFileSync(fullPath, 'utf8');
        } catch (err) {
            if (fallback) {
                return this.readFile(basePath, filePath + fallback, false);
            }

            throw err;
        }

        this.imports[fullPath] = this.imports[fullPath] || {
            code: null,
            deps: [],
            invokedFn: [],
            declaredFn: []
        };

        this.imports[fullPath].code = this.imports[fullPath].code || code;
        
        this.loadFiles(fullPath, code);
        this.getFunctions(fullPath, code);
    }

    loadFiles(originPath, code) {
        const imports = code.match(regexp.from) || [];

        imports
            .map(match => {
                let filePath = match
                    .replace('from', '')
                    .trim();
                filePath = decodeURI(filePath)
                    .replace(/'/g, '')
                    .replace(/"/g, '');

                return filePath;
            })
            .forEach(filePath => {
                const fullPath = path.join(path.dirname(originPath), filePath);
                this.imports[originPath].deps.push(fullPath);
                this.readFile(path.dirname(originPath), filePath);
            });
    }

    getFunctions(originPath, code) {
        let invokedFn = code.match(regexp.invokedFn) || [];
        let declaredFn = code.match(regexp.declaredFn) || [];

        this.imports[originPath].invokedFn = invokedFn.map(this.cleanFunction);
        this.imports[originPath].declaredFn = declaredFn.map(this.cleanFunction);
    }

    cleanFunction(str) {
        return str
            .replace(/function/g, '')
            .replace(regexp.brackets, '')
            .replace('(', '')
            .trim();
    }

}

const shaker = new Shaker('./examples/fn/01/index.js');