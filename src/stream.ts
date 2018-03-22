import { Observable } from 'rxjs/Rx';
import Logger from './logger';

export default abstract class Stream<T> { 
    logger: Logger

    constructor(logger: Logger) { 
        this.logger = logger;
    }

    abstract init(): void
    abstract get(): Observable<T>

}
