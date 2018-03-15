import { dirname } from 'path';
import * as estree from 'estree';
import { replace, traverse, VisitorOption } from 'estraverse';
import { print } from 'recast';

export function visitAST(rootNode: estree.Node, nodeTypes: string[] = [], cb: Function): void {
    if (nodeTypes.length > 0 && cb) {
        traverse(rootNode, {
            enter: (node: estree.Node, parent: estree.Node): void => {
                if (nodeTypes.indexOf(node.type) > -1) {
                    cb(node, parent);
                }
            }
        });
    }
}

export function alterAST(rootNode: estree.Node, nodeTypes: string[] = [], cb: Function): estree.Node {
    let result: estree.Node = rootNode;

    if (nodeTypes.length > 0 && cb) {
        result = replace(rootNode, {
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

export function first(nodeType): estree.Function {
    let result: estree.Function;

    return result;
}

export function markAST(ast: estree.Program): estree.Program {
    let result: estree.Program | null = ast;

    const markNode = (node: estree.Node) => {
        node['keep'] = true;
        return node;
    };

    const returnStatementCB = (node: estree.Node, parent: estree.Node) => {
        return alterAST(node, ['FunctionDeclaration', 'FunctionExpression'], (innerNode: estree.Node, innerParent: estree.Node) => {
            markNode(innerNode);
        });
    };

    const exportNamedDeclarationCB = (node: estree.Node, parent: estree.Node) => {
        return alterAST(node, ['FunctionDeclaration', 'FunctionExpression'], (innerNode, innerParent) => {
            markNode(innerNode);
        });
    };

    result = <estree.Program>alterAST(result, ['ReturnStatement'], returnStatementCB);
    result = <estree.Program>alterAST(result, ['ExportNamedDeclaration'], exportNamedDeclarationCB);

    return result;
}

export function shakeAST(rootNode: estree.Node): estree.Program {
    return <estree.Program>alterAST(rootNode, ['FunctionDeclaration'], (node: estree.Node, parent: estree.Node) => {
        if (!node['keep']) {
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
