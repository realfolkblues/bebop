
import * as fs from 'fs';
import { isAbsolute, join, dirname, sep as separator } from 'path';

export interface IResolverModule {
    id: string,
    context?: string
}

export class Resolver {
    cwd: string

    constructor(cwd = process.cwd()) {
        this.cwd = cwd;
    }

    resolve(module: IResolverModule): string {
        if (isAbsolute(module.id) || this.isDependencyModule(module.id)) {
            return require.resolve(module.id);
        }

        if (!module.context) {
            module.context = this.cwd;
        }

        const fullPath = join(module.context, module.id);
        return require.resolve(fullPath);
    }

    isDependencyModule(id) {
        return (
            id.indexOf('@') === 0
            || id.indexOf(separator) < 0
        );
    }
}
