import { dirname } from 'path';
import * as estree from 'estree';
import { replace, traverse, VisitorOption } from 'estraverse';
import { print } from 'recast';

export function visitAST(ast: estree.Program, nodeTypes: string[] = [], cb: Function): void {
    if (nodeTypes.length > 0 && cb) {
        traverse(ast, {
            enter: (node: estree.Node, parent: estree.Node): void => {
                if (nodeTypes.indexOf(node.type) > -1) {
                    cb(node, parent);
                }
            }
        });
    }
}

export function alterAST(ast: estree.Program, nodeTypes: string[] = [], cb: Function): estree.Program {
    let result: estree.Program = ast;

    if (nodeTypes.length > 0 && cb) {
        result = replace(ast, {
            enter: (node: estree.Node, parent: estree.Node): estree.Node => {
                if (nodeTypes.indexOf(node.type) > -1) {
                    return cb(node, parent);
                }
            }
        });
    }

    return result;
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

export function markAST(ast: estree.Program): estree.Program {
    let result: estree.Program | null;

    const markNode = (node) => {
        node['keep'] = true;
        return node;
    };

    return alterAST(ast, ['ExportNamedDeclaration'], (node, parent) => {
        result = alterAST(node, ['FunctionDeclaration', 'FunctionExpression'], (innerNode, innerParent) => {
            markNode(innerNode);
        });

        return result;
    });
}

export function shakeAST(ast: estree.Program): estree.Program {
    return alterAST(ast, ['FunctionDeclaration'], (node, parent) => {
        if (!node.keep) {
            return VisitorOption.Remove;
        }
    });
}

export function astToSource(ast: estree.Program): string {
    let result = '';

    if (!!ast) {
        result = print(ast).code;
    }

    return result;
}
