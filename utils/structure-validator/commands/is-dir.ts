import fs from 'fs';
import path from 'path';
import type { TVariables } from '../registries/commands';

interface IIsDirCommandOptions {
  paths: string[];
}

export function execute(options: IIsDirCommandOptions, vars: TVariables): void {
  for (const toCheck of options.paths) {
    const fullPath = path.join(vars.root, vars.defineVariable(toCheck));

    console.log(`$ is-dir ${fullPath}`);

    if (!fs.existsSync(fullPath)) {
      console.log('rule fail', fullPath, 'does not exist');
      process.exit(1);
    }

    const stat = fs.statSync(fullPath);

    if (!stat.isDirectory()) {
      console.log('rule fail', fullPath, 'is not a directory');
      process.exit(1);
    }
  }
}
