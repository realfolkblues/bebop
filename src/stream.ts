import { Observable } from 'rxjs/Rx';

export default abstract class Stream<T> {
    abstract init(): void
    abstract get(): Observable<T>
}
