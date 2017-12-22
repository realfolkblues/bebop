import * as babelTypes from 'babel-types';
import * as recast from 'recast';

export function visitAST(ast: babelTypes.File, nodeType: string = '', cb: Function, deep: boolean = true): void {
    let visitor: Object = {};

    if (nodeType.length > 0) {
        const visitorMethodName: string = 'visit' + nodeType;
        visitor[visitorMethodName] = (nodePath) => {
            cb(nodePath);

            if (deep) {
                this.traverse(nodePath);
            }

            return false;
        };
    }

}