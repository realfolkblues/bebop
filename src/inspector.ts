import * as estree from 'estree';
import { Observable, Subject } from 'rxjs/Rx';
import * as uuid from 'uuid/v4';
import Logger from './logger';
import Stream from './stream';

export interface INode {
    id: string
    parentId: string
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
                return <INode>{
                    id: this.generateNodeId(item),
                    parentId: uuid(),
                    value: item
                };
            });
        
        this.nodeStream.subscribe({
            next: (item: INode) => {
                this.logger.debug(item.id);
            },
            complete: () => {
                this.logger.log('^^^^^^^^^^^^^^^');
            }
        });
    }

    generateNodeId(item: estree.Node): string {
        return item.loc.start.line + '-' + item.loc.start.column + '-' + item.loc.end.line + '-' + item.loc.end.column;
    }
}