export default class Logger { 

    debug(...args: any[]): void {
        console.log('    ', ...args);
    }

    log(...args: any[]): void { 
        console.log('  ', ...args);
    }

    info(...args: any[]) {
        console.log(...args);
    }

    error(...args: any[]): void { 
        console.error(...args);
    }
    
}
