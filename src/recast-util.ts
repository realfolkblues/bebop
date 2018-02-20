import * as estree from 'estree';
import * as recast from 'recast';

export function visitAST(ast: estree.Program, nodeType: string = '', cb: Function, deep: boolean = false): estree.Program {
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