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
                
                this.collection.push(item);
            }
        });
    }

    arrayToStream(array: estree.Node[]): Observable<INode> {
        return Observable
            .from(array)
            .map((item: estree.Node): INode => this.enrichNode(item));
    }

    children(parent: INode): INode[] {
        return this.collection.filter((item: INode) => item.parentLoc === parent.loc);
    }

    comb(): void {
        this.collection = this.collection.map((item: INode) => {
            if (item.type === 'ExportNamedDeclaration') {
                this.markNode(item);
            }
            return item;
        });
        this.logger.debug('Marked live nodes');
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

    markNode(item: INode): INode {
        item.keep = true;
        return item;
    }

    parent(child: INode): INode {
        return this.collection.find((item: INode) => item.loc === child.parentLoc);
    }

    shake(): void {
        this.collection = this.collection.filter((item: INode) => item.keep);
        this.logger.debug('Removed unnecessary nodes');
    }
}