import * as estree from 'estree';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import { IModule } from './crawler';
import * as logger from './logger';

export default class Node {
    protected alive: boolean
    readonly value: estree.Node
    readonly loc: estree.SourceLocation
    readonly parentLoc: estree.SourceLocation | null
    readonly type: string

    constructor(node: estree.Node, parent: estree.Node = null) {
        this.value = node;
        this.loc = node.loc;
        this.parentLoc = !!parent ? parent.loc : null;
        this.type = node.type
        this.alive = false;
        logger.debug('Instantiating node...');
    }

    // children(parent: INode): INode[] {
    //     return this.collection.filter((item: INode) => item.parentLoc === parent.loc);
    // }

    markAsAlive(): void {
        this.alive = true;
    }

    isParentOf(child: Node): boolean {
        return !!this.loc && this.loc === child.parentLoc;
    }

    isChildrenOf(parent: Node): boolean {
        return !!this.parentLoc && this.parentLoc === parent.loc;
    }

    get isAlive(): boolean {
        return this.alive;
    }

    // parent(child: INode): INode {
    //     return this.collection.find((item: INode) => item.loc === child.parentLoc);
    // }
}
