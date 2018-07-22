import * as estree from 'estree';
import * as logger from './logger';

const props: string[] = [
    'argument',
    'arguments',
    'body',
    'callee',
    'declaration',
    'expression',
    'id',
    'specifiers'
];

export default class Node {
    readonly node: estree.Node
    readonly type: string
    readonly location: estree.SourceLocation
    readonly parentLocation: estree.SourceLocation | null
    readonly origin: string | null
    readonly children: Node[]
    protected alive: boolean

    constructor(node: estree.Node, parent: Node = null, origin: string = null) {
        this.node = node;
        this.type = node.type
        this.location = node.loc;
        this.parentLocation = !!parent ? parent.location : null;
        this.origin = origin;
        this.children = this.extractChildren();
        this.alive = false;

        logger.debug('Instantiating node...');
    }

    protected extractChildren(): Node[] {
        let children: Node[] = [];

        props.forEach((prop: string) => {
            if (!!this.node && prop in this.node) {
                const nodes: estree.Node[] = Array.isArray(this.node[prop]) ? this.node[prop] : [this.node[prop]];

                children = [
                    ...children,
                    ...nodes.map((node: estree.Node) => new Node(node, this, prop))
                ];

                delete this.node[prop];
            }
        });

        return children;
    }

    markAsAlive(): void {
        this.alive = true;
    }

    isParentOf(child: Node): boolean {
        return !!this.location && this.location === child.parentLocation;
    }

    isChildOf(parent: Node): boolean {
        return !!this.parentLocation && this.parentLocation === parent.location;
    }

    get isAlive(): boolean {
        return this.alive;
    }
}
