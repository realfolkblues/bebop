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

/**
 * Create attribute references for a given nodePath and apply a unitary increment
 * @param nodePath 
 */
export function increaseReference(nodePath: jscodeshift.NodePath): jscodeshift.NodePath {
    if (parseInt(nodePath['references']) > -1) {
        nodePath.references++;
    } else {
        nodePath['references'] = 1;
    }

    return nodePath;
}