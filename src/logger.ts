import * as chalk from 'chalk';
import { inspect } from 'util';

const color = {
    debug: chalk.dim,
    log: chalk.cyan,
    info: chalk.green,
    warn: chalk.yellow,
    error: chalk.red
}

export function debug(...args: any[]): void {
    console.log(color.debug(...args));
}

export function log(...args: any[]): void {
    console.log(color.log(...args));
}

export function info(...args: any[]) {
    console.info(color.info('\u25B6', ...args));
}

export function warn(...args: any[]): void {
    console.warn(color.warn(...args));
}

export function error(...args: any[]): void {
    console.error(color.error(...args));
}

export function explode(...args: any[]): void {
    [...args].map((item) => debug(inspect(item)));
}
