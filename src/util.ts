import { dirname } from 'path';
import * as estree from 'estree';
import { replace, traverse, VisitorOption } from 'estraverse';
import { print } from 'recast';

export function visitAST(rootNode: estree.Node, nodeTypes: string[] = [], cb: Function): void {
    if (!!cb) {
        traverse(rootNode, {
            enter: (node: estree.Node, parent: estree.Node): void => {
                if ((nodeTypes.length > 0 && nodeTypes.indexOf(node.type) > -1) || nodeTypes.length === 0) {
                    cb(node, parent);
                }
            }
        });
    }
}

export function alterAST(rootNode: estree.Node, nodeTypes: string[] = [], cb: Function): estree.Node {
    let result: estree.Node = rootNode;

    if (!!cb) {
        result = replace(rootNode, {
            enter: (node: estree.Node, parent: estree.Node): estree.Node => {
                if ((nodeTypes.length > 0 && nodeTypes.indexOf(node.type) > -1) || nodeTypes.length === 0) {
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
    let result: estree.Program | null = ast;

    const markNode = (node: estree.Node): estree.Node => {
        node['keep'] = true;
        return node;
    };

    const functionDeclarationsFilter = (call, caller): boolean => {
        if (call.value.callee && caller.value.id) {
            return call.value.callee.name === caller.value.id.name;
        }
    
        return false;
    };

    const statementDeclarationsFilter = (statement, caller): boolean => {
        if (statement.value.argument && caller.value.id) {
            return statement.value.argument.name === caller.value.id.name;
        }
    
        return false;
    }

    const first = (rootNode: estree.Node, filter: Function): estree.Node => {
        let output: estree.Node = null;
    
        return output;
    };

    const callExpressionCB = (callExpressionNode: estree.CallExpression, callExpressionParent: estree.Node): estree.Node => {
        let output: estree.Node = callExpressionNode;
        const callee: estree.Identifier = <estree.Identifier>callExpressionNode.callee;

        return output;
    };

    result = <estree.Program>alterAST(result, ['CallExpression', 'ReturnStatement', 'ExportNamedDeclaration'], (node: estree.Node, parent: estree.Node): estree.Node => {
        let output: estree.Node = node;

        if (node.type === 'CallExpression') {
            output = alterAST(output, ['FunctionDeclaration', 'FunctionExpression'], (innerNode: estree.Node, innerParent: estree.Node): estree.Node => {
                return innerNode;
            });
        }

        if (node.type === 'ReturnStatement') {
            output = alterAST(output, ['FunctionDeclaration', 'FunctionExpression'], (innerNode: estree.Node, innerParent: estree.Node): estree.Node => {
                
                return innerNode;
            });
        }

        if (node.type === 'ExportNamedDeclaration') {
            output = alterAST(output, ['FunctionDeclaration', 'FunctionExpression'], (innerNode: estree.Node, innerParent: estree.Node): estree.Node => {
                return markNode(innerNode);
            });
        }

        return output;
    });

    return result;
}

export function shakeAST(ast: estree.Program): estree.Program {
    return <estree.Program>alterAST(ast, ['FunctionDeclaration'], (node: estree.Node, parent: estree.Node) => {
        if (!node['keep']) {
            return VisitorOption.Remove;
        }

        return node;
    });
}

export function astToSource(ast: estree.Program): string {
    let result = '';

    if (!!ast) {
        result = print(ast).code;
    }

    return result;
}
