import * as logger from './logger';

export default class Monitor<T> {
    readonly registry: Map<T, boolean>

    constructor() {
        this.registry = new Map<T, boolean>();

        logger.debug('Instantiating monitor...');
    }

    add(key: T): T {
        this.registry.set(key, false);
        return key;
    }

    consume(key: T): T {
        this.registry.set(key, true);
        return key;
    }

    logStatus() {
        logger.debug('Monitor status:');

        this.registry.forEach((value: boolean, key: T) => {
            logger.debug(`- ${key}:`, value ? 'processed' : 'in queue...');
        });
    }

    get isConsumed(): boolean {
        return Array.from(this.registry.values()).every((isConsumed: boolean) => !!isConsumed);
    }
}
