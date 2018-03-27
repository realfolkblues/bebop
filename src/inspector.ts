import * as estree from 'estree';
import { Observable, Subject } from 'rxjs/Rx';
import * as uuid from 'uuid/v4';
import Logger from './logger';
import Stream from './stream';

export interface INode {
    loc: estree.SourceLocation
    parentLoc: estree.SourceLocation
    type: string
    value: estree.Node
}

export default class Inspector {
    logger: Logger
    nodeStream: Observable<INode>

    constructor(logger: Logger) { 
        this.logger = logger;

        this.logger.debug('Instantiating inspector...');
    }

    init(ast: estree.Program): void {
        this.nodeStream = Observable
            .from(ast.body)
            .map((item: estree.Node): INode => {
                let result = this.generateNode(item);

                if (result.value.hasOwnProperty('body')) {

                }

                return result;
            });
        
        this.nodeStream.subscribe({
            next: (item: INode): void => {
                this.logger.debug(item.loc.start.line, item.type);
            },
            complete: (): void => {
                this.logger.debug('----------------------------');
            }
        });
    }

    generateNode(item: estree.Node): INode {
        let result = <INode>{
            loc: item.loc,
            parentLoc: null,
            type: item.type,
            value: item
        };

        return result;
    }
}