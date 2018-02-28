import * as estree from 'estree';
import * as recast from 'recast';
import * as jscodeshift from 'jscodeshift';
import { concat, flatten } from 'ramda';

// Recast
export function visitAST(ast: estree.Program, nodeType: string = '', cb: Function, deep: boolean = false): estree.Program {
    let visitor: Object = {};

    if (nodeType.length > 0 && cb && typeof cb === 'function') {
        const visitorMethodName: string = 'visit' + nodeType;

        visitor[visitorMethodName] = (nodePath) => {
            cb(nodePath);

            if (!deep) {
                return false;
            }
            
            this.traverse(nodePath);
        };

        recast.visit(ast, visitor);
    }

    return ast;
}

// JSCodeShift
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
