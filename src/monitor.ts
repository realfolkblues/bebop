import { BehaviorSubject, Observable } from 'rxjs/Rx';
import Crawler from './crawler';

export interface IMonitorModule {
    fullPath: string,
    processed: boolean
}

export default class Monitor { 
    fileStream: Observable<string>
    stackStream: BehaviorSubject<IMonitorModule[]> = new BehaviorSubject([])
    
    constructor(crawler: Crawler) {
        this.fileStream = crawler.discoverFiles();

        this.start();
    }

    addMonitorModule(fullPath: string): IMonitorModule[] {
        const snapshot = this.stackStream.getValue();

        snapshot.push(<IMonitorModule>{
            fullPath,
            processed: false
        });

        this.stackStream.next(snapshot);

        return this.stackStream.getValue();
    }

    start(): void {
        this.stackStream.subscribe({
            next: (stack: IMonitorModule[]) => {
                console.info('Monitor stack', stack);
            },
            error: (err: Error) => {
                console.error(err);
            }
        });

        this.fileStream.subscribe({
            next: (fullPath: string) => {
                this.addMonitorModule(fullPath);
            },
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Monitor file stream completed');
            }
        });
    }
}