import fs from 'fs';
import path from 'path';

import type { TVariables } from '../registries/commands';

interface IFileExistsConditionOptions {
  path: string;
}

export function execute(
  options: IFileExistsConditionOptions,
  vars: TVariables
): boolean {
  const defined = vars.defineVariable(options.path);

  console.log('? exists', defined);

  return fs.existsSync(path.join(vars.root, defined));
}
