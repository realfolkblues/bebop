import * as estree from 'estree';
import { IModule } from './crawler';
import Node from './node';
import * as logger from './logger';

export default class Collection {
    module: IModule
    protected readonly collection: Node[]
    protected readonly array: Node[]

    constructor(module: IModule) {
        this.module = module;
        this.collection = module.ast.body.map((node: estree.Node) => new Node(node));
        this.array = this.getFlatCollection();

        logger.debug('Instantiating collection...');
    }

    getChildrenOf(parent: Node): Node[] {
        return this.collection.filter((node: Node) => node.isChildrenOf(parent));
    }

    getParentOf(child: Node): Node {
        return this.collection.find((node: Node) => node.isParentOf(child));
    }

    getFlatCollection(): Node[] {
        function getFlatChildrenArray(nodes: Node[]): Node[] {
            return nodes.reduce((children: Node[], node: Node) => children.concat(node.children), []);
        }

        function flatten(nodes: Node[], nodesToFlatten: Node[]) {
            const childrenNodes = getFlatChildrenArray(nodesToFlatten);

            if (childrenNodes.length === 0) {
                return nodes;
            }

            return flatten([
                ...nodes,
                ...childrenNodes
            ], childrenNodes);
        }

        return flatten(this.collection, this.collection);
    }

    markAliveNodes(): void {
        logger.log('Mark exported nodes as alive');

        this.array.forEach((node: Node) => {
            if (node.type === 'ExportNamedDeclaration') {
                node.markAsAlive();
            }
        });
    }

    getAliveNodes(): Node[] {
        return this.array.filter((node: Node) => node.isAlive);
    }

    get length(): number {
        return this.array.length;
    }
}
