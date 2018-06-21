import * as estree from 'estree';
import * as logger from './logger';

const props: string[] = [
    'body',
    'arguments',
    'argument'
];

export default class Node {
    readonly value: estree.Node
    readonly loc: estree.SourceLocation
    readonly parentLoc: estree.SourceLocation | null
    readonly type: string
    protected alive: boolean
    protected childrenNodes: Node[]

    constructor(node: estree.Node, parent: estree.Node = null) {
        this.value = node;
        this.loc = node.loc;
        this.parentLoc = !!parent ? parent.loc : null;
        this.type = node.type
        this.alive = false;
        this.childrenNodes = [];

        this.populate();

        logger.debug('Instantiating node...');
    }

    protected populate(): void {
        props.forEach((prop: string) => {
            if (this.value.hasOwnProperty(prop)) {
                const childrenNodes = Array.isArray(this.value[prop]) ? this.value[prop] : [this.value[prop]];

                this.childrenNodes = [
                    ...this.childrenNodes,
                    ...childrenNodes.map((childNode: estree.Node) => new Node(childNode, this.value))
                ];
            }

            // delete item.value[prop];
        });
    }

    markAsAlive(): void {
        this.alive = true;
    }

    isParentOf(child: Node): boolean {
        return !!this.loc && this.loc === child.parentLoc;
    }

    isChildOf(parent: Node): boolean {
        return !!this.parentLoc && this.parentLoc === parent.loc;
    }

    get isAlive(): boolean {
        return this.alive;
    }

    get children(): Node[] {
        return this.childrenNodes;
    }
}
