import * as jscodeshift from 'jscodeshift';
import { concat, flatten } from 'ramda';

function functionDeclarationsFilter(call, caller) {
    if (call.value.callee && caller.value.id) {
        return call.value.callee.name === caller.value.id.name;
    }

    return false;
}

function statementDeclarationsFilter(statement, caller) {
    if (statement.value.argument && caller.value.id) {
        return statement.value.argument.name === caller.value.id.name;
    }

    return false;
}

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

const utils = {
    markFunctions: function (): void {
        this
            .find(jscodeshift.CallExpression)
            .first('Function', functionDeclarationsFilter)
            .mark();

        this
            .find(jscodeshift.ReturnStatement)
            .first('Function', statementDeclarationsFilter)
            .mark();

        this
            .find(jscodeshift.ExportNamedDeclaration)
            .find(jscodeshift.Function)
            .mark();
    },

    shake: function (): string {
        return this
            .find(jscodeshift.FunctionDeclaration)
            .filter(path => !path.keep)
            .remove();
    }
}

export default function registerUtils(): void {
    jscodeshift.registerMethods(utils);
}
