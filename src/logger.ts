import * as chalk from 'chalk';
import { inspect } from 'util';

const debug = chalk.dim;
const log = chalk.cyan;
const info = chalk.green;
const warn = chalk.yellow;
const error = chalk.red;

export default class Logger { 

    constructor() { 
        this.debug('Instantiating logger...');
    }

    debug(...args: any[]): void {
        console.log(debug(...args));
    }

    log(...args: any[]): void { 
        console.log(log(...args));
    }

    info(...args: any[]) {
        console.info(info('\u25B6', ...args));
    }

    warn(...args: any[]): void {
        console.warn(warn(...args));
    }

    error(...args: any[]): void { 
        console.error(error(...args));
    }

    explode(obj: any): void {
        this.debug(inspect(obj));
    }
    
}
