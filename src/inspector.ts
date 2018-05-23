import * as estree from 'estree';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import * as logger from './logger';

export interface INode {
    keep: boolean
    loc: estree.SourceLocation
    parentLoc: estree.SourceLocation
    type: string
    value: estree.Node
}

export interface IExtraction {
    node: INode
    children: estree.Node[]
}

export default class Inspector {
    collection: INode[] = []

    constructor() {
        logger.debug('Instantiating inspector...');
    }

    init(ast: estree.Program): void {
        this.analyzeStream(this.arrayToStream(ast.body));
    }

    analyzeStream(stream: Observable<INode>): void {
        stream.subscribe({
            next: (item: INode): void => {
                const props: string[] = [
                    'body',
                    'arguments',
                    'argument'
                ];
                let children: estree.Node[] = [];

                props.forEach((prop: string) => {
                    children.concat(this.extractFrom(item, prop));
                    delete item.value[prop];
                });

                if (children.length > 0) {
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

        logger.log('Marked live nodes');
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

    extractFrom(item: INode, prop: string): estree.Node[] {
        let children: estree.Node[] = [];

        if (item.value.hasOwnProperty(prop)) {
            children = [item.value[prop]];

            if (Array.isArray(item.value[prop])) {
                children = [...item.value[prop]];
            }
        }

        return children;
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
        logger.log('Removed unnecessary nodes');
    }
}
