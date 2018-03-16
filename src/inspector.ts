import * as estree from 'estree';
import { replace, traverse, VisitorOption } from 'estraverse';
import * as recast from 'recast';
import { alterAST, visitAST } from './util';

export default class Inspector {
    ast: estree.Program

    constructor(ast: estree.Program) {
        this.ast = ast;
    }

    private markNode(node: estree.Node): estree.Node {
        node['keep'] = true;
        return node;
    }

    private shakeAST(ast: estree.Program): estree.Program {
        return <estree.Program>alterAST(ast, ['FunctionDeclaration'], (node: estree.Node, parent: estree.Node) => {
            if (!node['keep']) {
                return VisitorOption.Remove;
            }
        });
    }

    getAST(): estree.Program {
        return this.ast;
    }


    toSource(): string {
        let result = '';

        if (this.ast) {
            result = recast.print(this.ast).code;
        }

        return result;
    }
}
