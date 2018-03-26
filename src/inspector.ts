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
            .map((item: estree.Node): INode => this.generateNode(item))
            .map((item: INode): INode => {
                let result = item;

                if (item.value.hasOwnProperty('body')) {

                }

                return result;
            });
        
        this.nodeStream.subscribe({
            next: (item: INode) => {
                this.logger.debug(item.loc.start.line, item.type);
            },
            complete: () => {
                this.logger.log('^^^^^^^^^^^^^^^');
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

    generateNodeId(item: estree.Node): string {
        return item.loc.start.line + '-' + item.loc.start.column + '-' + item.loc.end.line + '-' + item.loc.end.column;
    }
}