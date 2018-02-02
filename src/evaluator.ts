import * as jscodeshift from 'jscodeshift';
import { Observable, Subject } from 'rxjs/Rx';
import { File } from 'babel-types';
import Scanner from './scanner';
import { IASTModule } from './crawler';

export default class Evaluator {
    scanner: Scanner
    evaluatedAstSubject: Subject<File>

    constructor(scanner: Scanner) {
        this.scanner = scanner;
        this.evaluatedAstSubject = new Subject<File>();
    }

    getEvaluatedASTStream() {
        const astModuleStream: Observable<IASTModule> = this.scanner.getASTStream();

        const astModuleStreamObserver = astModuleStream
            .subscribe({
                next: (astModule: IASTModule) => this.enrich(astModule.ast),
                error: (err: Error) => console.error(err),
                complete: () => console.log('Evaluation completed')
            });
        
        return astModuleStream;
    }

    start(): void {
        this.scanner.start();
    }

    enrich(ast: File): File {
        console.log('===== EVALUATING FILE =====');
        const collection = jscodeshift(ast);
        collection.markFunctions();
        collection.shake();

        console.log(collection.toSource());
        console.log('===== END EVALUATING FILE =====');

        return collection.getAST();
    }

}
