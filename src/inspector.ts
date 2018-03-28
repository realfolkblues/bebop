import * as estree from 'estree';
import { Observable, Subject } from 'rxjs/Rx';
import Logger from './logger';
import Stream from './stream';

export interface INode {
    keep: boolean
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
            .map((item: estree.Node): INode => this.enrichNode(item));
        
        this.nodeStream.subscribe({
            next: (item: INode): void => {
                this.logger.debug(item.loc.start.line, item.type);
            },
            complete: (): void => {
                this.logger.debug('----------------------------');
            }
        });
    }

    enrichNode(item: estree.Node, parentLoc: estree.SourceLocation = null): INode {
        let result = <INode>{
            keep: false,
            loc: item.loc,
            parentLoc: parentLoc,
            type: item.type,
            value: item
        };

        return result;
    }
}