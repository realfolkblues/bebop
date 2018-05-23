import * as estree from 'estree';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import { IModule } from './crawler';
import Node from './node';
import * as logger from './logger';

export interface IExtraction {
    node: Node
    children: estree.Node[]
}

export default class Collection {
    private collection: Node[] = []

    constructor() {
        logger.debug('Instantiating collection...');
    }

    getChildrenOf(parent: Node): Node[] {
        return this.collection.filter((node: Node) => node.isChildrenOf(parent));
    }

    getParentOf(child: Node): Node {
        return this.collection.find((node: Node) => node.isParentOf(child));
    }

    comb(): void {
        this.collection = this.collection.map((item: Node) => {
            if (item.type === 'ExportNamedDeclaration') {
                item.markAsAlive();
            }
            return item;
        });

        logger.log('Marked live nodes');
    }

    shake(): void {
        this.collection = this.collection.filter((item: Node) => item.isAlive);
        logger.log('Removed unnecessary nodes');
    }
}
