import * as fs from 'fs';
import { isAbsolute, join, dirname, basename, sep as separator } from 'path';

export default class Resolver {
    readonly cwd: string

    constructor(cwd: string) {
        this.cwd = cwd;
    }

    resolve(id: string, base: string = this.cwd): string {
        if (isAbsolute(id) || this.isNodeModule(id)) {
            return require.resolve(id);
        }

        return require.resolve(join(base, id));
    }

    isNodeModule(id: string) {
        return (
            id.indexOf('@') === 0
            || id.indexOf(separator) < 0
        );
    }
}
