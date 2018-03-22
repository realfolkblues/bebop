import Logger from './logger';

export default class Monitor<T> { 
    readonly logger: Logger
    readonly registry: Map<T, boolean>

    constructor(logger: Logger) { 
        this.logger = logger;
        this.registry = new Map<T, boolean>();

        this.logger.debug('Instantiating monitor...');
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
        this.logger.debug('Monitor status:');
        this.registry.forEach((value: boolean, key: T) => {
            this.logger.debug(`- ${key}:`, value ? 'processed' : 'in queue...');
        });
    }

    get isConsumed(): boolean { 
        return Array.from(this.registry.values()).every((isConsumed: boolean) => !!isConsumed);
    }
}
