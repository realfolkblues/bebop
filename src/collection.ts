import * as estree from 'estree';
import { IModule } from './crawler';
import Node from './node';
import * as logger from './logger';

export default class Collection {
    module: IModule
    protected collection: Node[]

    constructor(module: IModule) {
        this.module = module;
        this.collection = module.ast.body.map((node: estree.Node) => new Node(node));

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

    prune(): void {
        logger.log('Mark live nodes');

        this.getFlatCollection().forEach((node: Node) => {
            if (node.type === 'ExportNamedDeclaration') {
                node.markAsAlive();
            }
        });
    }

    getAliveNodes(): Node[] {
        return this.getFlatCollection().filter((item: Node) => item.isAlive);
    }

    get length(): number {
        return this.collection.length;
    }
}
