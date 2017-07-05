import * as babelTypes from 'babel-types';
import { Observable, Subject } from 'rxjs/Rx';
import * as jscodeshift from 'jscodeshift';

export default class Epurator {
    astCollection: jscodeshift.Collection

    constructor(ast: babelTypes.File) {
        this.astCollection = jscodeshift(ast);
    }

    epurateDeclaredFn(): void {
        this.astCollection
            .find(jscodeshift.FunctionDeclaration)
            .forEach(nodePath => {
                if (!nodePath.references) {
                    if (nodePath.parent.value.type === 'ExportNamedDeclaration') {
                        nodePath.parent.replace();
                    } else {
                        nodePath.replace();
                    }
                }
            });
    }

    getSource(): void {
        console.log('=====================');
        this.epurateDeclaredFn();
        console.info(this.astCollection.toSource());
    }
}