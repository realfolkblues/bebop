import * as estree from 'estree';
import { traverse } from 'estraverse';

export function visitAST(ast: estree.Program, nodeType: string = '', cb: Function): estree.Program {
    let visitor: Object = {};

    if (nodeType.length > 0 && cb && typeof cb === 'function') {
        traverse(ast, {
            enter: (node, parent) => {
                if (node.type === nodeType) {
                    cb(node, parent);
                }
            }
        });
    }

    return ast;
}
