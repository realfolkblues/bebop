import { Observable } from 'rxjs/Rx';
import Logger from './logger';

export default abstract class Stream<T> { 
    logger: Logger

    constructor(logger: Logger, description: string) { 
        this.logger = logger;
        this.logger.info(description);
        this.logger.debug(`Instantiating class ${this.constructor.name}`);
    }

    abstract init(): void
    abstract get(): Observable<T>

}
