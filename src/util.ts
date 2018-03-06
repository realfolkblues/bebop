import { dirname } from 'path';
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

export function getDependencyId(node: any): string {
    let result = '';

    if (node && node.source && node.source.value) {
        result = node.source.value;
    }

    return result;
}

export function getDependencyFolder(node: any): string {
    let result = '';

    if (node && node.loc && node.loc.source) {
        result = dirname(node.loc.source);
    }

    return result;
}
