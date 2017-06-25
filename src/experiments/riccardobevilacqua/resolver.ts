
import { isAbsolute, join, dirname } from 'path';

export interface IResolverModule { 
    id: string,
    context?: string,
    isFileContext?: boolean
}

export class Resolver {
    cwd: string

    constructor(cwd = process.cwd()) { 
        this.cwd = cwd;
    }

    resolve(module: IResolverModule): string {
        if (isAbsolute(module.id)) { 
            return require.resolve(module.id);
        }

        if (!module.context) { 
            module.context = this.cwd;
            module.isFileContext = false;
        }

        if (module.isFileContext) {
            module.context = dirname(module.context);
        }

        const fullPath = join(module.context, module.id);  

        // @todo: is there a way to make this better?        
        try {
            return require.resolve(fullPath);
        } catch (error) {
            return require.resolve(module.id);
        }
    }
}
