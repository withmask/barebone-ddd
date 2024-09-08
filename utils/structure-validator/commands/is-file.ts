import fs from 'fs';
import path from 'path';
import type { TVariables } from '../registries/commands';

export interface IIsFileOptions {
  path: string;
}

export function execute(options: IIsFileOptions, vars: TVariables): void {
  const fullPath = path.join(vars.root, vars.defineVariable(options.path));

  console.log(`$ is-file ${fullPath}`);

  if (!fs.existsSync(fullPath)) {
    console.log('rule fail', fullPath, 'does not exist');
    process.exit(1);
  }

  const stat = fs.statSync(fullPath);

  if (!stat.isFile()) {
    console.log('rule fail', fullPath, 'is not a file');
    process.exit(1);
  }
}
