import { resolve, dirname } from 'path';
import { Observable, BehaviorSubject } from 'rxjs/Rx';
import Crawler from './crawler';

export default class Monitor { 
    crawler: Crawler
    fileStack: string[] = []
    
    constructor(crawler: Crawler) {
        this.crawler = crawler;
    }

    start(): void {
        console.log('Monitor started');
        // const pathStream: Observable<string> = this.crawler.discoverFiles();
        
        // pathStream.subscribe({
        //     next: (fullPath: string) => {
        //         console.log('Monitor intercepted [' + fullPath + ']');
        //     }
        // });
    }
}