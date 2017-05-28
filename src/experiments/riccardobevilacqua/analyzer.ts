/**
 * ******** *
 *          *
 * ANALYZER *
 *          *
 * ******** *
 * This library aims to:
 * 1) Access source code
 * 2) Detect dependencies tree and its properties
 */

const fs = require('fs');
const path = require('path');

const regexp = {
    from: /from\s+('|")(\w?.\\?)+('|")/gm,
    invokedFn: /\w+\s*\((\w*,?\s*\(?\)?\[?\]?)*\)(?!\s?{)/gm,
    declaredFn: /function\s+(\w+\.*)*\s*\((?!\s?{)/gm,
    brackets: /\((\w*,?\s*\(?\)?\[?\]?)*\)/gm
};

class Analyzer {
    entry: any = {};
    imports: any = {};

    constructor(filePath: string) {
        this.entry = path.parse(path.resolve(filePath));  
        this.readFile(this.entry.dir, './' + this.entry.base);      
        console.info(this.imports);
    }

    readFile(basePath: string, filePath: string, fallback: string = '.js') {
        const fullPath = path.join(basePath, filePath);
        let code = '';

        try {
            code = fs.readFileSync(fullPath, 'utf8');
        } catch (err) {
            if (fallback) {
                return this.readFile(basePath, filePath + fallback);
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

    loadFiles(originPath: string, code: string) {
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

    getFunctions(originPath: string, code: string) {
        let invokedFn = code.match(regexp.invokedFn) || [];
        let declaredFn = code.match(regexp.declaredFn) || [];

        this.imports[originPath].invokedFn = invokedFn.map(this.cleanFunction);
        this.imports[originPath].declaredFn = declaredFn.map(this.cleanFunction);
    }

    cleanFunction(str: string): string {
        return str
            .replace(/function/g, '')
            .replace(regexp.brackets, '')
            .replace('(', '')
            .trim();
    }
}

const analyzer = new Analyzer('./examples/fn/01/index.js');