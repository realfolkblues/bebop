import * as estree from 'estree';
import * as recast from 'recast';

export class NodeCollection {
    ast: estree.Program

    constructor(ast: estree.Program) {
        this.ast = ast;
    }

    get(): estree.Node[] {
        let result = [];

        if (this.ast && this.ast.body) {
            result = this.ast.body;
        }

        return result;
    }

    toSource(): string {
        let result = '';

        if (this.ast) {
            result = recast.print(this.ast).code;
        }

        return result;
    }
}
