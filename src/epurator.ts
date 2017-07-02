import * as babelTypes from 'babel-types';
import { Observable, Subject } from 'rxjs/Rx';
import * as jscodeshift from 'jscodeshift';

export default class Epurator {
    epurateDeclaredFn(astCollection: jscodeshift.Collection): jscodeshift.Collection {
        return astCollection
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

    convertToSource(astCollection: jscodeshift.Collection): void {
        console.log('=====================');
        console.info(astCollection.toSource());
    }
}