import * as jscodeshift from 'jscodeshift';

/**
 * Verify if nodePath has type FunctionDeclaration or VariableDeclarator, hence is a declaration with a child Identifier.
 * @param nodePath 
 */
export function isDeclaration(nodePath: jscodeshift.NodePath): boolean {
    if (nodePath && nodePath.node && nodePath.node.type && (nodePath.node.type == jscodeshift.VariableDeclarator || nodePath.node.type == jscodeshift.FunctionDeclaration)) {
        return true;
    }

    return false;
}