import * as jscodeshift from 'jscodeshift';
import { Observable, Subject } from 'rxjs/Rx';
import Stream from './stream';
import Inspector from './inspector';
import Collection from './collection';
import Node from './node';
import * as logger from './logger';

export default class Linker extends Stream<Collection> {
    readonly inspector: Inspector
    readonly registry: Map<string, Collection>
    readonly depRegistry: Map<string, string[]>
    readonly stream: Subject<Collection>

    constructor(inspector: Inspector) {
        super();
        this.inspector = inspector;
        this.registry = new Map<string, Collection>();
        this.depRegistry = new Map<string, string[]>();
        this.stream = new Subject<Collection>();

        logger.debug('Instantiating linker...');
    }

    init(): void {
        this.inspector.init();
    }

    get(): Observable<Collection> {
        const observable = this.inspector
            .get()
            .merge(this.stream.asObservable())
            .map((collection: Collection) => this.add(collection))
            .share();

        observable.subscribe({
            next: (newCollection: Collection) => {
                this.registry.forEach((collection: Collection, fullPath: string) => {
                    if (fullPath !== newCollection.module.fullPath && !this.isLinked(collection)) {
                        this.stream.next(collection);
                    }
                });
            }
        });

        const [linked, inProgress] = observable
            .partition((collection: Collection) => this.isLinked(collection));

        inProgress.subscribe({
            next: (collection: Collection) => {
                logger.debug(`Collection ${collection.module.fullPath} not fully linked`);
            }
        });

        return linked;
    }

    add(collection: Collection): Collection {
        logger.info(`Linking collection...`);

        if (!this.registry.has(collection.module.fullPath)) {
            logger.log(`${collection.module.fullPath} registered for linking`);
            this.registry.set(collection.module.fullPath, collection);
        }

        return collection;
    }

    isLinked(collection: Collection): boolean {
        if (collection.module.dependencyPaths.length === 0) {
            return true;
        }

        return collection.module.dependencyPaths.every((dep: string) => this.registry.has(dep));
    }
}
