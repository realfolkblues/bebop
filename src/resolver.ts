import * as fs from 'fs';
import { isAbsolute, join, dirname, basename, sep as separator } from 'path';

const defaultCwd = process.cwd();

export interface IFileContext {
    id: string,
    base: string
}

export interface IFileInfo {
    context: IFileContext
    fullPath: string
}

export default class Resolver {
    readonly cwd: string

    constructor(cwd: string = defaultCwd) {
        this.cwd = cwd;
    }

    resolve(context: IFileContext): IFileInfo {
        if (isAbsolute(context.id) || this.isNodeModule(context.id)) {
            const modulePath = require.resolve(context.id);
            context.id = basename(modulePath);
            context.base = dirname(modulePath);
        }

        if (!context.base) {
            context.base = this.cwd;
        }

        return <IFileInfo>Object.assign({
            context,
            fullPath: require.resolve(join(context.base, context.id))
        });
    }

    isNodeModule(id) {
        return (
            id.indexOf('@') === 0
            || id.indexOf(separator) < 0
        );
    }
}
