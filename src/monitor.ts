import Logger from './logger';
import { IFileContext } from './resolver';

export default class Monitor<T> { 
    readonly logger: Logger
    readonly registry: Map<T, boolean>

    constructor(logger: Logger) { 
        this.logger = logger;
        this.registry = new Map<T, boolean>();

        this.logger.info('Monitor');
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
        this.logger.debug('Monitor status:', this.registry);
    }

    get isConsumed(): boolean { 
        return Array.from(this.registry.values()).every((isConsumed: boolean) => !!isConsumed);
    }
}
