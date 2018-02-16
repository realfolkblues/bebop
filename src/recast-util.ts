import * as babelTypes from 'babel-types';
import * as recast from 'recast';

export function parseCode(sourceCode: string): babelTypes.File {
    if (!!sourceCode) {
        return recast.parse(sourceCode);
    }
}

export function visitAST(ast: babelTypes.File, nodeType: string = '', cb: Function, deep: boolean = false): babelTypes.File {
    let visitor: Object = {};

    if (nodeType.length > 0 && cb && typeof cb === 'function') {
        const visitorMethodName: string = 'visit' + nodeType;

        visitor[visitorMethodName] = (nodePath) => {
            cb(nodePath);

            if (!deep) {
                return false;
            }
            
            this.traverse(nodePath);
        };

        recast.visit(ast, visitor);
    }

    return ast;
}