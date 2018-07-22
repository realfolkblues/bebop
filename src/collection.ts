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
        return this.array.filter((node: Node) => node.isChildOf(parent));
    }

    getParentOf(child: Node): Node {
        return this.array.find((node: Node) => node.isParentOf(child));
    }

    getIdOf(node: Node): Node {
        let result = null;

        if (node && node.children.length > 0) {
            result = node.children.find((child: Node) => child.type === 'Identifier' && child.origin === 'id');
        }

        return result;
    }

    getFlatCollection(): Node[] {
        const getFlatChildrenArray = (nodes: Node[]): Node[] => {
            return nodes.reduce((children: Node[], node: Node) => children.concat(node.children), []);
        };

        const flatten = (nodes: Node[], nodesToFlatten: Node[]): Node[] => {
            const childrenNodes = getFlatChildrenArray(nodesToFlatten);

            if (childrenNodes.length === 0) {
                return nodes;
            }

            return flatten([
                ...nodes,
                ...childrenNodes
            ], childrenNodes);
        };

        return flatten(this.collection, this.collection);
    }

    getClosestDeclaration(startingNode: Node, currentNode: Node): Node {
        let result: Node = null;

        if (startingNode && currentNode) {
            const targetName: string = startingNode.node['name'];
            const parentNode: Node = this.getParentOf(currentNode);
            const idNode: Node = this.getIdOf(currentNode);
            
    
            if ((currentNode.type !== 'FunctionDeclaration' && parentNode) ||
                (currentNode.type === 'FunctionDeclaration' && idNode && idNode.node['name'] !== targetName)) 
            {
                result = this.getClosestDeclaration(startingNode, parentNode);
            }
        }

        return result;
    }

    markAliveNodes(): void {
        logger.log('Mark live nodes');

        const nodes: Node[] = [...this.array];

        nodes.forEach((node: Node) => {
            if (node.type === 'ExportNamedDeclaration') {
                logger.info(`Detected [${node.type}] at line ${node.location.start.line}`);
                node.markAsAlive();
            } else if (node.type === 'CallExpression') {
                const callee: Node = node.children.find((child: Node) => child.type === 'Identifier' && child.origin === 'callee');
                const closestDeclaration: Node = this.getClosestDeclaration(callee, callee);

                logger.info(`Detected [${node.type}] at line ${node.location.start.line}: ${callee ? callee.node['name'] : '-'}`);
            } else if (node.type === 'ReturnStatement') {
                logger.info(`Detected [${node.type}] at line ${node.location.start.line}`);
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
