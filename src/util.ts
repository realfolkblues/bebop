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
    let result: estree.Program = ast;
    let matchingAncestors: estree.Node[] = [];

    const markNode = (node: estree.Node): estree.Node => {
        node['keep'] = true;
        return node;
    };

    const functionDeclarationsFilter = (call, caller): boolean => {
        if (call.callee && caller.id) {
            return call.callee.name === caller.id.name;
        }
    
        return false;
    };

    const statementDeclarationsFilter = (statement, caller): boolean => {
        if (statement.argument.callee && caller.id) {
            return statement.argument.callee.name === caller.id.name;
        }
    
        return false;
    }

    const first = (rootNode: estree.Node, filter: Function): estree.Node => {
        let output: estree.Node = null;

        visitAST(ast, ['FunctionDeclaration', 'FunctionExpression'], (node, parent) => {
            if (filter(rootNode, node)) {
                output = node;
            }
        });

        return output;
    };

    visitAST(result, ['CallExpression'], (node, parent) => {
        matchingAncestors.push(first(node, functionDeclarationsFilter));
    });

    visitAST(result, ['ReturnStatement'], (node, parent) => {
        matchingAncestors.push(first(node, statementDeclarationsFilter));
    });

    result = <estree.Program>alterAST(result, ['FunctionDeclaration', 'FunctionExpression'], (node, parent) => {
        if (matchingAncestors.indexOf(node) > -1) {
            return markNode(node);
        }
    });

    result = <estree.Program>alterAST(result, ['ExportNamedDeclaration'], (node, parent) => {
        return alterAST(node, ['FunctionDeclaration', 'FunctionExpression'], (innerNode, innerParent) => {
            return markNode(innerNode);
        });
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
