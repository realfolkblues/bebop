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
    collection: INode[] = []

    constructor(logger: Logger) { 
        this.logger = logger;

        this.logger.debug('Instantiating inspector...');
    }

    init(ast: estree.Program): void {        
        this.analyzeStream(this.arrayToStream(ast.body));
    }

    analyzeStream(stream: Observable<INode>): void {
        stream.subscribe({
            next: (item: INode): void => {
                if (item.value.hasOwnProperty('body')) {
                    let children: estree.Node[] = [item.value['body']];
                    
                    if (Array.isArray(item.value['body'])) {
                        children = [...item.value['body']];
                    }

                    delete item.value['body'];
                    
                    this.analyzeStream(this.arrayToStream(children));
                }
                this.logger.explode(item);
                this.collection.push(item);
            },
            complete: (): void => {
                this.logger.debug('----------------------------');
            }
        });
    }

    arrayToStream(array: estree.Node[]): Observable<INode> {
        return Observable
            .from(array)
            .map((item: estree.Node): INode => this.enrichNode(item));
    }

    enrichNode(item: estree.Node, parentLoc: estree.SourceLocation = null): INode {
        return <INode>{
            keep: false,
            loc: item.loc,
            parentLoc: parentLoc,
            type: item.type,
            value: item
        };
    }
}