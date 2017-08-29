import { resolve, dirname } from 'path';
import { Observable } from 'rxjs/Rx';
import Crawler from './crawler';
import { IResolverModule } from './resolver';

export default class Monitor { 
    fileStack: string[] = []
    fileStream: Observable<string>
    
    constructor(crawler: Crawler) {
        this.fileStream = crawler.discoverFiles();

        this.start();
    }

    start(): void {
        this.fileStream.subscribe({
            next: (fullPath: string) => {
                console.log('Monitor intercepted [' + fullPath + ']');
            }
        });
    }
}