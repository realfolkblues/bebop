import { dirname } from 'path';
import * as estree from 'estree';
import { traverse, VisitorOption } from 'estraverse';

export function visitAST(ast: estree.Program, nodeType: string = '', cb: Function, filter: boolean = true): estree.Program {
    let visitor: Object = {};

    if (nodeType.length > 0 && cb && typeof cb === 'function') {
        traverse(ast, {
            enter: (node: estree.Node, parent: estree.Node): void => {
                if ((node.type === nodeType || nodeType === '') && filter) {
                    cb(node, parent);
                }
            }
        });
    }

    return ast;
}

export function getDependencyId(node: estree.ImportDeclaration): string {
    let result: string = '';

    if (node && node.source && node.source.value && typeof node.source.value === 'string') {
        result = node.source.value;
    }

    return result;
}

export function getDependencyFolder(node: estree.ImportDeclaration): string {
    let result: string = '';

    if (node && node.loc && node.loc.source) {
        result = dirname(node.loc.source);
    }

    return result;
}

export function markFunctions(ast: estree.Program): void {
    const exportNamedDeclarationCB = (node, parent): void => {
        
    }

    visitAST(ast, 'ExportNamedDeclaration', exportNamedDeclarationCB);
}

export function shakeAST(ast: estree.Program): estree.Program {
    const functionDeclarationCB = (node, parent) => {
        if (!node.keep) {
            return VisitorOption.Remove;
        }
    };

    return visitAST(ast, 'FunctionDeclaration', functionDeclarationCB);
}
